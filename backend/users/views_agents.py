from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from users.models import User, AgentAvailability
from users.permissions import IsAdminOrSupervisor
from users.serializers import AgentAvailabilitySerializer


class AgentListView(APIView):
    """
    GET /api/agents/
    Liste des agents avec leur disponibilité et charge de travail.
    Crée automatiquement une ligne AgentAvailability si elle n'existe pas
    encore pour un agent (cas d'un agent créé avant ce module).
    """
    permission_classes = [IsAuthenticated, IsAdminOrSupervisor]

    def get(self, request):
        agents = User.objects.filter(role__name='AGENT', is_active=True).select_related('role')

        results = []
        for agent in agents:
            availability, _ = AgentAvailability.objects.get_or_create(agent=agent)
            results.append(AgentAvailabilitySerializer(availability).data)

        return Response(results)


class AgentAvailabilityUpdateView(APIView):
    """
    PATCH /api/agents/<agent_id>/availability/
    Body: { "status": "AVAILABLE" | "BUSY" | "ABSENT" | "DISABLED" }
    """
    permission_classes = [IsAuthenticated, IsAdminOrSupervisor]

    def patch(self, request, agent_id):
        try:
            availability = AgentAvailability.objects.select_related('agent').get(agent_id=agent_id)
        except AgentAvailability.DoesNotExist:
            return Response({'detail': 'Agent introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        valid = [c[0] for c in AgentAvailability.Status.choices]
        if new_status not in valid:
            return Response(
                {'detail': f"Statut invalide. Valeurs acceptées : {valid}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        availability.status = new_status
        availability.save(update_fields=['status'])
        return Response(AgentAvailabilitySerializer(availability).data)