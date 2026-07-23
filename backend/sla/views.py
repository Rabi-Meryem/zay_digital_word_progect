from django.shortcuts import render

from django.db.models.deletion import ProtectedError
from rest_framework import viewsets, status
from rest_framework.response import Response

from users.permissions import IsAdminOrSupervisor
from .models.sla_rule import SLARule
from .serializers import SLARuleSerializer


class SLARuleViewSet(viewsets.ModelViewSet):
    """
    GET    /api/sla-rules/        -> les 4 règles (Critique/Haute/Moyenne/Basse)
    PATCH  /api/sla-rules/{id}/   -> modifier délai / seuil d'alerte / actif
    """
    queryset = SLARule.objects.all().order_by('plan', 'resolution_hours')
    serializer_class = SLARuleSerializer
    permission_classes = [IsAdminOrSupervisor]
    pagination_class = None  # liste fixe (4 lignes), pas besoin de StandardPagination ici

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            # Ticket.sla_rule est en on_delete=PROTECT
            return Response(
                {"detail": "Impossible de supprimer : des tickets utilisent encore "
                            "cette règle. Désactive-la plutôt (active=False)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
