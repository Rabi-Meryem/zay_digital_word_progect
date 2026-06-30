from django.db import models



class SLAHistory(models.Model):
    """
    Historique du suivi SLA d'un ticket.
    """

    ticket = models.ForeignKey(
        "tickets.Ticket",
        on_delete=models.CASCADE,
        related_name="sla_history",
        db_column="ticket_id",
    )

    sla_start = models.DateTimeField()

    sla_end = models.DateTimeField()

    warning_sent = models.BooleanField(
        default=False,
    )

    exceeded = models.BooleanField(
        default=False,
    )

    exceeded_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "sla_history"
        verbose_name = "Historique SLA"
        verbose_name_plural = "Historiques SLA"

        ordering = ["-sla_start"]

        indexes = [
            models.Index(fields=["ticket"]),
            models.Index(fields=["exceeded"]),
            models.Index(fields=["warning_sent"]),
            models.Index(fields=["sla_end"]),
        ]

    def __str__(self):
        status = "Dépassé" if self.exceeded else "Respecté"
        return f"{self.ticket.ticket_number} - {status}"