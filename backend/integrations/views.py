from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.conf import settings
from integrations.imap_service import imap_service

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