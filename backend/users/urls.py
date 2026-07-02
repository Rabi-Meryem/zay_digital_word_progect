 
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import (
    LoginView, LogoutView, MeView,
    UserListCreateView, UserDetailView, PasswordResetView
)
 
urlpatterns = [
    # Auth
    path('auth/login/',   LoginView.as_view(),  name='login'),
    path('auth/logout/',  LogoutView.as_view(), name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/me/',      MeView.as_view(),     name='me'),
 
    # Gestion des utilisateurs (admin)
    path('users/',               UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/',      UserDetailView.as_view(),     name='user-detail'),
    path('users/<int:pk>/reset-password/', PasswordResetView.as_view(), name='password-reset'),
]