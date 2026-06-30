from django.db import models
from django.conf import settings

from .ticket import Ticket



class TicketStatusHistory(models.Model):
    """
    Historique des changements de statut d'un ticket.
    """

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="status_history",
        db_column="ticket_id",
    )

    old_status = models.CharField(
        max_length=20,
        choices=Ticket.Status.choices,
    )

    new_status = models.CharField(
        max_length=20,
        choices=Ticket.Status.choices,
    )

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="status_changes",
        db_column="changed_by",
    )

    reason = models.TextField(
        blank=True,
        null=True,
    )

    changed_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "ticket_status_history"
        verbose_name = "Historique de statut"
        verbose_name_plural = "Historiques de statut"

        ordering = ["-changed_at"]

        indexes = [
            models.Index(fields=["ticket", "changed_at"]),
        ]

    def __str__(self):
        return (
            f"{self.ticket.ticket_number}: "
            f"{self.old_status} → {self.new_status}"
        )