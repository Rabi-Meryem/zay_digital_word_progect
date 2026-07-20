from rest_framework import serializers
from tickets.serializers import UserShortSerializer
from .models import Escalation


class EscalationSerializer(serializers.ModelSerializer):
    escalated_by = UserShortSerializer(read_only=True)
    supervisor = UserShortSerializer(read_only=True)
    ticket_number = serializers.CharField(source='ticket.ticket_number', read_only=True)
    ticket_title = serializers.CharField(source='ticket.title', read_only=True)
    priority = serializers.CharField(source='ticket.priority', read_only=True)
    client_name = serializers.SerializerMethodField()
    sla_deadline = serializers.DateTimeField(source='ticket.sla_deadline', read_only=True)
    ticket_created_at = serializers.DateTimeField(source='ticket.created_at', read_only=True)

    class Meta:
        model = Escalation
        fields = [
            'id', 'ticket', 'ticket_number', 'ticket_title', 'priority',
            'escalation_type', 'reason', 'escalated_by', 'supervisor',
            'escalation_date', 'resolved', 'client_name',
            'sla_deadline', 'ticket_created_at',
        ]

    def get_client_name(self, obj):
        c = obj.ticket.client
        return f"{c.first_name} {c.last_name}"


class EscalationReassignSerializer(serializers.Serializer):
    agent_id = serializers.IntegerField()
    note = serializers.CharField(required=False, allow_blank=True)

    def validate_agent_id(self, value):
        from users.models import User
        if not User.objects.filter(pk=value, role__name='AGENT', is_active=True).exists():
            raise serializers.ValidationError("Agent introuvable ou inactif.")
        return value