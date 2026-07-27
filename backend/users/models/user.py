from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)

from .role import Role


class SubscriptionPlan(models.TextChoices):
    ESSENTIEL = "ESSENTIEL", "Essentiel"
    STANDARD = "STANDARD", "Standard"
    PREMIUM = "PREMIUM", "Premium"


class UserManager(BaseUserManager):
    """
    Manager personnalisé : authentification par email.
    """

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire.")

        email = self.normalize_email(email)
        extra_fields.setdefault("is_active", True)

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        role, created = Role.objects.get_or_create(
            name=Role.RoleName.ADMIN
        )

        extra_fields.setdefault("role", role)

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Modèle utilisateur personnalisé.
    Authentification basée sur l'email au lieu du username.
    """

    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        related_name="users",
        db_column="role_id",
    )

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)

    email = models.EmailField(max_length=150, unique=True)

    phone = models.CharField(max_length=20, blank=True, null=True)
    photo = models.CharField(max_length=255, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    email_verified = models.BooleanField(default=False)

    plan = models.CharField(
        max_length=20,
        choices=SubscriptionPlan.choices,
        default=SubscriptionPlan.ESSENTIEL,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        db_table = "users"
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"

        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["role", "is_active"]),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role.name})"

    @property
    def is_client(self):
        return self.role.name == Role.RoleName.CLIENT

    @property
    def is_agent(self):
        return self.role.name == Role.RoleName.AGENT

    @property
    def is_supervisor(self):
        return self.role.name == Role.RoleName.SUPERVISOR

    @property
    def is_admin_role(self):
        return self.role.name == Role.RoleName.ADMIN