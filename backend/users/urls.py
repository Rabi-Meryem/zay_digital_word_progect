from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import (
    LoginView, LogoutView, MeView,
    UserListCreateView, UserDetailView,
    UserActivateView, PasswordResetView
)
from users.views_agents import AgentListView, AgentAvailabilityUpdateView
urlpatterns = [
 
    # ── Authentification ────────────────────────────────────────────────────
    path('auth/login/',   LoginView.as_view(),         name='login'),
    path('auth/logout/',  LogoutView.as_view(),        name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(),  name='token-refresh'),
    path('auth/me/',      MeView.as_view(),            name='me'),
 
    # ── Gestion des utilisateurs (admin) ───────────────────────────────────
    # GET  /api/users/?role=AGENT&search=ahmed&is_active=true
    # POST /api/users/
    path('users/',
         UserListCreateView.as_view(),
         name='user-list-create'),
 
    # GET   /api/users/1/
    # PATCH /api/users/1/
    # DELETE /api/users/1/   (désactive)
    path('users/<int:pk>/',
         UserDetailView.as_view(),
         name='user-detail'),
 
    # POST /api/users/1/activate/   (réactive)
    path('users/<int:pk>/activate/',
         UserActivateView.as_view(),
         name='user-activate'),
 
    # POST /api/users/1/reset-password/
    path('users/<int:pk>/reset-password/',
         PasswordResetView.as_view(),
         name='password-reset'),
     path('agents/', AgentListView.as_view(), name='agent-list'),
     path('agents/<int:agent_id>/availability/', AgentAvailabilityUpdateView.as_view(), name='agent-availability-update'),
]
 