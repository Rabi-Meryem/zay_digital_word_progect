from django.db import models
from django.conf import settings


# ---------------------------------------------------------------------------
# Table : escalations
# ---------------------------------------------------------------------------
class Escalation(models.Model):
    """
    Historique des escalades d'un ticket.
    """

    class EscalationType(models.TextChoices):
        AUTO = "AUTO", "Automatique"
        MANUAL = "MANUAL", "Manuelle"

    ticket = models.ForeignKey(
        "tickets.Ticket",
        on_delete=models.CASCADE,
        related_name="escalations",
        db_column="ticket_id",
    )

    escalation_type = models.CharField(
        max_length=10,
        choices=EscalationType.choices,
    )

    reason = models.TextField()

    escalated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="escalations_made",
        db_column="escalated_by",
    )

    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="escalations_received",
        db_column="supervisor_id",
    )

    escalation_date = models.DateTimeField(
        auto_now_add=True,
    )

    resolved = models.BooleanField(
        default=False,
    )

    class Meta:
        db_table = "escalations"
        verbose_name = "Escalade"
        verbose_name_plural = "Escalades"

        ordering = ["-escalation_date"]

        indexes = [
            models.Index(fields=["ticket"]),
            models.Index(fields=["supervisor", "resolved"]),
            models.Index(fields=["escalation_date"]),
        ]

    def __str__(self):
        status = "Résolue" if self.resolved else "En cours"

        return (
            f"{self.ticket.ticket_number} - "
            f"{self.escalation_type} - "
            f"{status}"
        )