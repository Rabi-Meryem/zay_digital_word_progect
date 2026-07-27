from django.template.loader import render_to_string
from notifications.models import Notification, NotificationType, NotificationChannel, NotificationHistory
from integrations.email_service import email_service


class NotificationService:
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
                    user=user,
                    ticket=ticket,
                    notification_type=notif_type,
                    title=title,
                    content=content,
                )

            if notif_type.email_enabled:
                if notif is None:
                    notif = Notification.objects.create(
                        user=user,
                        ticket=ticket,
                        notification_type=notif_type,
                        title=title,
                        content=content,
                        is_read=True,
                    )
                self._send_email(event_type, ticket, user, notif)

    def _get_title(self, event_type, ticket):
        if event_type == "TICKET_CREATED":
            return f"Ticket {ticket.ticket_number} créé"
        if event_type == "TICKET_ASSIGNED":
            return f"Ticket {ticket.ticket_number} assigné"
        if event_type == "TICKET_STATUS_CHANGED":
            return f"Ticket {ticket.ticket_number} mis à jour"
        if event_type == "TICKET_RESOLVED":
            return f"Ticket {ticket.ticket_number} résolu"
        if event_type == "TICKET_CLOSED":
            return f"Ticket {ticket.ticket_number} clôturé"
        if event_type == "TICKET_REOPENED":
            return f"Ticket {ticket.ticket_number} réouvert"
        if event_type == "SLA_WARNING":
            return f"⚠️ Alerte SLA — {ticket.ticket_number}"
        if event_type == "SLA_EXCEEDED":
            return f"🚨 SLA dépassé — {ticket.ticket_number}"
        if event_type == "NEW_MESSAGE":
            return f"Nouveau message sur {ticket.ticket_number}"
        if event_type == "ESCALATION_CREATED":
            return f"Escalade — {ticket.ticket_number}"
        if event_type == "AGENT_OVERLOAD":
            return "⚠️ Surcharge agent détectée"
        if event_type == "SYSTEM_ERROR":
            return "🚨 Erreur système"
        if event_type == "SECURITY_ALERT":
            return "🚨 Alerte sécurité"
        return "Notification"

    def _get_content(self, event_type, ticket):
        if event_type == "TICKET_CREATED":
            return f"Votre ticket '{ticket.title}' a été enregistré."
        if event_type == "TICKET_ASSIGNED":
            return f"Le ticket a été assigné à {ticket.assigned_agent}."
        if event_type == "TICKET_STATUS_CHANGED":
            return f"Le statut du ticket '{ticket.title}' a changé : {ticket.current_status}."
        if event_type == "TICKET_RESOLVED":
            return f"Le ticket '{ticket.title}' est marqué résolu."
        if event_type == "TICKET_CLOSED":
            return f"Le ticket '{ticket.title}' a été clôturé."
        if event_type == "TICKET_REOPENED":
            return f"Le ticket '{ticket.title}' a été réouvert."
        if event_type == "SLA_WARNING":
            return f"80% du délai SLA écoulé pour '{ticket.title}'."
        if event_type == "SLA_EXCEEDED":
            return f"Le délai SLA est dépassé pour '{ticket.title}'."
        if event_type == "NEW_MESSAGE":
            return "Un nouveau message a été posté sur votre ticket."
        if event_type == "ESCALATION_CREATED":
            return f"Le ticket '{ticket.title}' a été escaladé."
        return ""

    def _send_email(self, event_type, ticket, user, notif):
        if ticket is None:
            return

        template_map = {
            "TICKET_CREATED":     "ticket_created.html",
            "TICKET_ASSIGNED":    "ticket_assigned.html",
            "TICKET_RESOLVED":    "ticket_resolved.html",
            "TICKET_CLOSED":      "ticket_resolved.html",
            "SLA_WARNING":        "sla_warning.html",
            "SLA_EXCEEDED":       "sla_exceeded.html",
            "NEW_MESSAGE":        "new_message.html",
            "TICKET_REOPENED":    "ticket_created.html",
            "ESCALATION_CREATED": "ticket_assigned.html",
        }
        template = template_map.get(event_type)
        if not template:
            return

        channel = NotificationChannel.objects.get(name="EMAIL")

        try:
            html = render_to_string(
                f"integrations/email_templates/{template}",
                {
                    "client_name":   user.first_name,
                    "ticket_number": ticket.ticket_number,
                    "ticket_title":  ticket.title,
                    "priority":      ticket.priority,
                    "sla_deadline":  ticket.sla_deadline,
                    "portal_url":    "http://localhost:5173/tickets/" + str(ticket.id),
                }
            )
            email_service.send(to_email=user.email, subject=notif.title, body_html=html)
            NotificationHistory.objects.create(notification=notif, channel=channel, status="SENT")
        except Exception as e:
            NotificationHistory.objects.create(
                notification=notif, channel=channel, status="FAILED", error_message=str(e)
            )


notification_service = NotificationService()