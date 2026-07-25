# RÔLE : Des serializers différents selon le rôle de l'utilisateur.
# Chaque rôle voit uniquement ce que ses permissions autorisent.
# CLIENT : ses données + statut + SLA restant
# AGENT  : tout + notes internes + historique statuts
# SUPERVISEUR : tout + prédiction IA + statistiques
# ADMIN  : tout sans restriction
 
from rest_framework import serializers
from tickets.models import Ticket, TicketStatusHistory, TicketAttachment
from users.models import User
 
 
class UserShortSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role      = serializers.CharField(source='role.name', read_only=True)
 
    class Meta:
        model  = User
        fields = ['id', 'full_name', 'email', 'role']
 
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
 
 
def get_sla_remaining_minutes(ticket):
    from django.utils import timezone
    delta = ticket.sla_deadline - timezone.now()
    return int(delta.total_seconds() / 60)
 
 
def get_sla_status(ticket):
    from django.utils import timezone
    now     = timezone.now()
    total   = (ticket.sla_deadline - ticket.created_at).total_seconds()
    elapsed = (now - ticket.created_at).total_seconds()
    if elapsed >= total:
        return "EXCEEDED"
    elif elapsed >= total * 0.8:
        return "WARNING"
    return "OK"
 
 
# ─────────────────────────────────────────────────────────────────────────────
# SERIALIZER CLIENT
# Voit : ses données, statut, SLA restant, pièces jointes, évaluation
# Ne voit PAS : prédiction IA, notes internes, historique complet
# ─────────────────────────────────────────────────────────────────────────────
class TicketDetailClientSerializer(serializers.ModelSerializer):
    agent_name   = serializers.SerializerMethodField()
    sla_remaining = serializers.SerializerMethodField()
    sla_status   = serializers.SerializerMethodField()
    attachments  = serializers.SerializerMethodField()
    rating       = serializers.SerializerMethodField()
 
    class Meta:
        model  = Ticket
        fields = [
            'id', 'ticket_number', 'title', 'description',
            'source', 'current_status', 'priority',
            'agent_name', 'sla_deadline', 'sla_remaining',
            'sla_status', 'is_sla_respected', 'reopened_count',
            'created_at', 'updated_at', 'resolved_at',
            'attachments', 'rating',
        ]
 
    def get_agent_name(self, obj):
        if obj.assigned_agent:
            return f"{obj.assigned_agent.first_name} {obj.assigned_agent.last_name}"
        return None
 
    def get_sla_remaining(self, obj):
        return get_sla_remaining_minutes(obj)
 
    def get_sla_status(self, obj):
        return get_sla_status(obj)
 
    def get_attachments(self, obj):
        return [
            {
                'id':            a.id,
                'original_name': a.original_name,
                'file_size':     a.file_size,
                'mime_type':     a.mime_type,
                'uploaded_at':   a.uploaded_at,
            }
            for a in obj.attachments.all()
        ]
 
    def get_rating(self, obj):
        try:
            r = obj.rating
            return {'rating': r.rating, 'comment': r.comment}
        except Exception:
            return None
 
 
# ─────────────────────────────────────────────────────────────────────────────
# SERIALIZER AGENT
# Voit tout ce que voit le client + historique statuts + infos assignation
# ─────────────────────────────────────────────────────────────────────────────
class TicketDetailAgentSerializer(TicketDetailClientSerializer):
    status_history  = serializers.SerializerMethodField()
    supervisor_name = serializers.SerializerMethodField()
 
    class Meta(TicketDetailClientSerializer.Meta):
        fields = TicketDetailClientSerializer.Meta.fields + [
            'status_history', 'supervisor_name',
            'assigned_at', 'taken_in_charge_at', 'first_response_at',
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
 
    def get_supervisor_name(self, obj):
        if obj.supervisor:
            return f"{obj.supervisor.first_name} {obj.supervisor.last_name}"
        return None
 
 
# ─────────────────────────────────────────────────────────────────────────────
# SERIALIZER SUPERVISEUR
# Voit tout ce que voit l'agent + prédiction IA + confiance + statistiques
# ─────────────────────────────────────────────────────────────────────────────
class TicketDetailSupervisorSerializer(TicketDetailAgentSerializer):
    client         = UserShortSerializer(read_only=True)
    assigned_agent = UserShortSerializer(read_only=True)
    ai_prediction  = serializers.SerializerMethodField()
    time_stats     = serializers.SerializerMethodField()
 
    class Meta(TicketDetailAgentSerializer.Meta):
        fields = TicketDetailAgentSerializer.Meta.fields + [
            'client', 'assigned_agent',
            'ai_priority', 'ai_confidence',
            'ai_prediction', 'time_stats',
        ]
 
    def get_ai_prediction(self, obj):
        prediction = obj.ai_predictions.order_by('-created_at').first()
        if not prediction:
            return None
        return {
            'predicted_priority': prediction.predicted_priority,
            'confidence_score':   prediction.confidence_score,
            'processing_time':    prediction.processing_time,
            'created_at':         prediction.created_at,
        }
 
    def get_time_stats(self, obj):
        """Statistiques de temps pour analyse de performance."""
        from django.utils import timezone
        now = timezone.now()
 
        # Temps depuis création
        time_open = int((now - obj.created_at).total_seconds() / 60)
 
        # Temps de première réponse
        first_response_time = None
        if obj.first_response_at:
            first_response_time = int(
                (obj.first_response_at - obj.created_at).total_seconds() / 60
            )
 
        # Temps de résolution
        resolution_time = None
        if obj.resolved_at:
            resolution_time = int(
                (obj.resolved_at - obj.created_at).total_seconds() / 60
            )
 
        return {
            'time_open_minutes':           time_open,
            'first_response_time_minutes': first_response_time,
            'resolution_time_minutes':     resolution_time,
        }
 
 
# ─────────────────────────────────────────────────────────────────────────────
# SERIALIZER ADMIN
# Identique au superviseur — accès total sans restriction
# ─────────────────────────────────────────────────────────────────────────────
class TicketDetailAdminSerializer(TicketDetailSupervisorSerializer):
    pass
 
 
# ─────────────────────────────────────────────────────────────────────────────
# FONCTION UTILITAIRE : choisir le bon serializer selon le rôle
# Utilisée dans les vues pour ne pas dupliquer la logique
# ─────────────────────────────────────────────────────────────────────────────
def get_ticket_serializer_for_role(user):
    role = user.role.name
    if role == 'CLIENT':
        return TicketDetailClientSerializer
    elif role == 'AGENT':
        return TicketDetailAgentSerializer
    elif role == 'SUPERVISOR':
        return TicketDetailSupervisorSerializer
    else:  # ADMIN
        return TicketDetailAdminSerializer
 