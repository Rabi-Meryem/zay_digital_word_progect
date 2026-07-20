from django.core.management.base import BaseCommand
from users.models import User, Role


class Command(BaseCommand):
    """
    Crée (ou réinitialise) un compte AGENT de test pour le développement local.
    Jumeau de create_test_client, mais avec le rôle AGENT : permet de vérifier
    que la connexion redirige bien vers la Console Agent (/agent/dashboard).

        python manage.py create_test_agent

    Identifiants par défaut :
        email    : agent.test@zay.ma
        password : Agent2026!
    """

    help = 'Crée ou réinitialise un compte agent de test (dev uniquement).'

    def add_arguments(self, parser):
        parser.add_argument('--email', default='agent.test@zay.ma')
        parser.add_argument('--password', default='Agent2026!')
        parser.add_argument('--first-name', default='Ahmed')
        parser.add_argument('--last-name', default='Karimi')

    def handle(self, *args, **options):
        email = options['email'].strip().lower()
        password = options['password']

        role, _ = Role.objects.get_or_create(
            name=Role.RoleName.AGENT,
            defaults={'description': 'Agent support traitant les tickets'},
        )

        user = User.objects.filter(email=email).first()

        if user:
            user.set_password(password)
            user.is_active = True
            user.role = role
            user.save()
            action = 'réinitialisé'
        else:
            user = User.objects.create_user(
                email=email,
                password=password,
                first_name=options['first_name'],
                last_name=options['last_name'],
                role=role,
                is_active=True,
            )
            action = 'créé'

        self.stdout.write(self.style.SUCCESS(
            f'Compte agent de test {action} :\n'
            f'  email    : {email}\n'
            f'  password : {password}\n'
            f'  rôle     : {role.name}'
        ))
        self.stdout.write(self.style.WARNING(
            'À utiliser uniquement en développement local.'
        ))
