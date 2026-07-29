 
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from users.models import User, Role
from users.models import AgentAvailability
 
# -----------------------------------------------------------------------
# Serializer du rôle — lecture seule, utilisé dans UserSerializer
# -----------------------------------------------------------------------
class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name']
 
 
# -----------------------------------------------------------------------
# Serializer utilisé pour lire les infos d'un utilisateur (GET)
# Jamais le mot de passe dans la réponse — champ write_only sur password.
# -----------------------------------------------------------------------
class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
 
    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'email',
            'phone', 'photo', 'is_active', 'role','plan',
            'created_at', 'last_login'
        ]
        read_only_fields = ['id', 'created_at', 'last_login']
 
 
# -----------------------------------------------------------------------
# Serializer pour créer un utilisateur (POST — admin uniquement)
# -----------------------------------------------------------------------
class UserCreateSerializer(serializers.ModelSerializer):
    # role_id reçu depuis le frontend (ex: {"role_id": 2})
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        source='role',
        write_only=True
    )
    password = serializers.CharField(
        write_only=True,        # jamais renvoyé dans la réponse
        required=True,
        validators=[validate_password]  # vérifie longueur, complexité
    )
 
    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'email',
            'phone', 'password', 'role_id', 'plan'
       ]

    def validate(self, attrs):
        # Le plan n'a de sens que pour un client — évite une valeur
        # incohérente sur un compte AGENT/SUPERVISOR/ADMIN.
        role = attrs.get('role')
        plan = attrs.get('plan')
        if role and role.name != Role.RoleName.CLIENT and plan and plan != User._meta.get_field('plan').default:
            raise serializers.ValidationError(
                {"plan": "Le plan ne s'applique qu'aux comptes de type CLIENT."}
            )
        return attrs
    def create(self, validated_data):
        # set_password() hache le mot de passe avec PBKDF2 automatiquement
        # Ne jamais faire user.password = "..." en clair
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=validated_data.get('phone', ''),
            role=validated_data['role'],
            plan=validated_data.get('plan', User._meta.get_field('plan').default),
        )
        return user
 
 
# -----------------------------------------------------------------------
# Serializer pour modifier un utilisateur (PATCH — admin uniquement)
# -----------------------------------------------------------------------
class UserUpdateSerializer(serializers.ModelSerializer):
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        source='role',
        required=False
    )
 
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'is_active', 'role_id', 'plan']
 
 
# -----------------------------------------------------------------------
# Serializer pour réinitialiser le mot de passe (admin uniquement)
# -----------------------------------------------------------------------
class PasswordResetSerializer(serializers.Serializer):
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    confirm_password = serializers.CharField(write_only=True, required=True)
 
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {"confirm_password": "Les deux mots de passe ne correspondent pas."}
            )
        return attrs
 
class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer utilisé uniquement pour la liste des utilisateurs côté admin.
    """
    role = RoleSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'full_name', 'first_name', 'last_name',
            'email', 'phone', 'role','plan','is_active',
            'status_label', 'created_at', 'last_login'
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_status_label(self, obj):
        return "Actif" if obj.is_active else "Désactivé"


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'email',
            'phone',
            'photo',
        ]

    def validate_email(self, value):
        user = self.instance

        if User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError(
                "Cette adresse email est déjà utilisée."
            )

        return value
class AgentAvailabilitySerializer(serializers.ModelSerializer):
    agent_id = serializers.IntegerField(source='agent.id', read_only=True)
    full_name = serializers.SerializerMethodField()
    email = serializers.CharField(source='agent.email', read_only=True)

    class Meta:
        model = AgentAvailability
        fields = ['agent_id', 'full_name', 'email', 'status', 'workload', 'updated_at']

    def get_full_name(self, obj):
        return f"{obj.agent.first_name} {obj.agent.last_name}"