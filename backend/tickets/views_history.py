 #RÔLE : Historique des tickets selon le rôle de l'utilisateur.
# CLIENT     → historique de ses propres tickets uniquement
# AGENT      → historique des tickets qui lui sont/ont été assignés
# SUPERVISEUR → historique de TOUS les tickets du portail
# ADMIN      → tous les logs de tous les tickets (via audit_logs)
 
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
 
from tickets.models import Ticket, TicketStatusHistory
from tickets.filters import TicketFilter
from logs_app.models import AuditLog
 
 
def user_can_access_ticket(ticket, user):
    role = user.role.name
    if role == 'CLIENT':
        return ticket.client == user
    if role == 'AGENT':
        return ticket.assigned_agent == user
    return True
 
 
# ─────────────────────────────────────────────────────────────────────────────
# GET /api/tickets/history/
# Historique de tous les tickets accessibles selon le rôle
# ─────────────────────────────────────────────────────────────────────────────
class TicketHistoryListView(APIView):
    """
    Renvoie la liste de tous les tickets avec leur dernière action.
    Chaque rôle voit uniquement ses tickets :
    - CLIENT     → ses propres tickets
    - AGENT      → tickets assignés (passés et présents)
    - SUPERVISEUR → tous les tickets du portail
    - ADMIN       → tous les tickets du portail
    """
    permission_classes = [IsAuthenticated]
 
    def get(self, request):
        user = request.user
        role = user.role.name
 
        # Filtrer selon le rôle
        if role == 'CLIENT':
            queryset = Ticket.objects.filter(client=user)
        elif role == 'AGENT':
            # L'agent voit les tickets qu'il traite ET qu'il a traités
            from tickets.models import TicketAssignment
            ticket_ids = TicketAssignment.objects.filter(
                assigned_to=user
            ).values_list('ticket_id', flat=True)
            queryset = Ticket.objects.filter(id__in=ticket_ids)
        else:
            # SUPERVISOR et ADMIN voient tout
            queryset = Ticket.objects.all()
 
        # Appliquer les filtres de l'URL
        ticket_filter = TicketFilter(request.GET, queryset=queryset)
        queryset      = ticket_filter.qs.order_by('-updated_at')
 
        # Pagination
        page      = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        start     = (page - 1) * page_size
        end       = start + page_size
        total     = queryset.count()
 
        data = []
        for ticket in queryset.select_related(
            'client', 'assigned_agent', 'sla_rule'
        )[start:end]:
            # Dernière action sur ce ticket
            last_action = TicketStatusHistory.objects.filter(
                ticket=ticket
            ).select_related('changed_by').order_by('-changed_at').first()
 
            data.append({
                'ticket_number':  ticket.ticket_number,
                'title':          ticket.title,
                'current_status': ticket.current_status,
                'priority':       ticket.priority,
                'client':         (
                    f"{ticket.client.first_name} {ticket.client.last_name}"
                ),
                'assigned_agent': (
                    f"{ticket.assigned_agent.first_name} {ticket.assigned_agent.last_name}"
                    if ticket.assigned_agent else None
                ),
                'created_at':     ticket.created_at,
                'updated_at':     ticket.updated_at,
                'last_action':    {
                    'new_status': last_action.new_status,
                    'changed_by': (
                        f"{last_action.changed_by.first_name} "
                        f"{last_action.changed_by.last_name}"
                    ),
                    'changed_at': last_action.changed_at,
                    'reason':     last_action.reason,
                } if last_action else None,
            })
 
        return Response({
            'total':     total,
            'page':      page,
            'page_size': page_size,
            'pages':     (total + page_size - 1) // page_size,
            'results':   data,
        })
 
 
# ─────────────────────────────────────────────────────────────────────────────
# GET /api/tickets/<id>/history/full/
# Historique complet d'un seul ticket (tous les changements de statut)
# ─────────────────────────────────────────────────────────────────────────────
class TicketFullHistoryView(APIView):
    """
    Tout l'historique d'un ticket précis :
    - Tous les changements de statut (avec qui et pourquoi)
    - Nombre de messages échangés
    - Nombre de pièces jointes
    - Nombre d'escalades
    """
    permission_classes = [IsAuthenticated]
 
    def get(self, request, pk):
        try:
            ticket = Ticket.objects.select_related(
                'client', 'assigned_agent', 'sla_rule'
            ).get(pk=pk)
        except Ticket.DoesNotExist:
            return Response(
                {'detail': 'Ticket introuvable.'},
                status=404
            )
 
        if not user_can_access_ticket(ticket, request.user):
            return Response(
                {'detail': "Vous n'avez pas accès à ce ticket."},
                status=403
            )
 
        # Tous les changements de statut
        status_history = TicketStatusHistory.objects.filter(
            ticket=ticket
        ).select_related('changed_by').order_by('changed_at')
 
        # Escalades
        escalations = ticket.escalations.select_related(
            'escalated_by', 'supervisor'
        ).all()
 
        # Pièces jointes
        attachments = ticket.attachments.select_related('uploaded_by').all()
 
        return Response({
            'ticket_number':   ticket.ticket_number,
            'title':           ticket.title,
            'created_at':      ticket.created_at,
            'current_status':  ticket.current_status,
            'reopened_count':  ticket.reopened_count,
            'is_sla_respected': ticket.is_sla_respected,
 
            # Historique des statuts
            'status_history': [
                {
                    'old_status': h.old_status,
                    'new_status': h.new_status,
                    'changed_by': (
                        f"{h.changed_by.first_name} {h.changed_by.last_name}"
                    ),
                    'reason':     h.reason,
                    'changed_at': h.changed_at,
                }
                for h in status_history
            ],
 
            # Escalades
            'escalations': [
                {
                    'type':         e.escalation_type,
                    'reason':       e.reason,
                    'escalated_by': (
                        f"{e.escalated_by.first_name} {e.escalated_by.last_name}"
                        if e.escalated_by else "Système"
                    ),
                    'supervisor':   (
                        f"{e.supervisor.first_name} {e.supervisor.last_name}"
                    ),
                    'date':         e.escalation_date,
                    'resolved':     e.resolved,
                }
                for e in escalations
            ],
 
            # Pièces jointes
            'attachments': [
                {
                    'original_name': a.original_name,
                    'uploaded_by':   (
                        f"{a.uploaded_by.first_name} {a.uploaded_by.last_name}"
                    ),
                    'uploaded_at':   a.uploaded_at,
                    'file_size':     a.file_size,
                }
                for a in attachments
            ],
 
            # Résumé des compteurs
            'summary': {
                'total_status_changes': status_history.count(),
                'total_escalations':    escalations.count(),
                'total_attachments':    attachments.count(),
            },
        })