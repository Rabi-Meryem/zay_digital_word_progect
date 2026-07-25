from django.utils import timezone
from datetime import datetime
from tickets.models import Ticket
from escalation.models import Escalation
from users.models import User
from django.db.models import Avg


def parse_date_param(value, default):
    if not value:
        return default
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except ValueError:
        return default


def get_report_data(date_from=None, date_to=None, agent_id=None, priority=None, ticket_status=None):
    qs = Ticket.objects.all()

    if date_from:
        qs = qs.filter(created_at__date__gte=date_from)
    if date_to:
        qs = qs.filter(created_at__date__lte=date_to)
    if agent_id:
        qs = qs.filter(assigned_agent_id=agent_id)
    if priority:
        qs = qs.filter(priority=priority)
    if ticket_status:
        qs = qs.filter(current_status=ticket_status)

    total = qs.count()
    resolved_qs = qs.filter(current_status__in=[Ticket.Status.RESOLVED, Ticket.Status.CLOSED])
    resolved_total = resolved_qs.count()
    sla_respected = resolved_qs.filter(is_sla_respected=True).count()
    sla_compliance = round((sla_respected / resolved_total) * 100, 1) if resolved_total else 100
    avg_rating = qs.filter(rating__isnull=False).aggregate(avg=Avg('rating__rating'))['avg'] or 0

    kpis = {
        'total': total,
        'open': qs.filter(current_status=Ticket.Status.OPEN).count(),
        'in_progress': qs.filter(
            current_status__in=[Ticket.Status.IN_PROGRESS, Ticket.Status.ASSIGNED]
        ).count(),
        'resolved': resolved_total,
        'sla_compliance': sla_compliance,
        'satisfaction': round(avg_rating, 1),
    }

    agent_rows = []
    agent_ids = qs.exclude(assigned_agent__isnull=True).values_list('assigned_agent', flat=True).distinct()
    for aid in agent_ids:
        agent = User.objects.get(pk=aid)
        agent_tickets = qs.filter(assigned_agent=agent)
        handled = agent_tickets.filter(
            current_status__in=[Ticket.Status.RESOLVED, Ticket.Status.CLOSED]
        ).count()
        agent_sla_ok = agent_tickets.filter(is_sla_respected=True).count()
        agent_rating = agent_tickets.filter(rating__isnull=False).aggregate(
            avg=Avg('rating__rating')
        )['avg'] or 0
        agent_rows.append({
            'name': f"{agent.first_name} {agent.last_name}",
            'handled': handled,
            'sla_compliance': round((agent_sla_ok / handled) * 100) if handled else 0,
            'satisfaction': round(agent_rating, 1),
        })

    escalations_qs = Escalation.objects.filter(ticket__in=qs).select_related('ticket', 'escalated_by')
    escalation_rows = [
        {
            'ticket_number': e.ticket.ticket_number,
            'title': e.ticket.title,
            'type': e.escalation_type,
            'date': e.escalation_date,
            'resolved': e.resolved,
        }
        for e in escalations_qs
    ]

    return {
        'kpis': kpis,
        'agents': agent_rows,
        'escalations': escalation_rows,
        'generated_at': timezone.now(),
    }