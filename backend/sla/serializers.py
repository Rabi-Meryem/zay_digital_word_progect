from rest_framework import serializers
from .models.sla_rule import SLARule


class SLARuleSerializer(serializers.ModelSerializer):
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = SLARule
        fields = ['id', 'priority', 'priority_display', 'resolution_hours',
                  'warning_percentage', 'active']
        read_only_fields = ['id']