from rest_framework import serializers
from notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    notification_type = serializers.CharField(source='notification_type.name', read_only=True)
    ticket_number = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'content', 'is_read', 'created_at', 'ticket_number']

    def get_ticket_number(self, obj):
        return obj.ticket.ticket_number if obj.ticket else None