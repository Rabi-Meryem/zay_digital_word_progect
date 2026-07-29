from django.shortcuts import render

from django.db.models.deletion import ProtectedError
from rest_framework import viewsets, status
from rest_framework.permissions import SAFE_METHODS
from rest_framework.response import Response

from users.permissions import IsAdminOrSupervisor, IsAdminRole
from .models.sla_rule import SLARule
from .serializers import SLARuleSerializer


class SLARuleViewSet(viewsets.ModelViewSet):
    """
    GET    /api/sla-rules/        -> les règles SLA (lecture: admin + superviseur)
    PATCH  /api/sla-rules/{id}/   -> modifier délai / seuil d'alerte / actif (admin uniquement)
    """
    queryset = SLARule.objects.all().order_by('plan', 'resolution_hours')
    serializer_class = SLARuleSerializer
    pagination_class = None  # liste fixe (12 lignes : 3 plans x 4 priorités)

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAdminOrSupervisor()]  # lecture autorisée au superviseur
        return [IsAdminRole()]  # écriture réservée à l'admin

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Impossible de supprimer : des tickets utilisent encore "
                            "cette règle. Désactive-la plutôt (active=False)."},
                status=status.HTTP_400_BAD_REQUEST,
            )