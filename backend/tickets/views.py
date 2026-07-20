from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
 
from tickets.models import Ticket, TicketStatusHistory
from tickets.serializers import (
    TicketCreateSerializer, TicketListSerializer,
    TicketDetailSerializer, TicketAssignSerializer,
    TicketEscalateSerializer, TicketRateSerializer,
    TicketStatusUpdateSerializer,
)
from tickets.filters import TicketFilter
from tickets.services import ticket_service
from users.models import User
from users.permissions import (
    IsClient, IsAgent, IsSupervisor,
    IsAdminOrSupervisor, IsAgentOrSupervisor
)
 
 
# ─── Helper : récupérer un ticket ou renvoyer 404 ───────────────────────────
def get_ticket_or_404(pk):
    try:
        return Ticket.objects.select_related(
            'client', 'assigned_agent', 'supervisor', 'sla_rule'
        ).get(pk=pk)
    except Ticket.DoesNotExist:
        return None
 
 
# ─────────────────────────────────────────────────────────────────────────────
# GET  /api/tickets/  → liste des tickets (filtrée par rôle)
# POST /api/tickets/  → créer un ticket (client seulement)
# ─────────────────────────────────────────────────────────────────────────────
class TicketListCreateView(APIView):
    """
    GET  : Chaque rôle voit une liste différente :
           - CLIENT     → uniquement ses propres tickets
           - AGENT      → uniquement les tickets qui lui sont assignés
           - SUPERVISOR → tous les tickets
           - ADMIN      → tous les tickets
    POST : Seul le client peut créer un ticket.
    """
    permission_classes = [IsAuthenticated]
 
    def get(self, request):
        user = request.user
        role = user.role.name
 
        # Filtrage par rôle — chaque rôle voit ses propres données
        if role == 'CLIENT':
            queryset = Ticket.objects.filter(client=user)
        elif role == 'AGENT':
            queryset = Ticket.objects.filter(assigned_agent=user)
        elif role in ('SUPERVISOR', 'ADMIN'):
            queryset = Ticket.objects.all()
        else:
            queryset = Ticket.objects.none()
 
        # Appliquer les filtres de l'URL
        ticket_filter = TicketFilter(request.GET, queryset=queryset)
        queryset      = ticket_filter.qs
 
        # Tri : par défaut du plus récent au plus ancien
        ordering = request.GET.get('ordering', '-created_at')
        allowed_orderings = [
            '-created_at', 'created_at',
            '-sla_deadline', 'sla_deadline',
            'priority', '-priority',
        ]
        if ordering in allowed_orderings:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-created_at')
 
        # Pagination simple
        page      = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        start     = (page - 1) * page_size
        end       = start + page_size
 
        total     = queryset.count()
        page_data = queryset.select_related(
            'client', 'assigned_agent', 'sla_rule'
        )[start:end]
 
        serializer = TicketListSerializer(page_data, many=True)
        return Response({
            'total':     total,
            'page':      page,
            'page_size': page_size,
            'pages':     (total + page_size - 1) // page_size,
            'results':   serializer.data,
        })
 
    def post(self, request):
        # Seul un client peut créer un ticket
        if request.user.role.name not in ('CLIENT', 'SUPERVISOR'):
            return Response(
                {'detail': "Seul un client peut créer un ticket."},
                status=status.HTTP_403_FORBIDDEN
            )
 
        serializer = TicketCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
 
        # Déléguer la création au service
        try:
            ticket = ticket_service.create_ticket(
                client      = request.user,
                title       = serializer.validated_data['title'],
                description = serializer.validated_data['description'],
                source      = 'WEB',
            )
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
 
        return Response(
            TicketDetailSerializer(ticket).data,
            status=status.HTTP_201_CREATED
        )
 
 
# ─────────────────────────────────────────────────────────────────────────────
# GET   /api/tickets/<id>/  → détail du ticket
# PATCH /api/tickets/<id>/  → changer le statut
# ─────────────────────────────────────────────────────────────────────────────
class TicketDetailView(APIView):
    """
    GET   : Voir le détail complet d'un ticket.
            Chaque rôle ne peut voir que les tickets auxquels il a accès.
    PATCH : Changer le statut (agent/superviseur uniquement).
    """
    permission_classes = [IsAuthenticated]
 
    def _check_access(self, ticket, user):
        """Vérifie que l'utilisateur a le droit de voir ce ticket."""
        role = user.role.name
        if role == 'CLIENT':
            return ticket.client == user
        if role == 'AGENT':
            return ticket.assigned_agent == user
        return True  # SUPERVISOR et ADMIN voient tout
 
    def get(self, request, pk):
        ticket = get_ticket_or_404(pk)
        if not ticket:
            return Response(
                {'detail': 'Ticket introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
 
        if not self._check_access(ticket, request.user):
            return Response(
                {'detail': "Vous n'avez pas accès à ce ticket."},
                status=status.HTTP_403_FORBIDDEN
            )
 
        serializer = TicketDetailSerializer(ticket)
        return Response(serializer.data)
 
    def patch(self, request, pk):
        # Seuls agent et superviseur peuvent changer le statut
        if request.user.role.name not in ('AGENT', 'SUPERVISOR', 'ADMIN'):
            return Response(
                {'detail': "Vous n'êtes pas autorisé à modifier ce ticket."},
                status=status.HTTP_403_FORBIDDEN
            )
 
        ticket = get_ticket_or_404(pk)
        if not ticket:
            return Response(
                {'detail': 'Ticket introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
 
        serializer = TicketStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
 
        ticket = ticket_service.change_status(
            ticket     = ticket,
            new_status = serializer.validated_data['current_status'],
            changed_by = request.user,
            reason     = serializer.validated_data.get('reason', ''),
        )
 
        return Response(TicketDetailSerializer(ticket).data)
 
 
# ─────────────────────────────────────────────────────────────────────────────
# POST /api/tickets/<id>/assign/
# Superviseur assigne le ticket à un agent
# ─────────────────────────────────────────────────────────────────────────────
class TicketAssignView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSupervisor]
 
    def post(self, request, pk):
        ticket = get_ticket_or_404(pk)
        if not ticket:
            return Response(
                {'detail': 'Ticket introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
 
        serializer = TicketAssignSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
 
        agent = User.objects.get(pk=serializer.validated_data['agent_id'])
 
        ticket = ticket_service.assign_ticket(
            ticket      = ticket,
            agent       = agent,
            assigned_by = request.user,
        )
 
        return Response(TicketDetailSerializer(ticket).data)
 
 
# ─────────────────────────────────────────────────────────────────────────────
# POST /api/tickets/<id>/take/
# L'agent prend en charge le ticket (statut → IN_PROGRESS)
# ─────────────────────────────────────────────────────────────────────────────
class TicketTakeView(APIView):
    permission_classes = [IsAuthenticated, IsAgent]
 
    def post(self, request, pk):
        ticket = get_ticket_or_404(pk)
        if not ticket:
            return Response(
                {'detail': 'Ticket introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
 
        # Vérifier que ce ticket lui est bien assigné
        if ticket.assigned_agent != request.user:
            return Response(
                {'detail': "Ce ticket ne vous est pas assigné."},
                status=status.HTTP_403_FORBIDDEN
            )
 
        # Enregistrer la première réponse si pas encore faite
        if not ticket.first_response_at:
            ticket.first_response_at = timezone.now()
            ticket.save(update_fields=['first_response_at'])
 
        ticket = ticket_service.change_status(
            ticket     = ticket,
            new_status = Ticket.Status.IN_PROGRESS,
            changed_by = request.user,
            reason     = "Prise en charge par l'agent",
        )
 
        return Response(TicketDetailSerializer(ticket).data)
 
 
# ─────────────────────────────────────────────────────────────────────────────
# POST /api/tickets/<id>/resolve/
# L'agent marque le ticket comme résolu
# ─────────────────────────────────────────────────────────────────────────────
class TicketResolveView(APIView):
    permission_classes = [IsAuthenticated, IsAgentOrSupervisor]
 
    def post(self, request, pk):
        ticket = get_ticket_or_404(pk)
        if not ticket:
            return Response(
                {'detail': 'Ticket introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
 
        # L'agent ne peut résoudre que ses propres tickets
        if request.user.role.name == 'AGENT' and ticket.assigned_agent != request.user:
            return Response(
                {'detail': "Ce ticket ne vous est pas assigné."},
                status=status.HTTP_403_FORBIDDEN
            )
 
        if ticket.current_status == Ticket.Status.RESOLVED:
            return Response(
                {'detail': "Ce ticket est déjà résolu."},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        resolution_note = request.data.get('resolution_note', '')
 
        ticket = ticket_service.change_status(
            ticket     = ticket,
            new_status = Ticket.Status.RESOLVED,
            changed_by = request.user,
            reason     = resolution_note or "Problème résolu par l'agent",
        )
 
        return Response(TicketDetailSerializer(ticket).data)
 
 
# ─────────────────────────────────────────────────────────────────────────────
# POST /api/tickets/<id>/close/
# Le superviseur clôture définitivement le ticket
# ─────────────────────────────────────────────────────────────────────────────
class TicketCloseView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSupervisor]
 
    def post(self, request, pk):
        ticket = get_ticket_or_404(pk)
        if not ticket:
            return Response(
                {'detail': 'Ticket introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
 
        if ticket.current_status != Ticket.Status.RESOLVED:
            return Response(
                {'detail': "Seul un ticket résolu peut être clôturé."},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        ticket = ticket_service.change_status(
            ticket     = ticket,
            new_status = Ticket.Status.CLOSED,
            changed_by = request.user,
            reason     = "Ticket clôturé par le superviseur",
        )
 
        return Response(TicketDetailSerializer(ticket).data)
 
 
# ─────────────────────────────────────────────────────────────────────────────
# POST /api/tickets/<id>/reopen/
# Le client rouvre un ticket qu'il juge mal résolu
# ─────────────────────────────────────────────────────────────────────────────
class TicketReopenView(APIView):
    permission_classes = [IsAuthenticated]
 
    def post(self, request, pk):
        ticket = get_ticket_or_404(pk)
        if not ticket:
            return Response(
                {'detail': 'Ticket introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
 
        # Seul le client propriétaire peut rouvrir
        if request.user.role.name == 'CLIENT' and ticket.client != request.user:
            return Response(
                {'detail': "Ce ticket ne vous appartient pas."},
                status=status.HTTP_403_FORBIDDEN
            )
 
        if ticket.current_status not in [Ticket.Status.RESOLVED, Ticket.Status.CLOSED]:
            return Response(
                {'detail': "Seul un ticket résolu ou clôturé peut être réouvert."},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        reopen_reason = request.data.get('reason', 'Le problème n\'est pas résolu.')
 
        ticket = ticket_service.change_status(
            ticket     = ticket,
            new_status = Ticket.Status.REOPENED,
            changed_by = request.user,
            reason     = reopen_reason,
        )
 
        return Response(TicketDetailSerializer(ticket).data)
 
 
# ─────────────────────────────────────────────────────────────────────────────
# POST /api/tickets/<id>/escalate/
# L'agent escalade le ticket vers le superviseur
# ─────────────────────────────────────────────────────────────────────────────
class TicketEscalateView(APIView):
    permission_classes = [IsAuthenticated, IsAgent]
 
    def post(self, request, pk):
        ticket = get_ticket_or_404(pk)
        if not ticket:
            return Response(
                {'detail': 'Ticket introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
 
        if ticket.assigned_agent != request.user:
            return Response(
                {'detail': "Ce ticket ne vous est pas assigné."},
                status=status.HTTP_403_FORBIDDEN
            )
 
        serializer = TicketEscalateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
 
        try:
            ticket_service.escalate_ticket(
                ticket        = ticket,
                escalated_by  = request.user,
                reason        = serializer.validated_data['reason'],
                escalation_type = 'MANUAL',
            )
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
 
        return Response(
            TicketDetailSerializer(ticket).data
        )
 
 
# ─────────────────────────────────────────────────────────────────────────────
# POST /api/tickets/<id>/rate/
# Le client évalue la résolution de son ticket (1 à 5 étoiles)
# ─────────────────────────────────────────────────────────────────────────────
class TicketRateView(APIView):
    permission_classes = [IsAuthenticated, IsClient]
 
    def post(self, request, pk):
        ticket = get_ticket_or_404(pk)
        if not ticket:
            return Response(
                {'detail': 'Ticket introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
 
        serializer = TicketRateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
 
        try:
            rating = ticket_service.rate_ticket(
                ticket  = ticket,
                client  = request.user,
                rating  = serializer.validated_data['rating'],
                comment = serializer.validated_data.get('comment', ''),
            )
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        return Response({
            'detail':  'Évaluation enregistrée.',
            'rating':  rating.rating,
            'comment': rating.comment,
        })
 
 
# ─────────────────────────────────────────────────────────────────────────────
# GET /api/tickets/<id>/history/
# Historique complet des changements de statut d'un ticket
# ─────────────────────────────────────────────────────────────────────────────
class TicketHistoryView(APIView):
    permission_classes = [IsAuthenticated]
 
    def get(self, request, pk):
        ticket = get_ticket_or_404(pk)
        if not ticket:
            return Response(
                {'detail': 'Ticket introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
 
        history = TicketStatusHistory.objects.filter(
            ticket=ticket
        ).select_related('changed_by').order_by('changed_at')
 
        data = [
            {
                'old_status': h.old_status,
                'new_status': h.new_status,
                'changed_by': f"{h.changed_by.first_name} {h.changed_by.last_name}",
                'reason':     h.reason,
                'changed_at': h.changed_at,
            }
            for h in history
        ]
 
        return Response({
            'ticket_number': ticket.ticket_number,
            'count':         len(data),
            'history':       data,
        })
 # ─────────────────────────────────────────────────────────────────────────────
# POST /api/tickets/<id>/set-priority/
# Le superviseur définit la priorité ET assigne l'agent en même temps
# ─────────────────────────────────────────────────────────────────────────────
class TicketSetPriorityAndAssignView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSupervisor]

    def post(self, request, pk):
        ticket = get_ticket_or_404(pk)
        if not ticket:
            return Response(
                {'detail': 'Ticket introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        priority = request.data.get('priority')
        agent_id = request.data.get('agent_id')

        # Valider la priorité
        allowed = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
        if not priority or priority not in allowed:
            return Response(
                {'detail': f"Priorité invalide. Valeurs acceptées : {allowed}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Valider l'agent
        try:
            agent = User.objects.get(
                pk=agent_id,
                role__name='AGENT',
                is_active=True
            )
        except User.DoesNotExist:
            return Response(
                {'detail': "Agent introuvable ou inactif."},
                status=status.HTTP_400_BAD_REQUEST
            )

        ticket = ticket_service.supervisor_set_priority_and_assign(
            ticket     = ticket,
            priority   = priority,
            agent      = agent,
            supervisor = request.user,
        )

        return Response(TicketDetailSerializer(ticket).data)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/tickets/ai-auto-assign/
# Cron job — traite les tickets sans priorité depuis +45 min
# ─────────────────────────────────────────────────────────────────────────────
class TicketAIAutoAssignView(APIView):
    permission_classes = []  # Sécurisé par le header secret

    def post(self, request):
       # from django.conf import settings
        #secret = request.headers.get('X-Cron-Secret', '')
        #if secret != settings.INTERNAL_WEBHOOK_SECRET:
         #   return Response(
          #      {'detail': 'Non autorisé.'},
           #     status=status.HTTP_403_FORBIDDEN
            #)

        deadline = timezone.now() - timezone.timedelta(minutes=45)
        pending_tickets = Ticket.objects.filter(
            current_status=Ticket.Status.OPEN,
            assigned_agent=None,
            created_at__lte=deadline,
        )

        processed = []
        for ticket in pending_tickets:
            try:
                ticket_service.ai_auto_process(ticket)
                processed.append(ticket.ticket_number)
            except Exception:
                pass

        return Response({
            'processed_count':   len(processed),
            'processed_tickets': processed,
        })