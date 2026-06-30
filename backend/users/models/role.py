from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.conf import settings
 
 
# ---------------------------------------------------------------------------
# Table 1 : roles
# ---------------------------------------------------------------------------
class Role(models.Model):
    """
    Centralise les rôles disponibles dans l'application.
    Un utilisateur possède un seul rôle (Roles 1 -------- N Users).
    """
 
    class RoleName(models.TextChoices):
        CLIENT = "CLIENT", "Client"
        AGENT = "AGENT", "Agent"
        SUPERVISOR = "SUPERVISOR", "Superviseur"
        ADMIN = "ADMIN", "Administrateur"
 
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(
        max_length=20,
        choices=RoleName.choices,
        unique=True,
        help_text="Nom du rôle (CLIENT, AGENT, SUPERVISOR ou ADMIN).",
    )
    description = models.TextField(blank=True, null=True)
 
    class Meta:
        db_table = "roles"
        verbose_name = "Rôle"
        verbose_name_plural = "Rôles"
 
    def __str__(self):
        return self.name