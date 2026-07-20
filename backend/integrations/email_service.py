import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from integrations.models import SMTPConfiguration
from logs_app.models import AuditLog


class EmailService:
    """
    Service centralisé pour envoyer des emails.
    Lit la config SMTP depuis la base de données (table smtp_configuration).
    Appelé par le NotificationService à chaque événement ticket.
    """

    def get_config(self):
        """Récupère la config SMTP active depuis la base."""
        config = SMTPConfiguration.objects.filter(enabled=True).first()
        if not config:
            raise Exception("Aucune configuration SMTP active trouvée.")
        return config

    def send(self, to_email, subject, body_html, body_text=None):
        """
        Envoie un email.
        to_email  : adresse du destinataire (str)
        subject   : objet de l'email (str)
        body_html : contenu HTML de l'email (str)
        body_text : fallback texte brut (str, optionnel)
        """
        config = self.get_config()

        # Construire le message email
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = config.from_email
        msg["To"]      = to_email

        # Partie texte brut (fallback si le client ne supporte pas HTML)
        if body_text:
            msg.attach(MIMEText(body_text, "plain", "utf-8"))

        # Partie HTML
        msg.attach(MIMEText(body_html, "html", "utf-8"))

        try:
            # Connexion selon le type d'encryption
            if config.encryption.upper() == "SSL":
                server = smtplib.SMTP_SSL(config.host, config.port)
            else:
                server = smtplib.SMTP(config.host, config.port)
                if config.encryption.upper() == "TLS":
                    server.starttls()

            server.login(config.username, config.password)
            server.sendmail(config.from_email, to_email, msg.as_string())
            server.quit()

            # Logger le succès
            AuditLog.objects.create(
                action_type=AuditLog.ActionType.EMAIL_SENT,
                description=f"Email envoyé à {to_email} : {subject}",
            )
            return True

        except Exception as e:
            # Logger l'échec — l'admin sera alerté
            AuditLog.objects.create(
                action_type=AuditLog.ActionType.EMAIL_FAILED,
                description=f"Échec email à {to_email} : {str(e)}",
                is_suspicious=False,
            )
            raise e


# Instance unique utilisée partout dans le projet
email_service = EmailService()