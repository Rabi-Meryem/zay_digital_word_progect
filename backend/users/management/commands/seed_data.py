 
from django.core.management.base import BaseCommand
from users.models import Role
from sla.models import SLARule
from notifications.models import NotificationType, NotificationChannel
 
 
class Command(BaseCommand):
    help = 'Insère les données de départ obligatoires (rôles, SLA, notifications)'
 
    def handle(self, *args, **kwargs):
        self._seed_roles()
        self._seed_sla_rules()
        self._seed_notification_types()
        self._seed_notification_channels()
        self.stdout.write(self.style.SUCCESS('Seed terminé avec succès.'))
 
    def _seed_roles(self):
        roles = [
            ('CLIENT',     'Utilisateur client soumettant des tickets'),
            ('AGENT',      'Agent support traitant les tickets'),
            ('SUPERVISOR', 'Superviseur gérant les agents et les escalades'),
            ('ADMIN',      'Administrateur système avec accès complet'),
        ]
        for name, description in roles:
            role, created = Role.objects.get_or_create(name=name, defaults={'description': description})
            status = 'créé' if created else 'déjà existant'
            self.stdout.write(f'  Rôle {name} : {status}')
 
    def _seed_sla_rules(self):
        # Délais du CDC fonctionnel module 6 : Critique 2h, Haute 8h, Moyenne 24h, Basse 72h
        rules = [
            ('CRITICAL', 2,  80),
            ('HIGH',     8,  80),
            ('MEDIUM',   24, 80),
            ('LOW',      72, 80),
        ]
        for priority, hours, warning_pct in rules:
            rule, created = SLARule.objects.get_or_create(
                priority=priority,
                defaults={'resolution_hours': hours, 'warning_percentage': warning_pct}
            )
            status = 'créée' if created else 'déjà existante'
            self.stdout.write(f'  SLA {priority} ({hours}h) : {status}')
 
    def _seed_notification_types(self):
        types = [
            'TICKET_CREATED',
            'TICKET_ASSIGNED',
            'TICKET_STATUS_CHANGED',
            'TICKET_RESOLVED',
            'TICKET_CLOSED',
            'TICKET_REOPENED',
            'NEW_MESSAGE',
            'SLA_WARNING',
            'SLA_EXCEEDED',
            'ESCALATION_CREATED',
            'AGENT_OVERLOAD',
            'SYSTEM_ERROR',
            'SECURITY_ALERT',
        ]
        for name in types:
            nt, created = NotificationType.objects.get_or_create(name=name)
            status = 'créé' if created else 'déjà existant'
            self.stdout.write(f'  NotificationType {name} : {status}')
 
    def _seed_notification_channels(self):
        channels = ['EMAIL', 'IN_APP']
        for name in channels:
            nc, created = NotificationChannel.objects.get_or_create(name=name)
            status = 'créé' if created else 'déjà existant'
            self.stdout.write(f'  Canal {name} : {status}')