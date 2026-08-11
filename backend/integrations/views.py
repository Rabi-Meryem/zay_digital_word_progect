from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.conf import settings

from integrations.email_service import email_service          # ← corrigé (pas .services.)
from integrations.imap_service import imap_service
from users.permissions import IsAdminRole
from integrations.models.smtp_configuration import SMTPConfiguration
from integrations.models.imap_configuration import IMAPConfiguration
from integrations.serializers import SMTPConfigurationSerializer, IMAPConfigurationSerializer


class SMTPConfigurationView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        config, _ = SMTPConfiguration.objects.get_or_create(
            pk=1, defaults={'host': '', 'port': 587, 'username': '', 'password': '',
                             'encryption': 'TLS', 'from_email': ''}
        )
        return Response(SMTPConfigurationSerializer(config).data)

    def patch(self, request):
        config, _ = SMTPConfiguration.objects.get_or_create(pk=1)
        serializer = SMTPConfigurationSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IMAPConfigurationView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        config, _ = IMAPConfiguration.objects.get_or_create(
            pk=1, defaults={'host': '', 'port': 993, 'username': '', 'password': '', 'encryption': 'SSL'}
        )
        return Response(IMAPConfigurationSerializer(config).data)

    def patch(self, request):
        config, _ = IMAPConfiguration.objects.get_or_create(pk=1)
        serializer = IMAPConfigurationSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IMAPPollView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        secret = request.headers.get('X-Cron-Secret', '')
        if secret != settings.INTERNAL_WEBHOOK_SECRET:
            return Response({'detail': 'Non autorisé.'}, status=403)
        try:
            tickets = imap_service.poll()
            return Response({'status': 'ok', 'tickets_created': tickets, 'count': len(tickets)})
        except Exception as e:
            return Response({'status': 'error', 'detail': str(e)}, status=500)


class SMTPTestView(APIView):
    """POST /api/integrations/smtp/test/ — envoie un email de test."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request):
        to = request.data.get('to')
        if not to:
            return Response({'detail': "Adresse 'to' requise."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            email_service.send(
                to_email=to,
                subject="ZAY Digital World — Email de test",
                body_html="<p>Ceci est un email de test envoyé depuis la configuration SMTP du portail.</p>",
                body_text="Ceci est un email de test envoyé depuis la configuration SMTP du portail.",
            )
            return Response({'detail': f'Email de test envoyé à {to}.'})
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class IMAPTestView(APIView):
    """POST /api/integrations/imap/test/ — teste la connexion IMAP."""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request):
        try:
            imap_service.test_connection()
            return Response({'detail': 'Connexion IMAP établie avec succès.'})
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)