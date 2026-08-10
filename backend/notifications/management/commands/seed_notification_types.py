from django.core.management.base import BaseCommand
from notifications.models import NotificationType

TYPES = [
    ("TICKET_CREATED", "Ticket créé"),
    ("TICKET_ASSIGNED", "Ticket affecté à un agent"),
    ("TICKET_STATUS_CHANGED", "Changement de statut du ticket"),
    ("TICKET_RESOLVED", "Ticket résolu"),
    ("TICKET_CLOSED", "Ticket clôturé"),
    ("TICKET_REOPENED", "Ticket réouvert"),
    ("SLA_WARNING", "Alerte SLA à 80%"),
    ("SLA_EXCEEDED", "Dépassement SLA"),
    ("ESCALATION_AUTO", "Escalade automatique"),
    ("ESCALATION_MANUAL", "Escalade manuelle par un agent"),
    ("AGENT_OVERLOAD", "Surcharge agent"),
    ("CRITICAL_TICKET_UNHANDLED", "Ticket critique non traité"),
    ("SYSTEM_ERROR", "Erreur système critique"),
    ("API_WEBHOOK_ERROR", "Échec API/Webhook"),
    ("SECURITY_ALERT", "Alerte sécurité"),
]


class Command(BaseCommand):
    help = "Crée les types de notification manquants en base"

    def handle(self, *args, **kwargs):
        created = 0
        for name, description in TYPES:
            _, was_created = NotificationType.objects.get_or_create(
                name=name,
                defaults={"description": description, "email_enabled": True, "in_app_enabled": True},
            )
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f"{created} type(s) créé(s), {len(TYPES) - created} déjà existant(s)."))