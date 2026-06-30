from django.db import models



class AgentStatistics(models.Model):
    """
    Statistiques de performance d'un agent sur une période donnée.
    Utilisé pour les tableaux de bord et les rapports.
    """

    agent = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="statistics",
        db_column="agent_id",
    )

    period_start = models.DateField()

    period_end = models.DateField()

    assigned_tickets = models.PositiveIntegerField(default=0)

    resolved_tickets = models.PositiveIntegerField(default=0)

    reopened_tickets = models.PositiveIntegerField(default=0)

    escalated_tickets = models.PositiveIntegerField(default=0)

    average_resolution_time = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    average_first_response = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    sla_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
    )

    satisfaction_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
    )

    class Meta:
        db_table = "agent_statistics"
        verbose_name = "Statistique agent"
        verbose_name_plural = "Statistiques agents"

        indexes = [
            models.Index(fields=["agent", "period_start", "period_end"])
        ]

        constraints = [
            models.UniqueConstraint(
                fields=["agent", "period_start", "period_end"],
                name="unique_agent_statistics_period",
            )
        ]

    def __str__(self):
        return (
            f"Stats {self.agent.email} "
            f"[{self.period_start} - {self.period_end}]"
        )