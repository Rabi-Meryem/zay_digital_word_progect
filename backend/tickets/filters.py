import django_filters
from tickets.models import Ticket
 
 
class TicketFilter(django_filters.FilterSet):
 
    # Filtrer par statut : ?status=OPEN
    status = django_filters.CharFilter(
        field_name="current_status",
        lookup_expr="iexact"
    )
 
    # Filtrer par priorité : ?priority=CRITICAL
    priority = django_filters.CharFilter(
        field_name="priority",
        lookup_expr="iexact"
    )
 
    # Filtrer par agent assigné : ?agent_id=3
    agent_id = django_filters.NumberFilter(
        field_name="assigned_agent__id"
    )
 
    # Filtrer les tickets hors SLA : ?sla_exceeded=true
    sla_exceeded = django_filters.BooleanFilter(
        field_name="is_sla_respected",
        # is_sla_respected=False signifie SLA dépassé
        method="filter_sla_exceeded"
    )
 
    def filter_sla_exceeded(self, queryset, name, value):
        if value:
            return queryset.filter(is_sla_respected=False)
        return queryset.filter(is_sla_respected=True)
 
    # Filtrer par source : ?source=EMAIL
    source = django_filters.CharFilter(
        field_name="source",
        lookup_expr="iexact"
    )
 
    # Filtrer par date de création (depuis) : ?date_from=2026-01-01
    date_from = django_filters.DateFilter(
        field_name="created_at",
        lookup_expr="date__gte"
    )
 
    # Filtrer par date de création (jusqu'à) : ?date_to=2026-12-31
    date_to = django_filters.DateFilter(
        field_name="created_at",
        lookup_expr="date__lte"
    )
 
    # Recherche par titre ou description : ?search=facture
    search = django_filters.CharFilter(method="filter_search")
 
    def filter_search(self, queryset, name, value):
        from django.db.models import Q
        return queryset.filter(
            Q(title__icontains=value)       |
            Q(description__icontains=value) |
            Q(ticket_number__icontains=value)
        )
 
    class Meta:
        model  = Ticket
        fields = [
            'status', 'priority', 'agent_id',
            'sla_exceeded', 'source',
            'date_from', 'date_to', 'search'
        ]