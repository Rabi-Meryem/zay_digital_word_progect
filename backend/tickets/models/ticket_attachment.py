from django.db import models
from django.conf import settings


# ---------------------------------------------------------------------------
# Fonction de génération du chemin de stockage
# ---------------------------------------------------------------------------
def ticket_attachment_upload_path(instance, filename):
    return f"tickets/{instance.ticket.id}/attachments/{filename}"


# ---------------------------------------------------------------------------
# Table : ticket_attachments
# ---------------------------------------------------------------------------
class TicketAttachment(models.Model):
    """
    Pièces jointes associées à un ticket.
    Les fichiers sont stockés dans MinIO via django-storages.
    """

    ticket = models.ForeignKey(
        "tickets.Ticket",
        on_delete=models.CASCADE,
        related_name="attachments",
        db_column="ticket_id",
    )

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="ticket_attachments_uploaded",
        db_column="uploaded_by",
    )

    file = models.FileField(
        upload_to=ticket_attachment_upload_path,
        max_length=500,
    )

    filename = models.CharField(
        max_length=255,
    )

    original_name = models.CharField(
        max_length=255,
    )

    file_size = models.PositiveBigIntegerField()

    mime_type = models.CharField(
        max_length=100,
    )

    file_path = models.CharField(
        max_length=500,
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "ticket_attachments"
        verbose_name = "Pièce jointe"
        verbose_name_plural = "Pièces jointes"

        indexes = [
            models.Index(fields=["ticket"]),
            models.Index(fields=["uploaded_by"]),
        ]

    def __str__(self):
        return f"{self.original_name} ({self.ticket.ticket_number})"
    