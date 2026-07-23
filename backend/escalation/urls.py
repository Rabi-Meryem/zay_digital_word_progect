from django.urls import path
from .views import (
    EscalationListView, EscalationTakeView,
    EscalationReassignView, EscalationSendBackView,
    EscalationResolveView,
)

urlpatterns = [
    path('escalations/', EscalationListView.as_view(), name='escalation-list'),
    path('escalations/<int:pk>/take/', EscalationTakeView.as_view(), name='escalation-take'),
    path('escalations/<int:pk>/reassign/', EscalationReassignView.as_view(), name='escalation-reassign'),
    path('escalations/<int:pk>/send-back/', EscalationSendBackView.as_view(), name='escalation-send-back'),
    path('escalations/<int:pk>/resolve/', EscalationResolveView.as_view(), name='escalation-resolve'),
]