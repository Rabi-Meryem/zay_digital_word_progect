from django.db import models
from .user import User


class LoginHistory(models.Model):
    """
    Historique des tentatives de connexion.
    Utilisé pour l'audit et la sécurité.
    """

    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="login_history",
        db_column="user_id",
    )

    login_date = models.DateTimeField()

    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True,
    )

    browser = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    success = models.BooleanField()

    failure_reason = models.TextField(
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "login_history"
        verbose_name = "Historique de connexion"
        verbose_name_plural = "Historiques de connexion"

        ordering = ["-login_date"]

        indexes = [
            models.Index(fields=["user", "login_date"]),
            models.Index(fields=["success"]),
        ]

    def __str__(self):
        status = "OK" if self.success else "ECHEC"
        return f"{self.user.email} - {self.login_date} - {status}"