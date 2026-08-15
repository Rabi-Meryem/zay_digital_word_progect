from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from tickets.views_attachments import save_ticket_attachment
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
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser


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
# POST /api/tickets/  → créer un ticket (client, ou superviseur pour un client)
# ─────────────────────────────────────────────────────────────────────────────
class TicketListCreateView(APIView):
    """
    GET  : Chaque rôle voit une liste différente :
           - CLIENT     → uniquement ses propres tickets
           - AGENT      → uniquement les tickets qui lui sont assignés
           - SUPERVISOR → tous les tickets
           - ADMIN      → tous les tickets
    POST : Le client crée son propre ticket.
           Le superviseur peut créer un ticket POUR UN CLIENT (client_id requis) —
           le ticket n'est jamais créé au nom du superviseur.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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
        # Seuls un client ou un superviseur peuvent créer un ticket
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

        role = request.user.role.name

        # ── Déterminer le VRAI client du ticket ──
        # Un ticket appartient toujours à un CLIENT, jamais à un superviseur,
        # même si c'est le superviseur qui remplit le formulaire.
        if role == 'CLIENT':
            client = request.user
        else:  # SUPERVISOR
            client_id = serializer.validated_data.get('client_id')
            if not client_id:
                return Response(
                    {'detail': "Veuillez préciser le client (client_id) pour lequel vous créez ce ticket."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                client = User.objects.get(pk=client_id, role__name='CLIENT')
            except User.DoesNotExist:
                return Response(
                    {'detail': "Client introuvable."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Déléguer la création au service
        try:
            ticket = ticket_service.create_ticket(
                client      = client,
                title       = serializer.validated_data['title'],
                description = serializer.validated_data['description'],
                module      = serializer.validated_data.get('module'),
                source      = 'WEB' if role == 'CLIENT' else 'SUPERVISOR',
            )
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ── Pièces jointes envoyées avec la création (champ "attachments") ──
        files = request.FILES.getlist('attachments')
        rejected = []
        for f in files:
            try:
                save_ticket_attachment(ticket, request.user, f)
            except ValueError as e:
                rejected.append({'file': f.name, 'reason': str(e)})

        response_data = TicketDetailSerializer(ticket).data
        if rejected:
            response_data['attachments_rejected'] = rejected

        return Response(response_data, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────────────────────
# GET   /api/tickets/<id>/  → détail du ticket
# PATCH /api/tickets/<id>/  → changer le statut
# ─────────────────────────────────────────────────────────────────────────────
class TicketDetailView(APIView):
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
            note        = serializer.validated_data.get('note', ''),
        )

        return Response(TicketDetailSerializer(ticket).data)
# ─────────────────────────────────────────────────────────────────────────────
# POST /api/tickets/<id>/take/
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

        if ticket.assigned_agent != request.user:
            return Response(
                {'detail': "Ce ticket ne vous est pas assigné."},
                status=status.HTTP_403_FORBIDDEN
            )

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
# ─────────────────────────────────────────────────────────────────────────────
class TicketCloseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        ticket = get_ticket_or_404(pk)
        if not ticket:
            return Response(
                {'detail': 'Ticket introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        role = request.user.role.name

        if role == 'CLIENT':
            if ticket.client != request.user:
                return Response(
                    {'detail': "Ce ticket ne vous appartient pas."},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif role not in ('ADMIN', 'SUPERVISOR'):
            return Response(
                {'detail': "Vous n'êtes pas autorisé à clôturer ce ticket."},
                status=status.HTTP_403_FORBIDDEN
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
            reason     = "Ticket clôturé par le client" if role == 'CLIENT' else "Ticket clôturé par le superviseur",
        )

        return Response(TicketDetailSerializer(ticket).data)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/tickets/<id>/reopen/
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

        allowed = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
        if not priority or priority not in allowed:
            return Response(
                {'detail': f"Priorité invalide. Valeurs acceptées : {allowed}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # L'agent est optionnel : on ne tente de le résoudre que s'il est fourni.
        agent = None
        if agent_id:
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
# ─────────────────────────────────────────────────────────────────────────────
class TicketAIAutoAssignView(APIView):
    permission_classes = []  # Sécurisé par le header secret

    def post(self, request):
        # from django.conf import settings
        # secret = request.headers.get('X-Cron-Secret', '')
        # if secret != settings.INTERNAL_WEBHOOK_SECRET:
        #     return Response(
        #         {'detail': 'Non autorisé.'},
        #         status=status.HTTP_403_FORBIDDEN
        #     )

        from django.conf import settings
        delai = getattr(settings, 'AI_CLASSIFICATION_DELAY_MINUTES', 45)
        deadline = timezone.now() - timezone.timedelta(minutes=delai)
        
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