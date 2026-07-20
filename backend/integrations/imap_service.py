import imaplib
import email
from email.header import decode_header
from integrations.models import IMAPConfiguration
from tickets.models import Ticket
from sla.models import SLARule
from django.utils import timezone


class IMAPService:
    """
    Se connecte à la boîte mail support via IMAP.
    Lit les emails non lus et crée un Ticket pour chacun.
    Appelé par le endpoint cron /api/integrations/imap/poll/
    toutes les 2 minutes.
    """

    def get_config(self):
        config = IMAPConfiguration.objects.filter(enabled=True).first()
        if not config:
            raise Exception("Aucune configuration IMAP active.")
        return config

    def poll(self):
        """Lit les nouveaux emails et crée les tickets correspondants."""
        config = self.get_config()
        tickets_created = []

        # Connexion à la boîte mail
        if config.encryption.upper() == "SSL":
            mail = imaplib.IMAP4_SSL(config.host, config.port)
        else:
            mail = imaplib.IMAP4(config.host, config.port)

        mail.login(config.username, config.password)
        mail.select("INBOX")

        # Chercher les emails non lus
        _, message_ids = mail.search(None, "UNSEEN")

        for msg_id in message_ids[0].split():
            _, msg_data = mail.fetch(msg_id, "(RFC822)")
            raw_email = msg_data[0][1]
            msg = email.message_from_bytes(raw_email)

            # Extraire l'objet (= titre du ticket)
            subject, encoding = decode_header(msg["Subject"])[0]
            if isinstance(subject, bytes):
                subject = subject.decode(encoding or "utf-8")

            # Extraire l'expéditeur
            sender_email = email.utils.parseaddr(msg["From"])[1]

            # Extraire le corps (= description du ticket)
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                        break
            else:
                body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")

            # Chercher l'utilisateur par email
            from users.models import User
            try:
                client = User.objects.get(email=sender_email, is_active=True)
            except User.DoesNotExist:
                # Email d'un inconnu — on marque comme lu et on ignore
                mail.store(msg_id, "+FLAGS", "\\Seen")
                continue

            # Créer le ticket
            sla_rule = SLARule.objects.get(priority="MEDIUM")  # priorité par défaut
            ticket = Ticket.objects.create(
                client=client,
                title=subject[:255],
                description=body,
                source="EMAIL",
                priority="MEDIUM",
                sla_rule=sla_rule,
                sla_deadline=timezone.now() + timezone.timedelta(
                    hours=sla_rule.resolution_hours
                ),
            )

            # Marquer l'email comme lu
            mail.store(msg_id, "+FLAGS", "\\Seen")
            tickets_created.append(ticket.ticket_number)

        mail.logout()
        return tickets_created


imap_service = IMAPService()