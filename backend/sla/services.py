from django.utils import timezone
from .models.sla_rule import SLARule
from .business_time import add_business_hours


def get_sla_rule(client_plan, priority):
    rule = SLARule.objects.filter(plan=client_plan, priority=priority, active=True).first()
    if rule:
        return rule

    rule = SLARule.objects.filter(plan="ESSENTIEL", priority=priority, active=True).first()
    if rule:
        return rule

    raise SLARule.DoesNotExist(
        f"Aucune règle SLA active trouvée pour plan={client_plan}, priority={priority} "
        f"(fallback ESSENTIEL également absent)."
    )

def compute_sla_deadline(created_at, sla_rule):
    return add_business_hours(created_at, sla_rule.resolution_hours)