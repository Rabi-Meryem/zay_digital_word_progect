from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator



class SLARule(models.Model):
    """
    Définit les règles SLA en fonction de la priorité d'un ticket.
    """

    class Priority(models.TextChoices):
        CRITICAL = "CRITICAL", "Critique"
        HIGH = "HIGH", "Haute"
        MEDIUM = "MEDIUM", "Moyenne"
        LOW = "LOW", "Basse"

    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        unique=True,
    )

    resolution_hours = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text="Délai maximal de résolution en heures.",
    )

    warning_percentage = models.PositiveSmallIntegerField(
        default=80,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(100),
        ],
        help_text="Pourcentage du délai déclenchant l'alerte préventive.",
    )

    active = models.BooleanField(
        default=True,
    )

    class Meta:
        db_table = "sla_rules"
        verbose_name = "Règle SLA"
        verbose_name_plural = "Règles SLA"

        ordering = ["resolution_hours"]

    def __str__(self):
        return (
            f"{self.priority} - "
            f"{self.resolution_hours}h "
            f"(alerte à {self.warning_percentage}%)"
        )