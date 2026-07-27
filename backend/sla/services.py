from django.utils import timezone
from .models.sla_rule import SLARule
from .business_time import add_business_hours


def get_sla_rule(client_plan, priority):
    try:
        return SLARule.objects.get(plan=client_plan, priority=priority, active=True)
    except SLARule.DoesNotExist:
        # Filet de sécurité : si la règle exacte manque, retombe sur ESSENTIEL
        return SLARule.objects.filter(plan="ESSENTIEL", priority=priority, active=True).first()


def compute_sla_deadline(created_at, sla_rule):
    return add_business_hours(created_at, sla_rule.resolution_hours)