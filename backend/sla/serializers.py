from rest_framework import serializers
from .models.sla_rule import SLARule


class SLARuleSerializer(serializers.ModelSerializer):
    plan_display = serializers.CharField(source='get_plan_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = SLARule
        fields = [
            'id', 'plan', 'plan_display', 'priority', 'priority_display',
            'response_hours', 'diagnostic_hours', 'resolution_hours',
            'warning_percentage', 'active',
        ]
        read_only_fields = ['id']