from django.db import models
from django.conf import settings
 
 
class AuditLog(models.Model):
 
    class ActionType(models.TextChoices):
        LOGIN = "LOGIN", "Connexion"
        LOGIN_FAILED = "LOGIN_FAILED", "Échec de connexion"
        LOGOUT = "LOGOUT", "Déconnexion"
        CREATE = "CREATE", "Création"
        UPDATE = "UPDATE", "Modification"
        DELETE = "DELETE", "Suppression"
        ASSIGN = "ASSIGN", "Affectation"
        ESCALATE = "ESCALATE", "Escalade"
        EMAIL_SENT = "EMAIL_SENT", "Email envoyé"
        EMAIL_FAILED = "EMAIL_FAILED", "Échec email"
        SECURITY_ALERT = "SECURITY_ALERT", "Alerte sécurité"
 
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="audit_logs", db_column="user_id",
    )
    action_type = models.CharField(max_length=30, choices=ActionType.choices)
    # Référence générique vers l'objet concerné (ticket, user, config...) sans FK stricte
    # pour rester utilisable même après suppression de l'objet d'origine.
    target_model = models.CharField(max_length=100, blank=True, null=True)
    target_id = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField()
    ip_address = models.CharField(max_length=100, blank=True, null=True)
    user_agent = models.CharField(max_length=255, blank=True, null=True)
    is_suspicious = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
 
    class Meta:
        db_table = "audit_logs"
        verbose_name = "Log d'audit"
        verbose_name_plural = "Logs d'audit"
        indexes = [
            models.Index(fields=["action_type", "created_at"]),
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["is_suspicious"]),
        ]
        ordering = ["-created_at"]
 
    def __str__(self):
        return f"{self.action_type} - {self.user} - {self.created_at}"