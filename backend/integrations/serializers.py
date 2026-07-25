from rest_framework import serializers
from integrations.models.smtp_configuration import SMTPConfiguration
from integrations.models.imap_configuration import IMAPConfiguration


class SMTPConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SMTPConfiguration
        fields = ['id', 'host', 'port', 'username', 'password', 'encryption', 'from_email', 'enabled']
        extra_kwargs = {'password': {'write_only': True}}


class IMAPConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = IMAPConfiguration
        fields = ['id', 'host', 'port', 'username', 'password', 'encryption', 'enabled']
        extra_kwargs = {'password': {'write_only': True}}