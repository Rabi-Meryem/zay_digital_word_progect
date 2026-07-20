from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from users.permissions import IsAdminOrSupervisor
from users.models import User
from tickets.models import Ticket
from tickets.services import ticket_service
from .models import Escalation
from .serializers import EscalationSerializer, EscalationReassignSerializer


def get_escalation_or_404(pk, supervisor):
    try:
        return Escalation.objects.select_related(
            'ticket', 'ticket__client', 'escalated_by', 'supervisor'
        ).get(pk=pk, supervisor=supervisor)
    except Escalation.DoesNotExist:
        return None


class EscalationListView(APIView):
    """GET /api/escalations/?state=pending|taken"""
    permission_classes = [IsAuthenticated, IsAdminOrSupervisor]

    def get(self, request):
        queryset = Escalation.objects.filter(
            supervisor=request.user
        ).select_related('ticket', 'ticket__client', 'escalated_by', 'supervisor')

        state = request.GET.get('state')
        if state == 'pending':
            queryset = queryset.filter(resolved=False)
        elif state == 'taken':
            queryset = queryset.filter(resolved=True)

        queryset = queryset.order_by('-escalation_date')
        return Response(EscalationSerializer(queryset, many=True).data)


class EscalationTakeView(APIView):
    """POST /api/escalations/<id>/take/ — le superviseur prend en charge."""
    permission_classes = [IsAuthenticated, IsAdminOrSupervisor]

    def post(self, request, pk):
        escalation = get_escalation_or_404(pk, request.user)
        if not escalation:
            return Response({'detail': 'Escalade introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        escalation.resolved = True
        escalation.save(update_fields=['resolved'])

        ticket_service.change_status(
            ticket=escalation.ticket,
            new_status=Ticket.Status.IN_PROGRESS,
            changed_by=request.user,
            reason="Escalade prise en charge par le superviseur",
        )
        return Response(EscalationSerializer(escalation).data)


class EscalationReassignView(APIView):
    """POST /api/escalations/<id>/reassign/ — réaffecte le ticket à un autre agent."""
    permission_classes = [IsAuthenticated, IsAdminOrSupervisor]

    def post(self, request, pk):
        escalation = get_escalation_or_404(pk, request.user)
        if not escalation:
            return Response({'detail': 'Escalade introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = EscalationReassignSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        agent = User.objects.get(pk=serializer.validated_data['agent_id'])
        ticket_service.assign_ticket(ticket=escalation.ticket, agent=agent, assigned_by=request.user)

        escalation.resolved = True
        escalation.save(update_fields=['resolved'])
        return Response(EscalationSerializer(escalation).data)


class EscalationSendBackView(APIView):
    """POST /api/escalations/<id>/send-back/ — renvoyer à l'agent d'origine."""
    permission_classes = [IsAuthenticated, IsAdminOrSupervisor]

    def post(self, request, pk):
        escalation = get_escalation_or_404(pk, request.user)
        if not escalation:
            return Response({'detail': 'Escalade introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if not escalation.escalated_by:
            return Response({'detail': "Aucun agent d'origine."}, status=status.HTTP_400_BAD_REQUEST)

        ticket_service.assign_ticket(
            ticket=escalation.ticket, agent=escalation.escalated_by, assigned_by=request.user
        )
        escalation.resolved = True
        escalation.save(update_fields=['resolved'])
        return Response(EscalationSerializer(escalation).data)