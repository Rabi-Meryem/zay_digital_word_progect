from django.shortcuts import render

from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
 
from users.models import User, LoginHistory
from users.serializers import (
    UserSerializer, UserCreateSerializer,
    UserUpdateSerializer, PasswordResetSerializer,
    ProfileUpdateSerializer
)
from users.permissions import IsAdminRole, IsAdminOrSupervisor
from logs_app.models import AuditLog
 
 
# -----------------------------------------------------------------------
# Helper : enregistrer un log d'audit sans répéter ce code partout
# -----------------------------------------------------------------------
def log_action(user, action_type, description, request=None, target_model=None, target_id=None):
    AuditLog.objects.create(
        user=user,
        action_type=action_type,
        description=description,
        target_model=target_model,
        target_id=str(target_id) if target_id else None,
        ip_address=request.META.get('REMOTE_ADDR') if request else None,
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:255] if request else None,
    )
 
 
# -----------------------------------------------------------------------
# POST /api/auth/login/
# Ouverte à tous (AllowAny), vérifie email + mot de passe, renvoie JWT
# -----------------------------------------------------------------------
class LoginView(APIView):
    permission_classes = [AllowAny]
 
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')
 
        # Validation minimale
        if not email or not password:
            return Response(
                {'detail': 'Email et mot de passe requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        # Chercher l'utilisateur par email
        try:
            user = User.objects.select_related('role').get(email=email)
        except User.DoesNotExist:
            # On n'indique pas si c'est l'email ou le mot de passe qui est faux
            # (évite l'énumération des comptes — sécurité Phase 7)
            self._record_failure(None, email, request, 'Compte inexistant')
            return Response(
                {'detail': 'Identifiants incorrects.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
 
        # Vérifier le mot de passe
        if not user.check_password(password):
            self._record_failure(user, email, request, 'Mot de passe incorrect')
            return Response(
                {'detail': 'Identifiants incorrects.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
 
        # Vérifier que le compte est actif
        if not user.is_active:
            return Response(
                {'detail': 'Ce compte est désactivé.'},
                status=status.HTTP_403_FORBIDDEN
            )
 
        # Générer les tokens JWT
        refresh = RefreshToken.for_user(user)
 
        # Enregistrer la connexion réussie
        LoginHistory.objects.create(
            user=user,
            login_date=timezone.now(),
            ip_address=request.META.get('REMOTE_ADDR'),
            browser=request.META.get('HTTP_USER_AGENT', '')[:255],
            success=True,
        )
        log_action(user, AuditLog.ActionType.LOGIN, f'Connexion réussie ({user.email})', request)
 
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)
 
    def _record_failure(self, user, email, request, reason):
        """Enregistre un échec de connexion dans login_history et audit_logs."""
        if user:
            LoginHistory.objects.create(
                user=user,
                login_date=timezone.now(),
                ip_address=request.META.get('REMOTE_ADDR'),
                browser=request.META.get('HTTP_USER_AGENT', '')[:255],
                success=False,
                failure_reason=reason,
            )
        log_action(
            user, AuditLog.ActionType.LOGIN_FAILED,
            f'Échec de connexion pour {email} : {reason}', request
        )
 
 
# -----------------------------------------------------------------------
# POST /api/auth/logout/
# Blackliste le refresh token — le token devient immédiatement invalide
# -----------------------------------------------------------------------
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
 
    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()  # inscrit le token dans la table de blacklist
        except TokenError:
            return Response(
                {'detail': 'Token invalide ou déjà expiré.'},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        log_action(request.user, AuditLog.ActionType.LOGOUT, 'Déconnexion', request)
        return Response({'detail': 'Déconnexion réussie.'}, status=status.HTTP_200_OK)
 
 
# -----------------------------------------------------------------------
# GET /api/auth/me/
# Renvoie les infos de l'utilisateur connecté
# -----------------------------------------------------------------------
class MeView(APIView):
    permission_classes = [IsAuthenticated]
 
    def get(self, request):
        return Response(UserSerializer(request.user).data)
 
    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            log_action(
                request.user, AuditLog.ActionType.UPDATE,
                'Mise à jour du profil', request,
                target_model='User', target_id=request.user.id
            )
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
 
# -----------------------------------------------------------------------
# GET  /api/users/          → liste tous les utilisateurs (admin/supervisor)
# POST /api/users/          → créer un utilisateur (admin seulement)
# -----------------------------------------------------------------------
class UserListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSupervisor]
 
    def get(self, request):
        users = User.objects.select_related('role').all().order_by('-created_at')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
 
    def post(self, request):
        # Seul l'admin peut créer des utilisateurs (pas le superviseur)
        if not request.user.role.name == 'ADMIN':
            return Response(
                {'detail': 'Seul l\'administrateur peut créer des comptes.'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            log_action(
                request.user, AuditLog.ActionType.CREATE,
                f'Création du compte {user.email}', request,
                target_model='User', target_id=user.id
            )
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
 
# -----------------------------------------------------------------------
# GET   /api/users/<id>/    → détail d'un utilisateur
# PATCH /api/users/<id>/    → modifier (admin seulement)
# DELETE /api/users/<id>/   → désactiver (admin seulement — soft delete)
# -----------------------------------------------------------------------
class UserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
 
    def get_object(self, pk):
        try:
            return User.objects.select_related('role').get(pk=pk)
        except User.DoesNotExist:
            return None
 
    def get(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({'detail': 'Utilisateur introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserSerializer(user).data)
 
    def patch(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({'detail': 'Utilisateur introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            log_action(
                request.user, AuditLog.ActionType.UPDATE,
                f'Modification du compte {user.email}', request,
                target_model='User', target_id=user.id
            )
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
    def delete(self, request, pk):
        # SOFT DELETE : on désactive le compte, on ne supprime jamais les données
        # (exigence CDC fonctionnel 8.1.3 : données conservées même après désactivation)
        user = self.get_object(pk)
        if not user:
            return Response({'detail': 'Utilisateur introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        user.is_active = False
        user.save(update_fields=['is_active'])
        log_action(
            request.user, AuditLog.ActionType.UPDATE,
            f'Désactivation du compte {user.email}', request,
            target_model='User', target_id=user.id
        )
        return Response({'detail': 'Compte désactivé.'}, status=status.HTTP_200_OK)
 
 
# -----------------------------------------------------------------------
# POST /api/users/<id>/reset-password/
# Réinitialiser le mot de passe d'un utilisateur (admin seulement)
# -----------------------------------------------------------------------
class PasswordResetView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
 
    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Utilisateur introuvable.'}, status=status.HTTP_404_NOT_FOUND)
 
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            user.set_password(serializer.validated_data['new_password'])
            user.save(update_fields=['password'])
            log_action(
                request.user, AuditLog.ActionType.UPDATE,
                f'Réinitialisation du mot de passe de {user.email}', request,
                target_model='User', target_id=user.id
            )
            return Response({'detail': 'Mot de passe réinitialisé.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)