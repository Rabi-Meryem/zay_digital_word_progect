from django.db import models



class NotificationChannel(models.Model):
    """
    Canaux utilisés pour envoyer les notifications.
    """

    class ChannelName(models.TextChoices):
        EMAIL = "EMAIL", "Email"
        IN_APP = "IN_APP", "In-App"

    name = models.CharField(
        max_length=20,
        choices=ChannelName.choices,
        unique=True,
    )

    description = models.TextField(
        blank=True,
        null=True,
    )

    active = models.BooleanField(
        default=True,
    )

    class Meta:
        db_table = "notification_channels"
        verbose_name = "Canal de notification"
        verbose_name_plural = "Canaux de notification"

        ordering = ["name"]

    def __str__(self):
        return self.get_name_display()