import django_filters
from users.models import User
 
 
class UserFilter(django_filters.FilterSet):
 
    # Filtre par rôle : ?role=AGENT
    role = django_filters.CharFilter(
        field_name="role__name",
        lookup_expr="iexact",
        help_text="Filtrer par rôle : CLIENT, AGENT, SUPERVISOR, ADMIN"
    )
 
    # Filtre par statut actif/inactif : ?is_active=true
    is_active = django_filters.BooleanFilter(
        field_name="is_active",
        help_text="Filtrer par statut : true = actif, false = désactivé"
    )
 
    # Recherche par nom ou email : ?search=ahmed
    search = django_filters.CharFilter(
        method="filter_search",
        help_text="Recherche dans prénom, nom et email"
    )
 
    def filter_search(self, queryset, name, value):
        """Recherche insensible à la casse dans prénom, nom et email."""
        from django.db.models import Q
        return queryset.filter(
            Q(first_name__icontains=value) |
            Q(last_name__icontains=value)  |
            Q(email__icontains=value)
        )
 
    class Meta:
        model  = User
        fields = ["role", "is_active", "search"]