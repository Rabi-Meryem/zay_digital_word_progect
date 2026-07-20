# RÔLE : Gérer l'upload et le téléchargement des pièces jointes des tickets.
# Les fichiers sont stockés sur MinIO (S3-compatible) via django-storages.
# On vérifie le type et la taille du fichier avant de l'accepter (sécurité).
 
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
 
from tickets.models import Ticket, TicketAttachment
from logs_app.models import AuditLog
 
 
# Types de fichiers autorisés (liste blanche — sécurité Phase 7)
ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
]
 
# Taille maximale : 10 Mo
MAX_FILE_SIZE = 10 * 1024 * 1024
 
 
def get_ticket_or_404(pk):
    try:
        return Ticket.objects.select_related(
            'client', 'assigned_agent', 'sla_rule'
        ).get(pk=pk)
    except Ticket.DoesNotExist:
        return None
 
 
def user_can_access_ticket(ticket, user):
    """Vérifie que l'utilisateur a accès à ce ticket."""
    role = user.role.name
    if role == 'CLIENT':
        return ticket.client == user
    if role == 'AGENT':
        return ticket.assigned_agent == user
    return True  # SUPERVISOR et ADMIN voient tout
 
 
# ─────────────────────────────────────────────────────────────────────────────
# POST /api/tickets/<id>/attachments/
# Uploader une ou plusieurs pièces jointes sur un ticket
# ─────────────────────────────────────────────────────────────────────────────
class TicketAttachmentUploadView(APIView):
    """
    Upload d'une pièce jointe sur un ticket.
    Accepte un fichier à la fois via multipart/form-data.
 
    Sécurités appliquées :
    - Liste blanche des types MIME autorisés
    - Taille maximale de 10 Mo
    - Vérification que l'utilisateur a accès au ticket
    - Stockage sur MinIO (jamais sur le serveur local en production)
    """
    permission_classes = [IsAuthenticated]
    # MultiPartParser permet de recevoir des fichiers dans la requête
    parser_classes     = [MultiPartParser, FormParser]
 
    def post(self, request, pk):
        ticket = get_ticket_or_404(pk)
        if not ticket:
            return Response(
                {'detail': 'Ticket introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
 
        # Vérifier l'accès au ticket
        if not user_can_access_ticket(ticket, request.user):
            return Response(
                {'detail': "Vous n'avez pas accès à ce ticket."},
                status=status.HTTP_403_FORBIDDEN
            )
 
        # Récupérer le fichier envoyé
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'detail': 'Aucun fichier fourni. Utilisez le champ "file".'},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        # Vérifier le type MIME
        mime_type = file.content_type
        if mime_type not in ALLOWED_MIME_TYPES:
            return Response(
                {
                    'detail': f"Type de fichier non autorisé : {mime_type}.",
                    'allowed': ALLOWED_MIME_TYPES,
                },
                status=status.HTTP_400_BAD_REQUEST
            )
 
        # Vérifier la taille
        if file.size > MAX_FILE_SIZE:
            return Response(
                {
                    'detail': f"Fichier trop volumineux. Maximum : 10 Mo.",
                    'size_received': f"{file.size / 1024 / 1024:.2f} Mo",
                },
                status=status.HTTP_400_BAD_REQUEST
            )
 
        # Générer un nom de fichier unique pour éviter les collisions
        import uuid
        ext          = os.path.splitext(file.name)[1].lower()
        unique_name  = f"{uuid.uuid4().hex}{ext}"
 
        # Créer l'entrée en base
        attachment = TicketAttachment.objects.create(
            ticket        = ticket,
            uploaded_by   = request.user,
            file          = file,
            filename      = unique_name,
            original_name = file.name[:255],
            file_size     = file.size,
            mime_type     = mime_type,
            file_path     = f"tickets/{ticket.id}/attachments/{unique_name}",
        )
 
        # Logger l'action
        AuditLog.objects.create(
            user         = request.user,
            action_type  = AuditLog.ActionType.CREATE,
            target_model = 'TicketAttachment',
            target_id    = str(attachment.id),
            description  = (
                f"Pièce jointe '{file.name}' ajoutée au ticket "
                f"{ticket.ticket_number}"
            ),
        )
 
        return Response(
            {
                'id':            attachment.id,
                'original_name': attachment.original_name,
                'file_size':     attachment.file_size,
                'mime_type':     attachment.mime_type,
                'uploaded_at':   attachment.uploaded_at,
                'file_url':      request.build_absolute_uri(
                    attachment.file.url
                ),
            },
            status=status.HTTP_201_CREATED
        )
 
 
# ─────────────────────────────────────────────────────────────────────────────
# GET /api/tickets/<id>/attachments/
# Lister toutes les pièces jointes d'un ticket
# ─────────────────────────────────────────────────────────────────────────────
class TicketAttachmentListView(APIView):
    permission_classes = [IsAuthenticated]
 
    def get(self, request, pk):
        ticket = get_ticket_or_404(pk)
        if not ticket:
            return Response(
                {'detail': 'Ticket introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
 
        if not user_can_access_ticket(ticket, request.user):
            return Response(
                {'detail': "Vous n'avez pas accès à ce ticket."},
                status=status.HTTP_403_FORBIDDEN
            )
 
        attachments = TicketAttachment.objects.filter(
            ticket=ticket
        ).select_related('uploaded_by').order_by('uploaded_at')
 
        data = [
            {
                'id':            a.id,
                'original_name': a.original_name,
                'file_size':     a.file_size,
                'mime_type':     a.mime_type,
                'uploaded_by':   (
                    f"{a.uploaded_by.first_name} {a.uploaded_by.last_name}"
                ),
                'uploaded_at':   a.uploaded_at,
                'file_url':      request.build_absolute_uri(a.file.url),
            }
            for a in attachments
        ]
 
        return Response({
            'ticket_number': ticket.ticket_number,
            'count':         len(data),
            'attachments':   data,
        })
 
 
# ─────────────────────────────────────────────────────────────────────────────
# DELETE /api/tickets/attachments/<attachment_id>/
# Supprimer une pièce jointe (celui qui l'a uploadée ou l'admin)
# ─────────────────────────────────────────────────────────────────────────────
class TicketAttachmentDeleteView(APIView):
    permission_classes = [IsAuthenticated]
 
    def delete(self, request, attachment_id):
        try:
            attachment = TicketAttachment.objects.select_related(
                'uploaded_by', 'ticket'
            ).get(pk=attachment_id)
        except TicketAttachment.DoesNotExist:
            return Response(
                {'detail': 'Pièce jointe introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
 
        # Seul celui qui a uploadé ou l'admin peut supprimer
        is_owner = attachment.uploaded_by == request.user
        is_admin = request.user.role.name == 'ADMIN'
 
        if not (is_owner or is_admin):
            return Response(
                {'detail': "Vous ne pouvez pas supprimer cette pièce jointe."},
                status=status.HTTP_403_FORBIDDEN
            )
 
        ticket_number = attachment.ticket.ticket_number
        name          = attachment.original_name
 
        # Supprimer le fichier du stockage MinIO
        attachment.file.delete(save=False)
        attachment.delete()
 
        AuditLog.objects.create(
            user         = request.user,
            action_type  = AuditLog.ActionType.DELETE,
            target_model = 'TicketAttachment',
            target_id    = str(attachment_id),
            description  = (
                f"Pièce jointe '{name}' supprimée du ticket {ticket_number}"
            ),
        )
 
        return Response(
            {'detail': f"Pièce jointe '{name}' supprimée."},
            status=status.HTTP_200_OK
        )