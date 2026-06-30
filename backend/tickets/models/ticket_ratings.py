from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


# ---------------------------------------------------------------------------
# Table : ticket_ratings
# ---------------------------------------------------------------------------
class TicketRating(models.Model):
    """
    Évaluation laissée par un client après la résolution d'un ticket.
    Un ticket ne peut avoir qu'une seule évaluation.
    """

    ticket = models.OneToOneField(
        "tickets.Ticket",
        on_delete=models.CASCADE,
        related_name="rating",
        db_column="ticket_id",
    )

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="ratings_given",
        db_column="client_id",
    )

    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="ratings_received",
        db_column="agent_id",
    )

    rating = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ]
    )

    comment = models.TextField(
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        db_table = "ticket_ratings"
        verbose_name = "Évaluation de ticket"
        verbose_name_plural = "Évaluations de tickets"

        indexes = [
            models.Index(fields=["agent"]),
            models.Index(fields=["rating"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.ticket.ticket_number} - {self.rating}★"