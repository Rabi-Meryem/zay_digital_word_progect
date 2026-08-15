from sla.models.sla_rule import SLARule
from django.db import models
from django.conf import settings
from django.utils import timezone




class Ticket(models.Model):
    """
    Ticket principal de la plateforme.
    """

    class Source(models.TextChoices):
        WEB = "WEB", "Portail Web"
        EMAIL = "EMAIL", "Email (IMAP)"
        PHONE = "PHONE", "Téléphone"
        API = "API", "API"

    class Status(models.TextChoices):
        OPEN = "OPEN", "Ouvert"
        ASSIGNED = "ASSIGNED", "Affecté"
        IN_PROGRESS = "IN_PROGRESS", "En cours"
        WAITING = "WAITING", "En attente"
        ESCALATED = "ESCALATED", "Escaladé"
        RESOLVED = "RESOLVED", "Résolu"
        CLOSED = "CLOSED", "Clôturé"
        REOPENED = "REOPENED", "Réouvert"

    class Priority(models.TextChoices):
        CRITICAL = "CRITICAL", "Critique"
        HIGH = "HIGH", "Haute"
        MEDIUM = "MEDIUM", "Moyenne"
        LOW = "LOW", "Basse"
    
    class Module(models.TextChoices):
        IMPORT_EXPORT   = "Import / Export de données",        "Import / Export de données"
        API_INTEGRATION = "API & Intégrations",                "API & Intégrations"
        SYNCHRONISATION = "Synchronisation",                   "Synchronisation"
        AUTH_SSO        = "Authentification & SSO",            "Authentification & SSO"
        UTILISATEURS    = "Gestion des utilisateurs & Droits", "Gestion des utilisateurs & Droits"
        STOCKAGE        = "Stockage & Fichiers",               "Stockage & Fichiers"
        BASE_DONNEES    = "Base de données",                   "Base de données"
        SECURITE        = "Module de sécurité",                "Module de sécurité"
        PAIEMENT        = "Paiement & Facturation",            "Paiement & Facturation"
        RECHERCHE       = "Moteur de recherche",               "Moteur de recherche"
        WORKFLOW        = "Moteur de workflow",                "Moteur de workflow"
        REPORTING       = "Tableau de bord & Reporting",       "Tableau de bord & Reporting"
        MOBILE          = "Application mobile",                "Application mobile"
        INTERFACE       = "Interface utilisateur",             "Interface utilisateur"
        NOTIFICATIONS   = "Notifications & E-mails",           "Notifications & E-mails"

    ticket_number = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
    )

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="tickets_created",
        db_column="client_id",
    )

    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets_assigned",
        db_column="assigned_agent_id",
    )

    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets_supervised",
        db_column="supervisor_id",
    )

    title = models.CharField(max_length=255)

    description = models.TextField()

    source = models.CharField(
        max_length=20,
        choices=Source.choices,
    )

    current_status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
    )

    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
         null=True,    # ← autorise NULL en base pendant que superviseur/IA n'a pas encore défini
        blank=True,
    )

    ai_priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        blank=True,
        null=True,
    )

    ai_confidence = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
    )
    module = models.CharField(
        max_length=50,
        choices=Module.choices,
        blank=True,
        null=True,
    )

    ai_source = models.CharField(max_length=40, blank=True, default="")

    ai_justification = models.TextField(blank=True, default="")

    ai_relecture_requise = models.BooleanField(default=False)

    ai_seuil_calibre = models.BooleanField(default=False)

    sla_rule = models.ForeignKey(
        SLARule,
        on_delete=models.PROTECT,
        related_name="tickets",
        db_column="sla_rule_id",
    )

    assigned_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    taken_in_charge_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    sla_deadline = models.DateTimeField()

    first_response_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    resolved_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    closed_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    reopened_count = models.PositiveIntegerField(default=0)

    is_sla_respected = models.BooleanField(default=True)

    sla_warning_sent = models.BooleanField(default=False)  

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tickets"
        verbose_name = "Ticket"
        verbose_name_plural = "Tickets"

        ordering = ["-created_at"]

        indexes = [
            models.Index(fields=["current_status"]),
            models.Index(fields=["priority"]),
            models.Index(fields=["assigned_agent", "current_status"]),
            models.Index(fields=["sla_deadline"]),
            models.Index(fields=["client"]),
        ]

    def __str__(self):
        return f"{self.ticket_number} - {self.title}"

    def save(self, *args, **kwargs):
        """
        Génère automatiquement un numéro de ticket
        au format TK-AAAA-00001.
        """
        if not self.ticket_number:
            year = timezone.now().year

            last_ticket = (
                Ticket.objects.filter(
                    ticket_number__startswith=f"TK-{year}-"
                )
                .order_by("-id")
                .first()
            )

            if last_ticket:
                sequence = int(
                    last_ticket.ticket_number.split("-")[-1]
                ) + 1
            else:
                sequence = 1

            self.ticket_number = f"TK-{year}-{sequence:05d}"

        super().save(*args, **kwargs)