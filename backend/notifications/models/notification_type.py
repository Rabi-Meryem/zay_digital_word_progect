from django.db import models



class NotificationType(models.Model):
    """
    Type de notification utilisé dans le système.
    Exemple :
        - Nouveau ticket
        - Ticket affecté
        - Ticket résolu
        - Dépassement SLA
        - Nouveau message
    """

    name = models.CharField(
        max_length=100,
        unique=True,
    )

    description = models.TextField(
        blank=True,
        null=True,
    )
    email_enabled = models.BooleanField(
        default=True
    )
    in_app_enabled = models.BooleanField(
        default=True
    )

    class Meta:
        db_table = "notification_types"
        verbose_name = "Type de notification"
        verbose_name_plural = "Types de notifications"

        ordering = ["name"]

    def __str__(self):
        return self.name