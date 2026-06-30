from django.db import models
from django.conf import settings



class TicketMessage(models.Model):
    """
    Message échangé entre deux utilisateurs à propos d'un ticket.
    """

    ticket = models.ForeignKey(
        "tickets.Ticket",
        on_delete=models.CASCADE,
        related_name="messages",
        db_column="ticket_id",
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="messages_sent",
        db_column="sender_id",
    )

    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="messages_received",
        db_column="receiver_id",
    )

    message = models.TextField()

    is_read = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "ticket_messages"
        verbose_name = "Message de ticket"
        verbose_name_plural = "Messages de tickets"

        ordering = ["created_at"]

        indexes = [
            models.Index(fields=["ticket", "created_at"]),
            models.Index(fields=["receiver", "is_read"]),
            models.Index(fields=["sender"]),
        ]

    def __str__(self):
        return (
            f"[{self.ticket.ticket_number}] "
            f"{self.sender.email} → "
            f"{self.receiver.email}"
        )