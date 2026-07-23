from django.urls import path
from tickets.views import (
    TicketListCreateView,
    TicketDetailView,
    TicketAssignView,
    TicketSetPriorityAndAssignView,
    TicketTakeView,
    TicketResolveView,
    TicketCloseView,
    TicketReopenView,
    TicketEscalateView,
    TicketRateView,
    TicketHistoryView,
    TicketAIAutoAssignView,
)
from tickets.views_attachments import (
    TicketAttachmentUploadView,
    TicketAttachmentListView,
    TicketAttachmentDeleteView,
)
from tickets.views_history import (
    TicketHistoryListView,
    TicketFullHistoryView,
)
from tickets.views_dashboard import (
    SupervisorKpisView, SupervisorVolumeView,
    SupervisorStatusDistributionView, SupervisorAiClassificationView,
    SupervisorSlaTicketsView, SupervisorAgentsPerformanceView,
    AgentMyStatsView,
)

 
urlpatterns = [
 
    # ── Création et liste ────────────────────────────────────────────────────
    # GET  /api/tickets/              → liste selon le rôle
    # POST /api/tickets/              → créer un ticket (client)
    path('tickets/',
         TicketListCreateView.as_view(),
         name='ticket-list-create'),
 
    # ── Détail et modification ───────────────────────────────────────────────
    # GET   /api/tickets/1/           → détail selon le rôle
    # PATCH /api/tickets/1/           → changer le statut
    path('tickets/<int:pk>/',
         TicketDetailView.as_view(),
         name='ticket-detail'),
 
    # ── Actions métier ───────────────────────────────────────────────────────
    # POST /api/tickets/1/set-priority/  → superviseur : priorité + assignation
    path('tickets/<int:pk>/set-priority/',
         TicketSetPriorityAndAssignView.as_view(),
         name='ticket-set-priority'),
 
    # POST /api/tickets/1/assign/        → superviseur : assignation seule
    path('tickets/<int:pk>/assign/',
         TicketAssignView.as_view(),
         name='ticket-assign'),
 
    # POST /api/tickets/1/take/          → agent : prendre en charge
    path('tickets/<int:pk>/take/',
         TicketTakeView.as_view(),
         name='ticket-take'),
 
    # POST /api/tickets/1/resolve/       → agent : marquer résolu
    path('tickets/<int:pk>/resolve/',
         TicketResolveView.as_view(),
         name='ticket-resolve'),
 
    # POST /api/tickets/1/close/         → superviseur : clôturer
    path('tickets/<int:pk>/close/',
         TicketCloseView.as_view(),
         name='ticket-close'),
 
    # POST /api/tickets/1/reopen/        → client : rouvrir
    path('tickets/<int:pk>/reopen/',
         TicketReopenView.as_view(),
         name='ticket-reopen'),
 
    # POST /api/tickets/1/escalate/      → agent : escalader
    path('tickets/<int:pk>/escalate/',
         TicketEscalateView.as_view(),
         name='ticket-escalate'),
 
    # POST /api/tickets/1/rate/          → client : évaluer (1-5 étoiles)
    path('tickets/<int:pk>/rate/',
         TicketRateView.as_view(),
         name='ticket-rate'),
 
    # ── Historique ───────────────────────────────────────────────────────────
    # GET /api/tickets/1/history/        → historique des statuts (base)
    path('tickets/<int:pk>/history/',
         TicketHistoryView.as_view(),
         name='ticket-history'),
 
    # GET /api/tickets/1/history/full/   → historique complet (statuts+PJ+escalades)
    path('tickets/<int:pk>/history/full/',
         TicketFullHistoryView.as_view(),
         name='ticket-history-full'),
 
    # GET /api/tickets/history/          → liste historique selon le rôle
    path('tickets/history/',
         TicketHistoryListView.as_view(),
         name='ticket-history-list'),
 
    # ── Pièces jointes ───────────────────────────────────────────────────────
    # GET  /api/tickets/1/attachments/         → lister les PJ
    # POST /api/tickets/1/attachments/         → uploader une PJ
    path('tickets/<int:pk>/attachments/',
         TicketAttachmentListView.as_view(),
         name='ticket-attachment-list'),
 
    path('tickets/<int:pk>/attachments/upload/',
         TicketAttachmentUploadView.as_view(),
         name='ticket-attachment-upload'),
 
    # DELETE /api/tickets/attachments/5/       → supprimer une PJ
    path('tickets/attachments/<int:attachment_id>/',
         TicketAttachmentDeleteView.as_view(),
         name='ticket-attachment-delete'),
 
    # ── IA ───────────────────────────────────────────────────────────────────
    # POST /api/tickets/ai-auto-assign/        → cron : traiter tickets +45 min
    path('tickets/ai-auto-assign/',
         TicketAIAutoAssignView.as_view(),
         name='ticket-ai-auto-assign'),

    path('supervisor/kpis/', SupervisorKpisView.as_view(), name='supervisor-kpis'),
    path('supervisor/volume/', SupervisorVolumeView.as_view(), name='supervisor-volume'),
    path('supervisor/status-distribution/', SupervisorStatusDistributionView.as_view(), name='supervisor-status-distribution'),
    path('supervisor/ai-classification/', SupervisorAiClassificationView.as_view(), name='supervisor-ai-classification'),
    path('supervisor/sla-tickets/', SupervisorSlaTicketsView.as_view(), name='supervisor-sla-tickets'),
    path('agents/me/stats/', AgentMyStatsView.as_view(), name='agent-my-stats'),
    path('supervisor/agents-performance/', SupervisorAgentsPerformanceView.as_view(), name='supervisor-agents-performance'),
]
 