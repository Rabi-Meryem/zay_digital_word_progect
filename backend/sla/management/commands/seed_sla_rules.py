# sla/management/commands/seed_sla_rules.py
from django.core.management.base import BaseCommand
from sla.models.sla_rule import SLARule


class Command(BaseCommand):
    help = "Crée ou met à jour les 12 règles SLA (3 plans x 4 priorités) selon le CDC."

    # Valeurs tirées du document "Critères SLA — ZAY Digital World" (sections 5.1/5.2/5.3)
    RULES = [
        # plan, priority, response_hours, diagnostic_hours, resolution_hours, warning_percentage
        ("ESSENTIEL", "CRITICAL", 4,    None, 72,  80),   # 3j ouvrés
        ("ESSENTIEL", "HIGH",     24,   24,   72,  80),
        ("ESSENTIEL", "MEDIUM",   48,   48,   72,  80),
        ("ESSENTIEL", "LOW",      72,   None, 72,  80),

        ("STANDARD",  "CRITICAL", 2,    4,    24,  80),   # contournement jour même -> 1j
        ("STANDARD",  "HIGH",     4,    24,   72,  80),   # 1 à 3j -> on prend le max
        ("STANDARD",  "MEDIUM",   24,   48,   168, 80),   # 3 à 7j -> max
        ("STANDARD",  "LOW",      48,   None, 168, 80),

        ("PREMIUM",   "CRITICAL", 1,    2,    48,  80),   # correction 24h à 48h -> max
        ("PREMIUM",   "HIGH",     2,    4,    48,  80),   # 1 à 2j -> max
        ("PREMIUM",   "MEDIUM",   8,    24,   120, 80),   # 2 à 5j -> max
        ("PREMIUM",   "LOW",      24,   None, 120, 80),
    ]

    def handle(self, *args, **options):
        created, updated = 0, 0
        for plan, priority, response_h, diag_h, resolution_h, warning_pct in self.RULES:
            obj, was_created = SLARule.objects.update_or_create(
                plan=plan,
                priority=priority,
                defaults={
                    "response_hours": response_h,
                    "diagnostic_hours": diag_h,
                    "resolution_hours": resolution_h,
                    "warning_percentage": warning_pct,
                    "active": True,
                },
            )
            created += was_created
            updated += not was_created

        self.stdout.write(self.style.SUCCESS(
            f"Terminé : {created} règle(s) créée(s), {updated} règle(s) mise(s) à jour."
        ))