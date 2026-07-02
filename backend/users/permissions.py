from rest_framework.permissions import BasePermission
 
 
class IsClient(BasePermission):
    """Autorise uniquement les utilisateurs avec le rôle CLIENT."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role.name == 'CLIENT'
        )
 
 
class IsAgent(BasePermission):
    """Autorise uniquement les utilisateurs avec le rôle AGENT."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role.name == 'AGENT'
        )
 
 
class IsSupervisor(BasePermission):
    """Autorise uniquement les utilisateurs avec le rôle SUPERVISOR."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role.name == 'SUPERVISOR'
        )
 
 
class IsAdminRole(BasePermission):
    """Autorise uniquement les utilisateurs avec le rôle ADMIN."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role.name == 'ADMIN'
        )
 
 
class IsAdminOrSupervisor(BasePermission):
    """Autorise ADMIN et SUPERVISOR (ex : voir tous les tickets, gérer les users)."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role.name in ('ADMIN', 'SUPERVISOR')
        )
 
 
class IsAgentOrSupervisor(BasePermission):
    """Autorise AGENT et SUPERVISOR (ex : modifier le statut d'un ticket)."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role.name in ('AGENT', 'SUPERVISOR')
        )
 