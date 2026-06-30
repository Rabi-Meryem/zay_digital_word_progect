from django.db import models


# ---------------------------------------------------------------------------
# Table : agent_availability
# ---------------------------------------------------------------------------
class AgentAvailability(models.Model):
    """
    Disponibilité et charge de travail d'un agent.

    Relation 1-1 avec le modèle User.
    """

    class Status(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Disponible"
        BUSY = "BUSY", "Occupé"
        ABSENT = "ABSENT", "Absent"
        DISABLED = "DISABLED", "Désactivé"

    agent = models.OneToOneField(
        "users.User",
        on_delete=models.CASCADE,
        related_name="availability",
        db_column="agent_id",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE,
    )

    workload = models.PositiveIntegerField(default=0)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "agent_availability"
        verbose_name = "Disponibilité agent"
        verbose_name_plural = "Disponibilités agents"

    def __str__(self):
        return f"{self.agent.email} - {self.status} ({self.workload} tickets)"