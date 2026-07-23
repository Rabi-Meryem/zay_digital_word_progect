from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from datetime import timedelta
from notifications.services import notification_service


from users.models import User, LoginHistory ,Role
from users.serializers import (
    UserSerializer, UserListSerializer, UserCreateSerializer,
    UserUpdateSerializer, PasswordResetSerializer, ProfileUpdateSerializer,RoleSerializer
)
from users.permissions import IsAdminRole, IsAdminOrSupervisor
from users.filters import UserFilter
from logs_app.models import AuditLog


# ─── Helper log ─────────────────────────────────────────────────────────────
def log_action(user, action_type, description,
               request=None, target_model=None, target_id=None):
    AuditLog.objects.create(
        user=user,
        action_type=action_type,
        description=description,
        target_model=target_model,
        target_id=str(target_id) if target_id else None,
        ip_address=request.META.get('REMOTE_ADDR') if request else None,
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:255] if request else None,
    )


# ─── Helper alerte sécurité — appelé UNIQUEMENT quand un AuditLog de type ───
# ─── SECURITY_ALERT est créé (pas sur chaque action comme login/update)   ───
def _alert_admins_security(description):
    admins = User.objects.filter(role__name='ADMIN', is_active=True)
    if admins:
        notification_service.notify(
            'SECURITY_ALERT', None, recipients=list(admins),
            override_content=description,
        )


# ─────────────────────────────────────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────────────────────────────────────

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email    = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'detail': 'Email et mot de passe requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.select_related('role').get(email=email)
        except User.DoesNotExist:
            self._record_failure(None, email, request, 'Compte inexistant')
            return Response(
                {'detail': 'Identifiants incorrects.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.check_password(password):
            self._record_failure(user, email, request, 'Mot de passe incorrect')
            return Response(
                {'detail': 'Identifiants incorrects.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'detail': 'Ce compte est désactivé.'},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)

        LoginHistory.objects.create(
            user=user,
            login_date=timezone.now(),
            ip_address=request.META.get('REMOTE_ADDR'),
            browser=request.META.get('HTTP_USER_AGENT', '')[:255],
            success=True,
        )
        log_action(
            user, AuditLog.ActionType.LOGIN,
            f'Connexion réussie ({user.email})', request
        )

        # Règle 3 — Connexion à une heure inhabituelle (00h-05h)
        current_hour = timezone.now().hour
        if current_hour < 5:
            desc = (
                f"⚠️ Connexion inhabituelle à {current_hour}h du matin "
                f"pour le compte {user.email} depuis {request.META.get('REMOTE_ADDR', '')}"
            )
            AuditLog.objects.create(
                user=user,
                action_type=AuditLog.ActionType.SECURITY_ALERT,
                description=desc,
                ip_address=request.META.get('REMOTE_ADDR', ''),
                is_suspicious=True,
            )
            _alert_admins_security(desc)

        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        }, status=status.HTTP_200_OK)

    def _record_failure(self, user, email, request, reason):
        """
        Enregistre un échec de connexion.
        Détecte automatiquement les anomalies (brute force)
        et crée une alerte sécurité si nécessaire.
        """
        ip = request.META.get('REMOTE_ADDR', '')

        # 1. Enregistrer l'échec dans login_history
        if user:
            LoginHistory.objects.create(
                user=user,
                login_date=timezone.now(),
                ip_address=ip,
                browser=request.META.get('HTTP_USER_AGENT', '')[:255],
                success=False,
                failure_reason=reason,
            )

        # 2. Enregistrer dans audit_logs (action normale, pas une alerte sécurité)
        log_action(
            user,
            AuditLog.ActionType.LOGIN_FAILED,
            f'Échec connexion pour {email} : {reason}',
            request
        )

        # ── DÉTECTION D'ANOMALIES ────────────────────────────────────────────

        # Règle 1 — Brute force par IP :
        # Si la même IP échoue 5 fois en 15 minutes → alerte
        since_15min = timezone.now() - timedelta(minutes=15)
        failures_by_ip = LoginHistory.objects.filter(
            ip_address=ip,
            success=False,
            login_date__gte=since_15min
        ).count()

        if failures_by_ip >= 5:
            desc = (
                f"🚨 Brute force détecté : {failures_by_ip} échecs "
                f"en 15 min depuis l'IP {ip} (email ciblé : {email})"
            )
            AuditLog.objects.create(
                user=user,
                action_type=AuditLog.ActionType.SECURITY_ALERT,
                description=desc,
                ip_address=ip,
                is_suspicious=True,
            )
            _alert_admins_security(desc)

        # Règle 2 — Attaque sur un compte précis :
        # Si le même compte échoue 3 fois en 10 minutes → alerte
        if user:
            since_10min = timezone.now() - timedelta(minutes=10)
            failures_by_user = LoginHistory.objects.filter(
                user=user,
                success=False,
                login_date__gte=since_10min
            ).count()

            if failures_by_user >= 3:
                desc = (
                    f"🚨 Tentatives répétées sur le compte {email} : "
                    f"{failures_by_user} échecs en 10 min depuis {ip}"
                )
                AuditLog.objects.create(
                    user=user,
                    action_type=AuditLog.ActionType.SECURITY_ALERT,
                    description=desc,
                    ip_address=ip,
                    is_suspicious=True,
                )
                _alert_admins_security(desc)


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
            token.blacklist()
        except TokenError:
            return Response(
                {'detail': 'Token invalide ou déjà expiré.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        log_action(
            request.user, AuditLog.ActionType.LOGOUT,
            'Déconnexion', request
        )
        return Response(
            {'detail': 'Déconnexion réussie.'},
            status=status.HTTP_200_OK
        )


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
                'User', request.user.id
            )
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
# GESTION DES UTILISATEURS PAR L'ADMIN
# ─────────────────────────────────────────────────────────────────────────────

class UserListCreateView(APIView):
    """
    GET  /api/users/  → liste tous les utilisateurs avec filtres
    POST /api/users/  → créer un utilisateur (admin seulement)

    Paramètres GET disponibles :
      ?role=AGENT           → filtrer par rôle
      ?is_active=true       → filtrer par statut
      ?search=ahmed         → recherche par prénom, nom ou email
      ?ordering=created_at  → trier par date de création
    """
    permission_classes = [IsAuthenticated, IsAdminOrSupervisor]

    def get(self, request):
        queryset = User.objects.select_related('role').all()

        user_filter = UserFilter(request.GET, queryset=queryset)
        queryset    = user_filter.qs

        ordering = request.GET.get('ordering', '-created_at')
        allowed_orderings = [
            'created_at', '-created_at',
            'first_name', '-first_name',
            'email', '-email',
            'role__name', '-role__name',
        ]
        if ordering in allowed_orderings:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-created_at')

        serializer = UserListSerializer(queryset, many=True)
        return Response({
            'count':   queryset.count(),
            'results': serializer.data,
        })

    def post(self, request):
        if request.user.role.name != 'ADMIN':
            return Response(
                {'detail': "Seul l'administrateur peut créer des comptes."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            log_action(
                request.user, AuditLog.ActionType.CREATE,
                f'Création du compte {user.email} (rôle : {user.role.name})',
                request, 'User', user.id
            )
            return Response(
                UserListSerializer(user).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDetailView(APIView):
    """
    GET    /api/users/<id>/  → détail d'un utilisateur
    PATCH  /api/users/<id>/  → modifier nom, email, téléphone, rôle
    DELETE /api/users/<id>/  → désactiver le compte (soft delete)
    """
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get_object(self, pk):
        try:
            return User.objects.select_related('role').get(pk=pk)
        except User.DoesNotExist:
            return None

    def get(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response(
                {'detail': 'Utilisateur introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(UserListSerializer(user).data)

    def patch(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response(
                {'detail': 'Utilisateur introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if user.id == request.user.id and 'role_id' in request.data:
            return Response(
                {'detail': "Vous ne pouvez pas modifier votre propre rôle."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            log_action(
                request.user, AuditLog.ActionType.UPDATE,
                f'Modification du compte {user.email}',
                request, 'User', user.id
            )
            return Response(UserListSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response(
                {'detail': 'Utilisateur introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if user.id == request.user.id:
            return Response(
                {'detail': "Vous ne pouvez pas désactiver votre propre compte."},
                status=status.HTTP_403_FORBIDDEN
            )

        user.is_active = False
        user.save(update_fields=['is_active'])
        log_action(
            request.user, AuditLog.ActionType.UPDATE,
            f'Désactivation du compte {user.email}',
            request, 'User', user.id
        )
        return Response(
            {'detail': f'Compte de {user.first_name} {user.last_name} désactivé.'},
            status=status.HTTP_200_OK
        )


class UserActivateView(APIView):
    """
    POST /api/users/<id>/activate/
    Réactiver un compte désactivé (admin seulement).
    """
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request, pk):
        try:
            user = User.objects.select_related('role').get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Utilisateur introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if user.is_active:
            return Response(
                {'detail': 'Ce compte est déjà actif.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.is_active = True
        user.save(update_fields=['is_active'])
        log_action(
            request.user, AuditLog.ActionType.UPDATE,
            f'Réactivation du compte {user.email}',
            request, 'User', user.id
        )
        return Response(
            {'detail': f'Compte de {user.first_name} {user.last_name} réactivé.'},
            status=status.HTTP_200_OK
        )


class PasswordResetView(APIView):
    """
    POST /api/users/<id>/reset-password/
    Réinitialiser le mot de passe d'un utilisateur (admin seulement).
    """
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Utilisateur introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            user.set_password(serializer.validated_data['new_password'])
            user.save(update_fields=['password'])
            log_action(
                request.user, AuditLog.ActionType.UPDATE,
                f'Réinitialisation du mot de passe de {user.email}',
                request, 'User', user.id
            )
            return Response({'detail': 'Mot de passe réinitialisé avec succès.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class RoleListView(APIView):
    """GET /api/roles/ — liste des rôles réels avec leurs vrais IDs."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        roles = Role.objects.all().order_by('id')
        return Response(RoleSerializer(roles, many=True).data)