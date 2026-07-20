import django_filters
from logs_app.models import AuditLog
 
 
class AuditLogFilter(django_filters.FilterSet):
 
    # Filtrer par type d'action : ?action_type=LOGIN
    action_type = django_filters.CharFilter(
        field_name="action_type",
        lookup_expr="iexact"
    )
 
    # Filtrer par utilisateur : ?user_id=3
    user_id = django_filters.NumberFilter(
        field_name="user__id"
    )
 
    # Filtrer par modèle cible : ?target_model=Ticket
    target_model = django_filters.CharFilter(
        field_name="target_model",
        lookup_expr="iexact"
    )
 
    # Filtrer par ID de l'objet cible : ?target_id=5
    target_id = django_filters.CharFilter(
        field_name="target_id",
        lookup_expr="exact"
    )
 
    # Filtrer les logs suspects uniquement : ?is_suspicious=true
    is_suspicious = django_filters.BooleanFilter(
        field_name="is_suspicious"
    )
 
    # Filtrer par adresse IP : ?ip_address=192.168.1.1
    ip_address = django_filters.CharFilter(
        field_name="ip_address",
        lookup_expr="icontains"
    )
 
    # Filtrer par date de début : ?date_from=2026-01-01
    date_from = django_filters.DateFilter(
        field_name="created_at",
        lookup_expr="date__gte"
    )
 
    # Filtrer par date de fin : ?date_to=2026-12-31
    date_to = django_filters.DateFilter(
        field_name="created_at",
        lookup_expr="date__lte"
    )
 
    # Recherche dans la description : ?search=ahmed
    search = django_filters.CharFilter(
        method="filter_search"
    )
 
    def filter_search(self, queryset, name, value):
        from django.db.models import Q
        return queryset.filter(
            Q(description__icontains=value)    |
            Q(user__first_name__icontains=value) |
            Q(user__last_name__icontains=value)  |
            Q(user__email__icontains=value)
        )
 
    class Meta:
        model  = AuditLog
        fields = [
            "action_type", "user_id", "target_model",
            "target_id", "is_suspicious", "ip_address",
            "date_from", "date_to", "search"
        ]