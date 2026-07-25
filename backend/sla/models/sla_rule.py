from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class SLARule(models.Model):
    """
    Règle SLA = croisement Plan client (users.User.plan) x Priorité ticket.
    Remplace l'ancien modèle plat (1 ligne/priorité) suite au cahier
    des charges client (doc "Critères SLA").
    """

    class Plan(models.TextChoices):
        ESSENTIEL = "ESSENTIEL", "Essentiel"
        STANDARD = "STANDARD", "Standard"
        PREMIUM = "PREMIUM", "Premium"

    class Priority(models.TextChoices):
        CRITICAL = "CRITICAL", "Critique"
        HIGH = "HIGH", "Haute"
        MEDIUM = "MEDIUM", "Moyenne"
        LOW = "LOW", "Basse"

    plan = models.CharField(
        max_length=20,
        choices=Plan.choices,
        default=Plan.ESSENTIEL,
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
    )

    response_hours = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        help_text="Temps de réponse maximum (heures).",
    )
    diagnostic_hours = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        help_text="Temps de diagnostic cible (heures). Vide = 'selon planning'.",
    )
    resolution_hours = models.DecimalField(
        max_digits=6, decimal_places=2,
        validators=[MinValueValidator(0.5)],
        help_text="Délai de correction max (heures). Sert au calcul du sla_deadline.",
    )

    warning_percentage = models.PositiveSmallIntegerField(
        default=80,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
    )
    active = models.BooleanField(default=True)

    class Meta:
        db_table = "sla_rules"
        verbose_name = "Règle SLA"
        verbose_name_plural = "Règles SLA"
        unique_together = [("plan", "priority")]
        ordering = ["plan", "resolution_hours"]

    def __str__(self):
        return f"{self.plan} / {self.priority} — correction {self.resolution_hours}h"