from django.template.loader import render_to_string
from notifications.models import Notification, NotificationType, NotificationChannel, NotificationHistory
from integrations.email_service import email_service
from users.models import User, Role


class NotificationService:

    STATUS_CHANGE_EVENTS = {
        "TICKET_STATUS_CHANGED", "TICKET_RESOLVED",
        "TICKET_CLOSED", "TICKET_REOPENED",
    }

    # -----------------------------------------------------------------
    # Points d'entrée publics
    # -----------------------------------------------------------------

    def notify_for_ticket(self, event_type, ticket, actor=None):
        """
        Événements liés à un ticket précis : calcule les destinataires
        automatiquement selon les règles métier.
        """
        recipients = self._get_recipients(event_type, ticket, actor)
        if recipients:
            self.notify(event_type, ticket, recipients)

    def notify_system_event(self, event_type, ticket=None):
        """
        Événements système, non rattachés (ou indirectement) à un ticket :
        AGENT_OVERLOAD, SYSTEM_ERROR, API_WEBHOOK_ERROR, SECURITY_ALERT
        """
        if event_type in ("SYSTEM_ERROR", "API_WEBHOOK_ERROR", "SECURITY_ALERT"):
            recipients = list(
                User.objects.filter(role__name=Role.RoleName.ADMIN, is_active=True)
            )
        elif event_type == "AGENT_OVERLOAD":
            recipients = list(
                User.objects.filter(role__name=Role.RoleName.SUPERVISOR, is_active=True)
            )
        else:
            recipients = []

        if recipients:
            self.notify(event_type, ticket, recipients)

    # -----------------------------------------------------------------
    # Calcul des destinataires (événements liés à un ticket)
    # -----------------------------------------------------------------

    def _get_recipients(self, event_type, ticket, actor=None):
        recipients = []

        if event_type == "TICKET_CREATED":
            recipients = [ticket.client, ticket.supervisor]

        elif event_type == "TICKET_ASSIGNED":
            recipients = [ticket.client, ticket.assigned_agent]

        elif event_type in self.STATUS_CHANGE_EVENTS:
            recipients = [ticket.client, ticket.assigned_agent, ticket.supervisor]

        elif event_type == "SLA_WARNING":
            recipients = [ticket.client, ticket.assigned_agent, ticket.supervisor]

        elif event_type == "SLA_EXCEEDED":
            recipients = [ticket.supervisor]

        elif event_type == "ESCALATION_AUTO":
            recipients = [ticket.assigned_agent, ticket.supervisor]

        elif event_type == "ESCALATION_MANUAL":
            recipients = [ticket.supervisor]

        elif event_type == "CRITICAL_TICKET_UNHANDLED":
            recipients = [ticket.supervisor]

        # retire les None (ex: assigned_agent pas encore défini) + doublons
        recipients = list({u.id: u for u in recipients if u is not None}.values())

        # exclut l'auteur de l'action pour les changements de statut
        if actor is not None and event_type in self.STATUS_CHANGE_EVENTS:
            recipients = [u for u in recipients if u.id != actor.id]

        return recipients

    # -----------------------------------------------------------------
    # Le reste (notify, _send_email...) ne change pas
    # -----------------------------------------------------------------

    def notify(self, event_type, ticket, recipients, override_title=None, override_content=None):
        notif_type = NotificationType.objects.get(name=event_type)

        if not notif_type.in_app_enabled and not notif_type.email_enabled:
            return

        title = override_title if override_title is not None else self._get_title(event_type, ticket)
        content = override_content if override_content is not None else self._get_content(event_type, ticket)

        for user in recipients:
            notif = None

            if notif_type.in_app_enabled:
                notif = Notification.objects.create(
                    user=user, ticket=ticket, notification_type=notif_type,
                    title=title, content=content,
                )

            if notif_type.email_enabled:
                if notif is None:
                    notif = Notification.objects.create(
                        user=user, ticket=ticket, notification_type=notif_type,
                        title=title, content=content, is_read=True,
                    )
                self._send_email(event_type, ticket, user, notif)

    def _get_title(self, event_type, ticket):
        titles = {
            "TICKET_CREATED": f"Ticket {ticket.ticket_number} créé",
            "TICKET_ASSIGNED": f"Ticket {ticket.ticket_number} assigné",
            "TICKET_STATUS_CHANGED": f"Ticket {ticket.ticket_number} mis à jour",
            "TICKET_RESOLVED": f"Ticket {ticket.ticket_number} résolu",
            "TICKET_CLOSED": f"Ticket {ticket.ticket_number} clôturé",
            "TICKET_REOPENED": f"Ticket {ticket.ticket_number} réouvert",
            "SLA_WARNING": f"⚠️ Alerte SLA — {ticket.ticket_number}",
            "SLA_EXCEEDED": f"🚨 SLA dépassé — {ticket.ticket_number}",
            "ESCALATION_AUTO": f"⏫ Escalade automatique — {ticket.ticket_number}",
            "ESCALATION_MANUAL": f"⏫ Ticket escaladé — {ticket.ticket_number}",
            "AGENT_OVERLOAD": "⚠️ Surcharge agent détectée",
            "CRITICAL_TICKET_UNHANDLED": f"🚨 Ticket critique non traité — {ticket.ticket_number}" if ticket else "🚨 Ticket critique non traité",
            "SYSTEM_ERROR": "🚨 Erreur système",
            "API_WEBHOOK_ERROR": "🚨 Échec API / Webhook",
            "SECURITY_ALERT": "🚨 Alerte sécurité",
        }
        return titles.get(event_type, "Notification")

    def _get_content(self, event_type, ticket):
        contents = {
            "TICKET_CREATED": f"Votre ticket '{ticket.title}' a été enregistré." if ticket else "",
            "TICKET_ASSIGNED": f"Le ticket a été assigné à {ticket.assigned_agent}." if ticket else "",
            "TICKET_STATUS_CHANGED": f"Le statut du ticket '{ticket.title}' a changé : {ticket.get_current_status_display()}." if ticket else "",
            "TICKET_RESOLVED": f"Le ticket '{ticket.title}' est marqué résolu." if ticket else "",
            "TICKET_CLOSED": f"Le ticket '{ticket.title}' a été clôturé." if ticket else "",
            "TICKET_REOPENED": f"Le ticket '{ticket.title}' a été réouvert." if ticket else "",
            "SLA_WARNING": f"80% du délai SLA écoulé pour '{ticket.title}'." if ticket else "",
            "SLA_EXCEEDED": f"Le délai SLA est dépassé pour '{ticket.title}'." if ticket else "",
            "ESCALATION_AUTO": f"Le ticket '{ticket.title}' a été escaladé automatiquement (SLA dépassé)." if ticket else "",
            "ESCALATION_MANUAL": f"Le ticket '{ticket.title}' a été escaladé par l'agent." if ticket else "",
            "AGENT_OVERLOAD": "Un agent a dépassé sa charge de travail maximale.",
            "CRITICAL_TICKET_UNHANDLED": f"Le ticket critique '{ticket.title}' n'a pas encore été pris en charge." if ticket else "Un ticket critique n'a pas été pris en charge.",
            "SYSTEM_ERROR": "Une erreur système critique a été détectée.",
            "API_WEBHOOK_ERROR": "Échec d'une intégration API ou webhook (SMTP/IMAP).",
            "SECURITY_ALERT": "Un incident de sécurité ou un accès suspect a été détecté.",
        }
        return contents.get(event_type, "")

    def _send_email(self, event_type, ticket, user, notif):
        # ... inchangé, mais attention : les events système (SYSTEM_ERROR,
        # API_WEBHOOK_ERROR, SECURITY_ALERT, AGENT_OVERLOAD) n'ont pas de
        # template dans template_map -> return immédiat, donc pas d'email
        # envoyé pour eux tant que tu n'ajoutes pas de templates admin.
        if ticket is None:
            return
        # ... reste inchangé


notification_service = NotificationService()