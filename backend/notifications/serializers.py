from rest_framework import serializers
from notifications.models import (
    Notification, NotificationType, NotificationChannel, NotificationHistory,
)


class NotificationSerializer(serializers.ModelSerializer):
    notification_type = serializers.CharField(source='notification_type.name', read_only=True)
    ticket_number = serializers.SerializerMethodField()
    ticket_id = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'content', 'is_read', 'created_at', 'ticket_number', 'ticket_id']

    def get_ticket_number(self, obj):
        return obj.ticket.ticket_number if obj.ticket else None

    def get_ticket_id(self, obj):
        return obj.ticket.id if obj.ticket else None


class NotificationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationType
        fields = ['id', 'name', 'description', 'email_enabled', 'in_app_enabled']


class NotificationChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationChannel
        fields = ['id', 'name', 'description', 'active']


class NotificationHistorySerializer(serializers.ModelSerializer):
    channel_name = serializers.CharField(source='channel.name', read_only=True)
    notification_title = serializers.CharField(source='notification.title', read_only=True)
    recipient = serializers.CharField(source='notification.user.email', read_only=True)

    class Meta:
        model = NotificationHistory
        fields = [
            'id', 'notification', 'notification_title', 'recipient',
            'channel_name', 'status', 'sent_at', 'error_message', 'created_at',
        ]