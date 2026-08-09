# sla/services.py
from datetime import timedelta
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
    """
    Essentiel/Standard : le document parle explicitement de "jours ouvrés"
    (section 4) → on compte en heures ouvrées (9h-18h, lun-ven).

    Premium : le document parle de délais courts (24h/48h) sans mention
    "ouvré", cohérent avec la ligne "Astreinte : selon contrat" de la grille
    comparative → on compte en heures calendaires réelles, 24h/24, 7j/7.
    """
    if sla_rule.plan == SLARule.Plan.PREMIUM:
        return created_at + timedelta(hours=float(sla_rule.resolution_hours))
    return add_business_hours(created_at, sla_rule.resolution_hours)