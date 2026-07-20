from django.template.loader import render_to_string
from notifications.models import Notification, NotificationType, NotificationChannel, NotificationHistory
from integrations.email_service import email_service


class NotificationService:
    """
    Appelé par les services métier quand un événement se produit.
    Crée la notification in-app ET envoie l'email (si un ticket est concerné).
    """

    def notify(self, event_type, ticket, recipients, override_title=None, override_content=None):
        """
        event_type       : str (ex: 'TICKET_CREATED', 'SLA_WARNING'...)
        ticket           : objet Ticket ou None (ex: alerte de surcharge agent, sans ticket précis)
        recipients       : liste d'objets User à notifier
        override_title   : si fourni, remplace le titre par défaut (utile quand le même
                            event_type sert à des destinataires différents avec des messages différents)
        override_content : idem pour le contenu
        """
        notif_type = NotificationType.objects.get(name=event_type)
        title = override_title if override_title is not None else self._get_title(event_type, ticket)
        content = override_content if override_content is not None else self._get_content(event_type, ticket)

        for user in recipients:
            notif = Notification.objects.create(
                user=user,
                ticket=ticket,
                notification_type=notif_type,
                title=title,
                content=content,
            )
            self._send_email(event_type, ticket, user, notif)

    def _get_title(self, event_type, ticket):
        titles = {
            "TICKET_CREATED":        f"Ticket {ticket.ticket_number} créé",
            "TICKET_ASSIGNED":       f"Ticket {ticket.ticket_number} assigné",
            "TICKET_STATUS_CHANGED": f"Ticket {ticket.ticket_number} mis à jour",
            "TICKET_RESOLVED":       f"Ticket {ticket.ticket_number} résolu",
            "TICKET_CLOSED":         f"Ticket {ticket.ticket_number} clôturé",
            "TICKET_REOPENED":       f"Ticket {ticket.ticket_number} réouvert",
            "SLA_WARNING":           f"⚠️ Alerte SLA — {ticket.ticket_number}",
            "SLA_EXCEEDED":          f"🚨 SLA dépassé — {ticket.ticket_number}",
            "NEW_MESSAGE":           f"Nouveau message sur {ticket.ticket_number}",
            "ESCALATION_CREATED":    f"Escalade — {ticket.ticket_number}",
            "AGENT_OVERLOAD":        "⚠️ Surcharge agent détectée",
            "SYSTEM_ERROR":          "🚨 Erreur système",
            "SECURITY_ALERT":       "🚨 Alerte sécurité",
        }
        return titles.get(event_type, "Notification")

    def _get_content(self, event_type, ticket):
        contents = {
            "TICKET_CREATED":        f"Votre ticket '{ticket.title}' a été enregistré.",
            "TICKET_ASSIGNED":       f"Le ticket a été assigné à {ticket.assigned_agent}.",
            "TICKET_STATUS_CHANGED": f"Le statut du ticket '{ticket.title}' a changé : {ticket.current_status}.",
            "TICKET_RESOLVED":       f"Le ticket '{ticket.title}' est marqué résolu.",
            "TICKET_CLOSED":         f"Le ticket '{ticket.title}' a été clôturé.",
            "TICKET_REOPENED":       f"Le ticket '{ticket.title}' a été réouvert.",
            "SLA_WARNING":           f"80% du délai SLA écoulé pour '{ticket.title}'.",
            "SLA_EXCEEDED":          f"Le délai SLA est dépassé pour '{ticket.title}'.",
            "NEW_MESSAGE":           "Un nouveau message a été posté sur votre ticket.",
            "ESCALATION_CREATED":    f"Le ticket '{ticket.title}' a été escaladé.",
        }
        return contents.get(event_type, "")

    def _send_email(self, event_type, ticket, user, notif):
        # Pas de ticket (ex: alerte de surcharge) → pas de template ticket, on garde l'in-app seul.
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
            email_service.send(to_email=user.email, subject=notif.title, body_html=html)
            channel = NotificationChannel.objects.get(name="EMAIL")
            NotificationHistory.objects.create(notification=notif, channel=channel, status="SENT")
        except Exception as e:
            channel = NotificationChannel.objects.get(name="EMAIL")
            NotificationHistory.objects.create(
                notification=notif, channel=channel, status="FAILED", error_message=str(e)
            )


notification_service = NotificationService()