from datetime import timedelta
from django.db.models import Avg
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count, Q, F
from users.models import User
from users.permissions import IsAdminOrSupervisor
from tickets.models import Ticket, TicketRating


class SupervisorKpisView(APIView):
    """GET /api/supervisor/kpis/"""
    permission_classes = [IsAuthenticated, IsAdminOrSupervisor]

    def get(self, request):
        qs = Ticket.objects.all()
        now = timezone.now()

        total = qs.count()
        open_count = qs.filter(current_status=Ticket.Status.OPEN).count()
        in_progress = qs.filter(
            current_status__in=[Ticket.Status.IN_PROGRESS, Ticket.Status.ASSIGNED]
        ).count()
        resolved = qs.filter(
            current_status__in=[Ticket.Status.RESOLVED, Ticket.Status.CLOSED]
        ).count()
        critical_active = qs.filter(priority=Ticket.Priority.CRITICAL).exclude(
            current_status__in=[Ticket.Status.RESOLVED, Ticket.Status.CLOSED]
        ).count()

        active_qs = qs.exclude(current_status__in=[Ticket.Status.RESOLVED, Ticket.Status.CLOSED])
        sla_breached = active_qs.filter(sla_deadline__lt=now).count()

        resolved_qs = qs.filter(current_status__in=[Ticket.Status.RESOLVED, Ticket.Status.CLOSED])
        resolved_total = resolved_qs.count()
        sla_respected_count = resolved_qs.filter(is_sla_respected=True).count()
        sla_compliance = round((sla_respected_count / resolved_total) * 100, 1) if resolved_total else 100

        avg_rating = TicketRating.objects.aggregate(avg=Avg('rating'))['avg'] or 0

        return Response({
            'total': total,
            'open': open_count,
            'inProgress': in_progress,
            'resolved': resolved,
            'criticalActive': critical_active,
            'slaBreached': sla_breached,
            'slaCompliance': sla_compliance,
            'satisfaction': round(avg_rating, 1),
        })


class SupervisorVolumeView(APIView):
    """GET /api/supervisor/volume/ — créés vs résolus, 7 derniers jours"""
    permission_classes = [IsAuthenticated, IsAdminOrSupervisor]

    def get(self, request):
        now = timezone.now()
        labels_fr = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
        days = []
        for i in range(6, -1, -1):
            day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            crees = Ticket.objects.filter(created_at__gte=day_start, created_at__lt=day_end).count()
            resolus = Ticket.objects.filter(resolved_at__gte=day_start, resolved_at__lt=day_end).count()
            days.append({'day': labels_fr[day_start.weekday()], 'crees': crees, 'resolus': resolus})
        return Response(days)


class SupervisorStatusDistributionView(APIView):
    """GET /api/supervisor/status-distribution/"""
    permission_classes = [IsAuthenticated, IsAdminOrSupervisor]

    def get(self, request):
        qs = Ticket.objects.exclude(current_status=Ticket.Status.CLOSED)
        return Response([
            {'name': 'Ouvert', 'value': qs.filter(current_status=Ticket.Status.OPEN).count()},
            {'name': 'En cours', 'value': qs.filter(
                current_status__in=[Ticket.Status.IN_PROGRESS, Ticket.Status.ASSIGNED]
            ).count()},
            {'name': 'Résolu', 'value': qs.filter(current_status=Ticket.Status.RESOLVED).count()},
        ])


class SupervisorAiClassificationView(APIView):
    """GET /api/supervisor/ai-classification/ — répartition ai_priority en %"""
    permission_classes = [IsAuthenticated, IsAdminOrSupervisor]

    def get(self, request):
        qs = Ticket.objects.exclude(ai_priority__isnull=True)
        total = qs.count()
        if not total:
            return Response([])
        labels = {'CRITICAL': 'Critique', 'HIGH': 'Haute', 'MEDIUM': 'Moyenne', 'LOW': 'Basse'}
        return Response([
            {'name': label, 'value': round((qs.filter(ai_priority=code).count() / total) * 100)}
            for code, label in labels.items()
        ])


class SupervisorSlaTicketsView(APIView):
    """
    GET /api/supervisor/sla-tickets/?filter=all|bad|risk
    Tickets actifs triés par urgence SLA (deadline la plus proche en premier).
    """
    permission_classes = [IsAuthenticated, IsAdminOrSupervisor]

    def get(self, request):
        now = timezone.now()
        qs = Ticket.objects.exclude(
            current_status__in=[Ticket.Status.RESOLVED, Ticket.Status.CLOSED]
        ).select_related('client', 'assigned_agent', 'sla_rule').order_by('sla_deadline')

        filter_param = request.GET.get('filter', 'all')
        results = []
        for t in qs:
            total_seconds = (t.sla_deadline - t.created_at).total_seconds()
            elapsed = (now - t.created_at).total_seconds()
            pct = min(100, max(0, (elapsed / total_seconds) * 100)) if total_seconds > 0 else 100
            warning_pct = t.sla_rule.warning_percentage if t.sla_rule else 80
            breached = t.sla_deadline < now

            if filter_param == 'bad' and not breached:
                continue
            if filter_param == 'risk' and (breached or pct < warning_pct):
                continue

            results.append({
                'number': t.ticket_number,
                'title': t.title,
                'client': f"{t.client.first_name} {t.client.last_name}",
                'agent': {
                    'initials': self._initials(t.assigned_agent),
                    'name': f"{t.assigned_agent.first_name} {t.assigned_agent.last_name}",
                    'color': '#1E3A5F',
                } if t.assigned_agent else None,
                'priority': t.priority,
                'createdAt': t.created_at.isoformat(),
                'slaDeadline': t.sla_deadline.isoformat(),
            })

        return Response(results[:200])

    @staticmethod
    def _initials(agent):
        if not agent:
            return '--'
        return f"{agent.first_name[:1]}{agent.last_name[:1]}".upper()
    



class SupervisorAgentsPerformanceView(APIView):
    """GET /api/supervisor/agents-performance/"""
    permission_classes = [IsAuthenticated, IsAdminOrSupervisor]

    def get(self, request):
        agents = User.objects.filter(role__name='AGENT', is_active=True)
        results = []

        for agent in agents:
            handled_qs = Ticket.objects.filter(
                assigned_agent=agent,
                current_status__in=[Ticket.Status.RESOLVED, Ticket.Status.CLOSED],
            )
            handled = handled_qs.count()

            resolution_times = handled_qs.exclude(
                resolved_at__isnull=True
            ).annotate(
                duration=F('resolved_at') - F('assigned_at')
            ).values_list('duration', flat=True)
            resolution_times = [d for d in resolution_times if d is not None]
            avg_seconds = sum(d.total_seconds() for d in resolution_times) / len(resolution_times) if resolution_times else 0
            avg_resolution = self._format_duration(avg_seconds)

            sla_respected = handled_qs.filter(is_sla_respected=True).count()
            sla_compliance = round((sla_respected / handled) * 100) if handled else 0

            avg_rating = Ticket.objects.filter(
                assigned_agent=agent, rating__isnull=False
            ).aggregate(avg=Avg('rating__rating'))['avg'] or 0

            active_load = Ticket.objects.filter(
                assigned_agent=agent
            ).exclude(
                current_status__in=[Ticket.Status.RESOLVED, Ticket.Status.CLOSED]
            ).count()

            results.append({
                'agent_id': agent.id,
                'name': f"{agent.first_name} {agent.last_name}",
                'initials': f"{agent.first_name[:1]}{agent.last_name[:1]}".upper(),
                'handled': handled,
                'avgResolution': avg_resolution,
                'slaCompliance': sla_compliance,
                'satisfaction': round(avg_rating, 1),
                'activeLoad': active_load,
            })

        return Response(results)

    @staticmethod
    def _format_duration(seconds):
        if not seconds:
            return '0h 00'
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        return f"{h}h {m:02d}"