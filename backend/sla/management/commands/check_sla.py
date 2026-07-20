from django.core.management.base import BaseCommand
from django.utils import timezone

from tickets.models import Ticket
from sla.models import SLAHistory
from tickets.services import ticket_service
from notifications.services import notification_service
from users.models import User


class Command(BaseCommand):
    help = "Vérifie les seuils SLA (80% et dépassement) et déclenche alertes + escalade automatique."

    def handle(self, *args, **options):
        now = timezone.now()
        active_tickets = Ticket.objects.exclude(
            current_status__in=[Ticket.Status.RESOLVED, Ticket.Status.CLOSED]
        ).select_related('sla_rule', 'assigned_agent', 'client')

        for ticket in active_tickets:
            history = SLAHistory.objects.filter(ticket=ticket).order_by('-sla_start').first()
            if not history:
                continue

            total = (ticket.sla_deadline - ticket.created_at).total_seconds()
            elapsed = (now - ticket.created_at).total_seconds()
            pct = (elapsed / total) * 100 if total > 0 else 100
            warning_pct = ticket.sla_rule.warning_percentage if ticket.sla_rule else 80

            # Alerte à 80% (une seule fois)
            if pct >= warning_pct and not history.warning_sent and now < ticket.sla_deadline:
                if ticket.assigned_agent:
                    notification_service.notify('SLA_WARNING', ticket, recipients=[ticket.assigned_agent])
                history.warning_sent = True
                history.save(update_fields=['warning_sent'])
                self.stdout.write(f"Alerte 80% envoyée : {ticket.ticket_number}")

            # Dépassement (une seule fois)
            if now >= ticket.sla_deadline and not history.exceeded:
                history.exceeded = True
                history.exceeded_at = now
                history.save(update_fields=['exceeded', 'exceeded_at'])

                ticket.is_sla_respected = False
                ticket.save(update_fields=['is_sla_respected'])

                recipients = [ticket.assigned_agent] if ticket.assigned_agent else []
                recipients += list(User.objects.filter(role__name='SUPERVISOR', is_active=True))
                notification_service.notify('SLA_EXCEEDED', ticket, recipients=recipients)

                if ticket.current_status != Ticket.Status.ESCALATED:
                    try:
                        ticket_service.escalate_ticket(
                            ticket=ticket,
                            escalated_by=None,
                            reason="Dépassement automatique du délai SLA.",
                            escalation_type='AUTO',
                        )
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(
                            f"Échec escalade auto {ticket.ticket_number} : {e}"
                        ))

                self.stdout.write(self.style.WARNING(f"SLA dépassé : {ticket.ticket_number}"))

        self.stdout.write(self.style.SUCCESS("Vérification SLA terminée."))