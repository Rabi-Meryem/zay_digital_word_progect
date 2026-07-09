from django.urls import path
from logs_app.views import (
    AuditLogListView,
    AuditByUserView,
    AuditByTicketView,
    AnomalyListView,
    LogStatsView,
)
 
urlpatterns = [
 
    # 8.3.1 — Consultation des logs (tous les logs avec filtres)
    # GET /api/logs/
    # GET /api/logs/?action_type=LOGIN&date_from=2026-01-01
    # GET /api/logs/?search=ahmed
    path('logs/',
         AuditLogListView.as_view(),
         name='logs-list'),
 
    # 8.3.2 — Audit des actions sur un utilisateur précis
    # GET /api/logs/audit/user/3/
    path('logs/audit/user/<int:user_id>/',
         AuditByUserView.as_view(),
         name='logs-audit-user'),
 
    # 8.3.2 — Audit des actions sur un ticket précis
    # GET /api/logs/audit/ticket/5/
    path('logs/audit/ticket/<int:ticket_id>/',
         AuditByTicketView.as_view(),
         name='logs-audit-ticket'),
 
    # 8.3.3 — Anomalies : uniquement les logs suspects
    # GET /api/logs/anomalies/
    path('logs/anomalies/',
         AnomalyListView.as_view(),
         name='logs-anomalies'),
 
    # Statistiques pour le dashboard admin
    # GET /api/logs/stats/
    path('logs/stats/',
         LogStatsView.as_view(),
         name='logs-stats'),
]