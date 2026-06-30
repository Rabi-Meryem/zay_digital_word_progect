from django.db import models



class NotificationHistory(models.Model):
    """
    Historique des tentatives d'envoi d'une notification.
    Une même notification peut être envoyée via plusieurs canaux
    (Email, In-App, etc.).
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "En attente"
        SENT = "SENT", "Envoyée"
        FAILED = "FAILED", "Échec"

    notification = models.ForeignKey(
        "notifications.Notification",
        on_delete=models.CASCADE,
        related_name="history",
        db_column="notification_id",
    )

    channel = models.ForeignKey(
        "notifications.NotificationChannel",
        on_delete=models.PROTECT,
        related_name="history",
        db_column="channel_id",
    )

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )

    sent_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    error_message = models.TextField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "notification_history"
        verbose_name = "Historique de notification"
        verbose_name_plural = "Historiques de notifications"

        ordering = ["-created_at"]

        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["notification"]),
            models.Index(fields=["channel"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return (
            f"{self.notification.id} - "
            f"{self.channel.get_name_display()} - "
            f"{self.get_status_display()}"
        )