import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from integrations.models import SMTPConfiguration
from logs_app.models import AuditLog
from integrations.crypto import decrypt_password


class EmailService:

    def get_config(self):
        config = SMTPConfiguration.objects.filter(enabled=True).first()
        if not config:
            raise Exception("Aucune configuration SMTP active trouvée.")
        return config

    def send(self, to_email, subject, body_html, body_text=None):
        config = self.get_config()

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = config.from_email
        msg["To"]      = to_email

        if body_text:
            msg.attach(MIMEText(body_text, "plain", "utf-8"))
        msg.attach(MIMEText(body_html, "html", "utf-8"))

        try:
            if config.encryption.upper() == "SSL":
                server = smtplib.SMTP_SSL(config.host, config.port)
            else:
                server = smtplib.SMTP(config.host, config.port)
                if config.encryption.upper() == "TLS":
                    server.starttls()

            server.login(config.username, decrypt_password(config.password))   # ← remplacé ici
            server.sendmail(config.from_email, to_email, msg.as_string())
            server.quit()

            AuditLog.objects.create(
                action_type=AuditLog.ActionType.EMAIL_SENT,
                description=f"Email envoyé à {to_email} : {subject}",
            )
            return True

        except Exception as e:
            AuditLog.objects.create(
                action_type=AuditLog.ActionType.EMAIL_FAILED,
                description=f"Échec email à {to_email} : {str(e)}",
                is_suspicious=False,
            )
            raise e


email_service = EmailService()