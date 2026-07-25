from rest_framework import serializers
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = ['id', 'report_type', 'period_start', 'period_end', 'file', 'generated_at', 'generated_by_name']

    def get_generated_by_name(self, obj):
        return f"{obj.generated_by.first_name} {obj.generated_by.last_name}"