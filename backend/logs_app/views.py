from datetime import timedelta
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
 
from logs_app.models import AuditLog
from logs_app.logs_serializers import AuditLogSerializer
from logs_app.logs_filters import AuditLogFilter
from users.models import LoginHistory
from users.permissions import IsAdminRole
 
 
# ─────────────────────────────────────────────────────────────────────────────
# 8.3.1 — CONSULTATION DES LOGS
# GET /api/logs/
# L'admin voit toutes les actions effectuées dans le système.
# ─────────────────────────────────────────────────────────────────────────────
class AuditLogListView(APIView):
    """
    Liste tous les logs d'audit avec filtres.
    Accessible uniquement par l'administrateur.
 
    Paramètres disponibles :
      ?action_type=LOGIN
      ?user_id=3
      ?target_model=Ticket
      ?target_id=5
      ?is_suspicious=true
      ?ip_address=192.168.1.1
      ?date_from=2026-01-01
      ?date_to=2026-12-31
      ?search=ahmed
      ?ordering=-created_at
    """
    permission_classes = [IsAuthenticated, IsAdminRole]
 
    def get(self, request):
        queryset = AuditLog.objects.select_related('user').all()
 
        # Appliquer les filtres
        log_filter = AuditLogFilter(request.GET, queryset=queryset)
        queryset   = log_filter.qs
 
        # Tri : par défaut du plus récent au plus ancien
        ordering = request.GET.get('ordering', '-created_at')
        allowed  = ['created_at', '-created_at']
        if ordering in allowed:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-created_at')
 
        # Pagination simple
        page      = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 50))
        start     = (page - 1) * page_size
        end       = start + page_size
 
        total      = queryset.count()
        page_data  = queryset[start:end]
        serializer = AuditLogSerializer(page_data, many=True)
 
        return Response({
            'total':     total,
            'page':      page,
            'page_size': page_size,
            'pages':     (total + page_size - 1) // page_size,
            'results':   serializer.data,
        })
 
 
# ─────────────────────────────────────────────────────────────────────────────
# 8.3.2 — AUDIT DES ACTIONS
# GET /api/logs/audit/user/<id>/
# GET /api/logs/audit/ticket/<id>/
# L'admin cherche précisément "qui a fait quoi sur cet objet".
# ─────────────────────────────────────────────────────────────────────────────
class AuditByUserView(APIView):
    """
    Toutes les actions effectuées PAR un utilisateur précis.
    GET /api/logs/audit/user/<user_id>/
    """
    permission_classes = [IsAuthenticated, IsAdminRole]
 
    def get(self, request, user_id):
        logs = AuditLog.objects.select_related('user').filter(
            user__id=user_id
        ).order_by('-created_at')
 
        serializer = AuditLogSerializer(logs, many=True)
        return Response({
            'user_id': user_id,
            'count':   logs.count(),
            'results': serializer.data,
        })
 
 
class AuditByTicketView(APIView):
    """
    Toutes les actions effectuées SUR un ticket précis.
    GET /api/logs/audit/ticket/<ticket_id>/
    """
    permission_classes = [IsAuthenticated, IsAdminRole]
 
    def get(self, request, ticket_id):
        logs = AuditLog.objects.select_related('user').filter(
            target_model='Ticket',
            target_id=str(ticket_id)
        ).order_by('-created_at')
 
        serializer = AuditLogSerializer(logs, many=True)
        return Response({
            'ticket_id': ticket_id,
            'count':     logs.count(),
            'results':   serializer.data,
        })
 
 
# ─────────────────────────────────────────────────────────────────────────────
# 8.3.3 — DÉTECTION DES ANOMALIES
# GET /api/logs/anomalies/
# L'admin voit uniquement les logs marqués comme suspects.
# ─────────────────────────────────────────────────────────────────────────────
class AnomalyListView(APIView):
    """
    Liste uniquement les logs suspects (is_suspicious=True).
    Ce sont les alertes de sécurité que l'admin doit traiter.
    GET /api/logs/anomalies/
    """
    permission_classes = [IsAuthenticated, IsAdminRole]
 
    def get(self, request):
        logs = AuditLog.objects.select_related('user').filter(
            is_suspicious=True
        ).order_by('-created_at')
 
        serializer = AuditLogSerializer(logs, many=True)
        return Response({
            'count':   logs.count(),
            'results': serializer.data,
        })
 
 
# ─────────────────────────────────────────────────────────────────────────────
# GET /api/logs/stats/
# Statistiques globales pour le dashboard admin.
# ─────────────────────────────────────────────────────────────────────────────
class LogStatsView(APIView):
    """
    Statistiques des logs pour le dashboard admin :
    - Nombre de connexions aujourd'hui
    - Nombre d'échecs de connexion aujourd'hui
    - Nombre d'alertes sécurité non traitées
    - Top 5 des IPs suspectes
    GET /api/logs/stats/
    """
    permission_classes = [IsAuthenticated, IsAdminRole]
 
    def get(self, request):
        today = timezone.now().date()
 
        # Connexions réussies aujourd'hui
        logins_today = LoginHistory.objects.filter(
            login_date__date=today,
            success=True
        ).count()
 
        # Échecs de connexion aujourd'hui
        failures_today = LoginHistory.objects.filter(
            login_date__date=today,
            success=False
        ).count()
 
        # Alertes de sécurité totales non traitées
        security_alerts = AuditLog.objects.filter(
            is_suspicious=True,
            action_type=AuditLog.ActionType.SECURITY_ALERT
        ).count()
 
        # IPs avec le plus d'échecs sur les 24 dernières heures
        from django.db.models import Count
        since_24h = timezone.now() - timedelta(hours=24)
        suspicious_ips = (
            LoginHistory.objects
            .filter(success=False, login_date__gte=since_24h)
            .values('ip_address')
            .annotate(failures=Count('id'))
            .order_by('-failures')[:5]
        )
 
        # Dernières 5 alertes sécurité
        last_alerts = AuditLog.objects.filter(
            is_suspicious=True
        ).order_by('-created_at')[:5]
 
        return Response({
            'logins_today':     logins_today,
            'failures_today':   failures_today,
            'security_alerts':  security_alerts,
            'suspicious_ips':   list(suspicious_ips),
            'last_alerts':      AuditLogSerializer(last_alerts, many=True).data,
        })