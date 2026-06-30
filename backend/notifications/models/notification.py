from django.db import models
from django.conf import settings



class Notification(models.Model):
    """
    Notification envoyée à un utilisateur.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        db_column="user_id",
    )

    ticket = models.ForeignKey(
        "tickets.Ticket",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
        db_column="ticket_id",
    )

    notification_type = models.ForeignKey(
        "notifications.NotificationType",
        on_delete=models.PROTECT,
        related_name="notifications",
        db_column="notification_type_id",
    )

    title = models.CharField(
        max_length=255,
    )

    content = models.TextField()

    is_read = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "notifications"
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

        ordering = ["-created_at"]

        indexes = [
            models.Index(fields=["user", "is_read"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["notification_type"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.title}"