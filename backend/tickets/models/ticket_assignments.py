from django.db import models
from django.conf import settings



class TicketAssignment(models.Model):
    """
    Historique des affectations d'un ticket.
    """

    ticket = models.ForeignKey(
        "tickets.Ticket",
        on_delete=models.CASCADE,
        related_name="assignments",
        db_column="ticket_id",
    )

    assigned_from = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assignments_from",
        db_column="assigned_from",
    )

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="assignments_to",
        db_column="assigned_to",
    )

    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="assignments_made",
        db_column="assigned_by",
    )

    assignment_date = models.DateTimeField(
        auto_now_add=True,
    )

    reason = models.TextField(
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "ticket_assignments"
        verbose_name = "Affectation de ticket"
        verbose_name_plural = "Affectations de tickets"

        ordering = ["-assignment_date"]

        indexes = [
            models.Index(fields=["ticket", "assignment_date"]),
            models.Index(fields=["assigned_to"]),
            models.Index(fields=["assigned_by"]),
        ]

    def __str__(self):
        return (
            f"{self.ticket.ticket_number} → "
            f"{self.assigned_to.email}"
        )