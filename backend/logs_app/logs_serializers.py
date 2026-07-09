from rest_framework import serializers
from logs_app.models import AuditLog
 
 
class AuditLogSerializer(serializers.ModelSerializer):
    """
    Serializer en lecture seule pour l'affichage des logs.
    Ajoute le nom complet de l'utilisateur directement dans la réponse
    pour que le frontend n'ait pas besoin de faire une deuxième requête.
    """
    user_full_name  = serializers.SerializerMethodField()
    user_email      = serializers.SerializerMethodField()
    action_label    = serializers.SerializerMethodField()
 
    class Meta:
        model  = AuditLog
        fields = [
            'id',
            'user_full_name',
            'user_email',
            'action_type',
            'action_label',
            'target_model',
            'target_id',
            'description',
            'ip_address',
            'user_agent',
            'is_suspicious',
            'created_at',
        ]
 
    def get_user_full_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return "Système"
 
    def get_user_email(self, obj):
        if obj.user:
            return obj.user.email
        return None
 
    def get_action_label(self, obj):
        """Traduit le code action en texte lisible."""
        labels = {
            "LOGIN":          "Connexion",
            "LOGIN_FAILED":   "Échec de connexion",
            "LOGOUT":         "Déconnexion",
            "CREATE":         "Création",
            "UPDATE":         "Modification",
            "DELETE":         "Suppression",
            "ASSIGN":         "Affectation",
            "ESCALATE":       "Escalade",
            "EMAIL_SENT":     "Email envoyé",
            "EMAIL_FAILED":   "Échec email",
            "SECURITY_ALERT": "⚠️ Alerte sécurité",
        }
        return labels.get(obj.action_type, obj.action_type)