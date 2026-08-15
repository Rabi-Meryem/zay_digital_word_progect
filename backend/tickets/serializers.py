from rest_framework import serializers
from tickets.models import (
    Ticket, TicketStatusHistory,
    TicketAssignment, TicketAttachment, TicketRating
)
from users.models import User


# ─────────────────────────────────────────────────────────────────────────────
# Serializer de base pour afficher un utilisateur dans un ticket
# (juste les infos essentielles, pas tout le profil)
# ─────────────────────────────────────────────────────────────────────────────
class UserShortSerializer(serializers.ModelSerializer):
    """
    Affiche les infos minimales d'un user dans la réponse ticket.
    Exemple : { "id": 1, "full_name": "Ahmed Benali", "email": "...", "role": "AGENT" }
    """
    full_name = serializers.SerializerMethodField()
    role      = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model  = User
        fields = ['id', 'full_name', 'email', 'role']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"


# ─────────────────────────────────────────────────────────────────────────────
# Serializer pour CRÉER un ticket
# Utilisé sur : POST /api/tickets/
# ─────────────────────────────────────────────────────────────────────────────
class TicketCreateSerializer(serializers.ModelSerializer):
    """
    Reçoit les données saisies par l'utilisateur : titre, description.

    client_id est optionnel :
    - Si l'auteur de la requête est un CLIENT, il est ignoré (le client = request.user).
    - Si l'auteur est un SUPERVISOR, il devient OBLIGATOIRE : il indique
      pour quel client le ticket est créé (le superviseur ne doit jamais
      apparaître comme client du ticket).
    La validation stricte de client_id (obligatoire pour un superviseur,
    existence du client) est faite dans la vue, pas ici, car elle dépend
    du rôle de request.user.
    """
    client_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model  = Ticket
        fields = ['title', 'description', 'client_id', 'module']

    def validate_title(self, value):
        """Le titre doit faire entre 5 et 255 caractères."""
        if len(value.strip()) < 5:
            raise serializers.ValidationError(
                "Le titre doit contenir au moins 5 caractères."
            )
        return value.strip()

    def validate_description(self, value):
        """La description doit faire au moins 10 caractères."""
        if len(value.strip()) < 10:
            raise serializers.ValidationError(
                "La description doit contenir au moins 10 caractères."
            )
        return value.strip()


# ─────────────────────────────────────────────────────────────────────────────
# Serializer pour LISTER les tickets (vue résumée)
# Utilisé sur : GET /api/tickets/
# ─────────────────────────────────────────────────────────────────────────────
class TicketListSerializer(serializers.ModelSerializer):
    """
    Version allégée d'un ticket pour la liste.
    On affiche les infos essentielles sans tout charger
    (pas les messages, pas l'historique complet).
    """
    client         = UserShortSerializer(read_only=True)
    assigned_agent = UserShortSerializer(read_only=True)
    sla_remaining  = serializers.SerializerMethodField()
    sla_status     = serializers.SerializerMethodField()
    rating         = serializers.SerializerMethodField()
    assignment_note = serializers.SerializerMethodField()
    class Meta:
        model  = Ticket
        fields = [
            'id', 'ticket_number', 'title','module',
            'current_status', 'priority', 'ai_priority',
            'source', 'client', 'assigned_agent',
            'sla_deadline', 'sla_remaining', 'sla_status',
            'is_sla_respected', 'created_at', 'updated_at',
            'resolved_at', 'first_response_at',
            'rating','assignment_note',
        ]

    def get_sla_remaining(self, obj):
        from django.utils import timezone
        delta = obj.sla_deadline - timezone.now()
        return int(delta.total_seconds() / 60)

    def get_sla_status(self, obj):
        from django.utils import timezone
        now     = timezone.now()
        total   = (obj.sla_deadline - obj.created_at).total_seconds()
        elapsed = (now - obj.created_at).total_seconds()
        if elapsed >= total:
            return "EXCEEDED"
        elif elapsed >= total * 0.8:
            return "WARNING"
        return "OK"

    def get_rating(self, obj):
        try:
            return obj.rating.rating
        except Exception:
            return None
    def get_assignment_note(self, obj):
        last_assignment = obj.assignments.order_by('-assignment_date').first()
        return last_assignment.reason if last_assignment and last_assignment.reason else None

# ─────────────────────────────────────────────────────────────────────────────
# Serializer pour le DÉTAIL d'un ticket
# Utilisé sur : GET /api/tickets/<id>/
# ─────────────────────────────────────────────────────────────────────────────
class TicketDetailSerializer(serializers.ModelSerializer):
    client         = UserShortSerializer(read_only=True)
    assigned_agent = UserShortSerializer(read_only=True)
    supervisor     = UserShortSerializer(read_only=True)
    status_history = serializers.SerializerMethodField()
    attachments    = serializers.SerializerMethodField()
    rating         = serializers.SerializerMethodField()
    sla_remaining  = serializers.SerializerMethodField()
    sla_status     = serializers.SerializerMethodField()
    assignment_note = serializers.SerializerMethodField()
    class Meta:
        model  = Ticket
        fields = [
            'id', 'ticket_number', 'title', 'description','module',
            'source', 'current_status', 'priority', 'ai_priority',
            'ai_confidence', 'ai_source', 'ai_justification',
            'ai_relecture_requise', 'ai_seuil_calibre','client', 'assigned_agent', 'supervisor',
            'sla_deadline', 'sla_remaining', 'sla_status',
            'is_sla_respected', 'reopened_count',
            'assigned_at', 'taken_in_charge_at',
            'first_response_at', 'resolved_at', 'closed_at',
            'created_at', 'updated_at',
            'status_history', 'attachments', 'rating', 'assignment_note',
        ]

    def get_status_history(self, obj):
        history = obj.status_history.select_related('changed_by').all()
        return [
            {
                'old_status': h.old_status,
                'new_status': h.new_status,
                'changed_by': f"{h.changed_by.first_name} {h.changed_by.last_name}",
                'reason':     h.reason,
                'changed_at': h.changed_at,
            }
            for h in history
        ]

    def get_attachments(self, obj):
        return [
            {
                'id':            a.id,
                'original_name': a.original_name,
                'file_size':     a.file_size,
                'mime_type':     a.mime_type,
                'uploaded_at':   a.uploaded_at,
                'file_url':      a.file.url,
            }
            for a in obj.attachments.all()
        ]

    def get_rating(self, obj):
        try:
            r = obj.rating
            return {
                'rating':     r.rating,
                'comment':    r.comment,
                'created_at': r.created_at,
            }
        except Exception:
            return None

    def get_sla_remaining(self, obj):
        from django.utils import timezone
        delta = obj.sla_deadline - timezone.now()
        return int(delta.total_seconds() / 60)

    def get_sla_status(self, obj):
        from django.utils import timezone
        now     = timezone.now()
        total   = (obj.sla_deadline - obj.created_at).total_seconds()
        elapsed = (now - obj.created_at).total_seconds()
        if elapsed >= total:
            return "EXCEEDED"
        elif elapsed >= total * 0.8:
            return "WARNING"
        return "OK"
    def get_assignment_note(self, obj):
        last_assignment = obj.assignments.order_by('-assignment_date').first()
        return last_assignment.reason if last_assignment and last_assignment.reason else None

# ─────────────────────────────────────────────────────────────────────────────
# Serializer pour ASSIGNER un ticket à un agent
# ─────────────────────────────────────────────────────────────────────────────
class TicketAssignSerializer(serializers.Serializer):
    agent_id = serializers.IntegerField()
    note = serializers.CharField(required=False, allow_blank=True, default='')
    def validate_agent_id(self, value):
        try:
            User.objects.get(pk=value, role__name='AGENT', is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Agent introuvable ou inactif."
            )
        return value


# ─────────────────────────────────────────────────────────────────────────────
# Serializer pour ESCALADER un ticket
# ─────────────────────────────────────────────────────────────────────────────
class TicketEscalateSerializer(serializers.Serializer):
    reason = serializers.CharField(
        min_length=10,
        error_messages={
            'min_length': "Veuillez expliquer la raison de l'escalade (minimum 10 caractères)."
        }
    )


# ─────────────────────────────────────────────────────────────────────────────
# Serializer pour ÉVALUER un ticket résolu
# ─────────────────────────────────────────────────────────────────────────────
class TicketRateSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True)


# ─────────────────────────────────────────────────────────────────────────────
# Serializer pour CHANGER le statut d'un ticket
# ─────────────────────────────────────────────────────────────────────────────
class TicketStatusUpdateSerializer(serializers.Serializer):
    current_status = serializers.ChoiceField(choices=Ticket.Status.choices)
    reason         = serializers.CharField(required=False, allow_blank=True)