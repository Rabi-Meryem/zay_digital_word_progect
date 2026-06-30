from django.db import models



class IMAPConfiguration(models.Model):
    """
    Configuration du serveur IMAP utilisée pour la récupération automatique
    des emails entrants.
    Les mots de passe doivent être chiffrés avant d'être enregistrés.
    """

    class Encryption(models.TextChoices):
        TLS = "TLS", "TLS"
        SSL = "SSL", "SSL"

    host = models.CharField(
        max_length=255,
    )

    port = models.PositiveIntegerField()

    username = models.CharField(
        max_length=255,
    )

    password = models.CharField(
        max_length=255,
        help_text="Mot de passe chiffré.",
    )

    encryption = models.CharField(
        max_length=10,
        choices=Encryption.choices,
    )

    enabled = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "imap_configuration"
        verbose_name = "Configuration IMAP"
        verbose_name_plural = "Configurations IMAP"

    def __str__(self):
        status = "Actif" if self.enabled else "Inactif"
        return f"{self.host}:{self.port} ({status})"