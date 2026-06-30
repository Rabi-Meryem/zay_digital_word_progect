from django.db import models



def message_attachment_upload_path(instance, filename):
    return f"messages/{instance.message.id}/attachments/{filename}"



class MessageAttachment(models.Model):
    """
    Pièce jointe associée à un message.
    Les fichiers sont stockés dans MinIO via django-storages.
    """

    message = models.ForeignKey(
        "messages_app.TicketMessage",
        on_delete=models.CASCADE,
        related_name="attachments",
        db_column="message_id",
    )

    file = models.FileField(
        upload_to=message_attachment_upload_path,
        max_length=500,
    )

    file_name = models.CharField(
        max_length=255,
    )

    original_name = models.CharField(
        max_length=255,
    )

    mime_type = models.CharField(
        max_length=100,
    )

    file_size = models.PositiveBigIntegerField()

    file_path = models.CharField(
        max_length=500,
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "message_attachments"
        verbose_name = "Pièce jointe de message"
        verbose_name_plural = "Pièces jointes de messages"

        indexes = [
            models.Index(fields=["message"]),
            models.Index(fields=["uploaded_at"]),
        ]

        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.original_name