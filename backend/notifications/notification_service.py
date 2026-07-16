from django.template.loader import render_to_string
from notifications.models import Notification, NotificationType, NotificationChannel, NotificationHistory
from integrations.email_service import email_service


class NotificationService:
    """
    Appelé par chaque vue Django quand un événement se produit.
    Crée la notification in-app ET envoie l'email.
    """

    def notify(self, event_type, ticket, recipients):
        """
        event_type : str (ex: 'TICKET_CREATED', 'SLA_WARNING'...)
        ticket     : objet Ticket
        recipients : liste d'objets User à notifier
        """
        notif_type = NotificationType.objects.get(name=event_type)

        for user in recipients:
            # 1. Créer la notification in-app (apparaît dans le portail)
            notif = Notification.objects.create(
                user=user,
                ticket=ticket,
                notification_type=notif_type,
                title=self._get_title(event_type, ticket),
                content=self._get_content(event_type, ticket),
            )

            # 2. Envoyer l'email
            self._send_email(event_type, ticket, user, notif)

    def _get_title(self, event_type, ticket):
        titles = {
            "TICKET_CREATED":        f"Ticket {ticket.ticket_number} créé",
            "TICKET_ASSIGNED":       f"Ticket {ticket.ticket_number} assigné",
            "TICKET_RESOLVED":       f"Ticket {ticket.ticket_number} résolu",
            "SLA_WARNING":           f"⚠️ Alerte SLA — {ticket.ticket_number}",
            "SLA_EXCEEDED":          f"🚨 SLA dépassé — {ticket.ticket_number}",
            "NEW_MESSAGE":           f"Nouveau message sur {ticket.ticket_number}",
            "TICKET_REOPENED":       f"Ticket {ticket.ticket_number} réouvert",
            "ESCALATION_CREATED":    f"Escalade — {ticket.ticket_number}",
        }
        return titles.get(event_type, "Notification")

    def _get_content(self, event_type, ticket):
        contents = {
            "TICKET_CREATED":     f"Votre ticket '{ticket.title}' a été enregistré.",
            "TICKET_ASSIGNED":    f"Le ticket a été assigné à {ticket.assigned_agent}.",
            "TICKET_RESOLVED":    f"Le ticket '{ticket.title}' est marqué résolu.",
            "SLA_WARNING":        f"80% du délai SLA écoulé pour '{ticket.title}'.",
            "SLA_EXCEEDED":       f"Le délai SLA est dépassé pour '{ticket.title}'.",
            "NEW_MESSAGE":        f"Un nouveau message a été posté sur votre ticket.",
            "TICKET_REOPENED":    f"Le ticket '{ticket.title}' a été réouvert.",
            "ESCALATION_CREATED": f"Le ticket '{ticket.title}' a été escaladé.",
        }
        return contents.get(event_type, "")

    def _send_email(self, event_type, ticket, user, notif):
        template_map = {
            "TICKET_CREATED":     "ticket_created.html",
            "TICKET_ASSIGNED":    "ticket_assigned.html",
            "TICKET_RESOLVED":    "ticket_resolved.html",
            "SLA_WARNING":        "sla_warning.html",
            "SLA_EXCEEDED":       "sla_exceeded.html",
            "NEW_MESSAGE":        "new_message.html",
            "TICKET_REOPENED":    "ticket_created.html",
            "ESCALATION_CREATED": "ticket_assigned.html",
        }
        template = template_map.get(event_type)
        if not template:
            return

        # Rendre le template HTML avec les données du ticket
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

        try:
            email_service.send(
                to_email=user.email,
                subject=notif.title,
                body_html=html,
            )
            # Enregistrer l'envoi
            channel = NotificationChannel.objects.get(name="EMAIL")
            NotificationHistory.objects.create(
                notification=notif,
                channel=channel,
                status="SENT",
            )
        except Exception as e:
            channel = NotificationChannel.objects.get(name="EMAIL")
            NotificationHistory.objects.create(
                notification=notif,
                channel=channel,
                status="FAILED",
                error_message=str(e),
            )


# Instance unique
notification_service = NotificationService()