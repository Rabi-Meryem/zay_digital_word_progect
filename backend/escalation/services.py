# backend/escalation/services.py
# ---------------------------------------------------------------------------
# Escalade automatique des tickets dont le délai SLA est dépassé.
#
# Appelé périodiquement par le planificateur (voir ai/scheduler.py).
# Un ticket qui vient d'être escaladé passe en statut ESCALATED : il sort
# donc naturellement du filtre ci-dessous au prochain passage, ce qui évite
# de le ré-escalader (et de renotifier) en boucle toutes les 5 minutes.
# ---------------------------------------------------------------------------

import logging
from django.utils import timezone

logger = logging.getLogger(__name__)


def escalader_tickets_sla_depasse():
    """Notifie agent+superviseur puis escalade tout ticket actif hors SLA."""
    from tickets.models import Ticket
    from tickets.services import ticket_service
    from notifications.services import notification_service
    from ai.services import get_utilisateur_ia

    now = timezone.now()

    tickets_en_retard = Ticket.objects.filter(
        sla_deadline__lt=now,
    ).exclude(
        current_status__in=[
            Ticket.Status.RESOLVED,
            Ticket.Status.CLOSED,
            Ticket.Status.ESCALATED,
        ]
    ).select_related('client', 'assigned_agent', 'supervisor')

    print(f"[SLA] Passage du planificateur — {tickets_en_retard.count()} ticket(s) en depassement SLA.")

    for ticket in tickets_en_retard:
        try:
            # 1. Notifier l'agent assigné + le superviseur (email via le
            #    template sla_exceeded.html, déjà prêt mais jamais utilisé
            #    jusqu'ici, + notification in-app).
            destinataires = [u for u in [ticket.assigned_agent, ticket.supervisor] if u]
            if destinataires:
                notification_service.notify(
                    'SLA_EXCEEDED', ticket, recipients=destinataires,
                )

            # 2. Escalader réellement : crée la ligne dans la table
            #    Escalation (visible dans l'écran Escalades du superviseur)
            #    et fait passer le ticket en statut ESCALATED.
            ticket_service.escalate_ticket(
                ticket=ticket,
                escalated_by=get_utilisateur_ia(),
                reason="Délai SLA dépassé — escalade automatique",
                escalation_type='AUTO',
            )
            print(f"[SLA] Ticket {ticket.ticket_number} escalade automatiquement (SLA depasse).")

        except Exception:
            logger.exception(
                "Escalade automatique SLA impossible pour %s", ticket.ticket_number
            )
            from notifications.services import notification_service
            notification_service.notify_system_event('SYSTEM_ERROR')
def notifier_avertissement_sla():
    """
    Notifie client + agent + superviseur quand un ticket atteint son seuil
    d'alerte SLA (ex: 80%). Réutilise le flag sla_warning_sent du modèle
    Ticket pour ne notifier qu'une seule fois par ticket.
    """
    from tickets.models import Ticket
    from notifications.services import notification_service

    now = timezone.now()

    candidats = Ticket.objects.filter(
        sla_warning_sent=False,
    ).exclude(
        current_status__in=[
            Ticket.Status.RESOLVED,
            Ticket.Status.CLOSED,
            Ticket.Status.ESCALATED,
        ]
    ).select_related('client', 'assigned_agent', 'supervisor', 'sla_rule')

    for ticket in candidats:
        total = (ticket.sla_deadline - ticket.created_at).total_seconds()
        if total <= 0:
            continue

        elapsed = (now - ticket.created_at).total_seconds()
        seuil = ticket.sla_rule.warning_percentage if ticket.sla_rule else 80

        if (elapsed / total) * 100 < seuil:
            continue  # pas encore atteint le seuil

        destinataires = [u for u in [ticket.client, ticket.assigned_agent, ticket.supervisor] if u]
        if destinataires:
            notification_service.notify('SLA_WARNING', ticket, recipients=destinataires)

        ticket.sla_warning_sent = True
        ticket.save(update_fields=['sla_warning_sent'])
        print(f"[SLA] Alerte {seuil}% envoyee pour {ticket.ticket_number}.")


def notifier_tickets_critiques_non_traites():
    """
    Notifie agent + superviseur quand un ticket CRITIQUE reste affecté sans
    prise en charge (pas de première réponse) au-delà d'un délai donné.
    """
    from django.conf import settings
    from tickets.models import Ticket
    from notifications.services import notification_service

    delai = getattr(settings, 'CRITICAL_UNHANDLED_DELAY_MINUTES', 15)
    deadline = timezone.now() - timezone.timedelta(minutes=delai)

    candidats = Ticket.objects.filter(
        priority=Ticket.Priority.CRITICAL,
        current_status=Ticket.Status.ASSIGNED,
        first_response_at__isnull=True,
        assigned_at__lte=deadline,
    ).select_related('assigned_agent', 'supervisor')

    for ticket in candidats:
        destinataires = [u for u in [ticket.assigned_agent, ticket.supervisor] if u]
        if destinataires:
            notification_service.notify('CRITICAL_TICKET_UNHANDLED', ticket, recipients=destinataires)
            print(f"[CRITIQUE] Alerte non-traitement envoyee pour {ticket.ticket_number}.")