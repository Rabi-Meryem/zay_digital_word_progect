import imaplib
import email
from email.header import decode_header
from email.utils import parseaddr, getaddresses
from django.utils import timezone
from django.conf import settings
 
from integrations.models import IMAPConfiguration
from tickets.services import ticket_service
from logs_app.models import AuditLog
 
 
class IMAPService:
 
    def get_config(self):
        config = IMAPConfiguration.objects.filter(enabled=True).first()
        if not config:
            raise Exception("Aucune configuration IMAP active trouvée.")
        return config
 
    def poll(self):
        """
        Lit les emails non lus, crée un ticket pour chacun,
        renvoie la liste des numéros de tickets créés.
        """
        config          = self.get_config()
        tickets_created = []
 
        # Connexion à la boîte mail
        if config.encryption.upper() == 'SSL':
            mail = imaplib.IMAP4_SSL(config.host, config.port)
        else:
            mail = imaplib.IMAP4(config.host, config.port)
            if config.encryption.upper() == 'TLS':
                mail.starttls()
 
        try:
            mail.login(config.username, config.password)
            mail.select('INBOX')
 
            # Chercher les emails non lus uniquement
            _, message_ids = mail.search(None, 'UNSEEN')
            ids = message_ids[0].split()
 
            for msg_id in ids:
                try:
                    ticket_number = self._process_email(mail, msg_id)
                    if ticket_number:
                        tickets_created.append(ticket_number)
                except Exception as e:
                    # Logger l'erreur sans bloquer le traitement des autres emails
                    AuditLog.objects.create(
                        action_type  = AuditLog.ActionType.EMAIL_FAILED,
                        description  = f"Erreur traitement email IMAP : {str(e)}",
                        is_suspicious = False,
                    )
 
        finally:
            mail.logout()
 
        return tickets_created
 
    def _process_email(self, mail, msg_id):
        """Traite un email et crée le ticket correspondant."""
        _, msg_data = mail.fetch(msg_id, '(RFC822)')
        raw_email   = msg_data[0][1]
        msg         = email.message_from_bytes(raw_email)
 
        # ── Extraire l'objet (titre du ticket) ──────────────────────────────
        subject_raw = msg.get('Subject', 'Sans objet')
        decoded, enc = decode_header(subject_raw)[0]
        if isinstance(decoded, bytes):
            title = decoded.decode(enc or 'utf-8', errors='replace')
        else:
            title = decoded
        title = title[:255].strip() or 'Ticket sans titre'
 
        # ── Extraire l'expéditeur ─────────────────────────────────────────
        from_header  = msg.get('From', '')
        sender_name, sender_email = parseaddr(from_header)
        sender_email = sender_email.lower().strip()
 
        # ── Vérifier que l'expéditeur est un client actif ────────────────
        from users.models import User
        try:
            client = User.objects.get(
                email=sender_email,
                is_active=True,
                role__name='CLIENT'
            )
        except User.DoesNotExist:
            # Email d'un inconnu → marquer lu et ignorer
            mail.store(msg_id, '+FLAGS', '\\Seen')
            return None
 
        # ── Extraire le corps (description du ticket) ─────────────────────
        body = self._extract_body(msg)
        if not body or len(body.strip()) < 5:
            body = "Email reçu sans contenu textuel."
 
        # ── Créer le ticket ───────────────────────────────────────────────
        ticket = ticket_service.create_ticket(
            client      = client,
            title       = title,
            description = body[:5000],  # limiter la description
            source      = 'EMAIL',
        )
 
        # ── Marquer l'email comme lu ──────────────────────────────────────
        mail.store(msg_id, '+FLAGS', '\\Seen')
 
        # ── Logger la création ────────────────────────────────────────────
        AuditLog.objects.create(
            user         = client,
            action_type  = AuditLog.ActionType.CREATE,
            target_model = 'Ticket',
            target_id    = str(ticket.id),
            description  = (
                f"Ticket {ticket.ticket_number} créé depuis email "
                f"de {sender_email}"
            ),
        )
 
        return ticket.ticket_number
 
    def _extract_body(self, msg):
        """Extrait le corps texte d'un email (multipart ou simple)."""
        body = ''
 
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                disposition  = str(part.get('Content-Disposition', ''))
 
                # Prendre uniquement la partie texte brut
                if content_type == 'text/plain' and 'attachment' not in disposition:
                    payload = part.get_payload(decode=True)
                    if payload:
                        charset = part.get_content_charset() or 'utf-8'
                        body    = payload.decode(charset, errors='replace')
                        break
        else:
            payload = msg.get_payload(decode=True)
            if payload:
                charset = msg.get_content_charset() or 'utf-8'
                body    = payload.decode(charset, errors='replace')
 
        return body.strip()
 
 
imap_service = IMAPService()
 