from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.conf import settings
from integrations.imap_service import imap_service
from users.permissions import IsAdminRole
from integrations.models.smtp_configuration import SMTPConfiguration
from integrations.models.imap_configuration import IMAPConfiguration
from integrations.serializers import SMTPConfigurationSerializer, IMAPConfigurationSerializer


class SMTPConfigurationView(APIView):
    """GET/PATCH /api/integrations/smtp/ — configuration unique, admin uniquement."""
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
    """GET/PATCH /api/integrations/imap/ — configuration unique, admin uniquement."""
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
             return Response({
                 'status': 'ok',
                 'tickets_created': tickets,
                 'count': len(tickets),
             })
         except Exception as e:
             return Response({'status': 'error', 'detail': str(e)}, status=500)