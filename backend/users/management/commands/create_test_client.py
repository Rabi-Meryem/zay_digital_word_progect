from django.core.management.base import BaseCommand
from users.models import User, Role


class Command(BaseCommand):
    """
    Crée (ou réinitialise) un compte CLIENT de test pour le développement local.

    Pourquoi cette commande ?
    Un compte utilisateur vit dans la BASE DE DONNÉES, pas dans le code Git.
    Le compte créé par une collègue sur sa machine n'existe donc pas chez toi
    après un clone. Cette commande permet à chaque membre de l'équipe de
    recréer le même compte de test en une seule ligne :

        python manage.py create_test_client

    Identifiants par défaut (modifiables via les options) :
        email    : client.test@zay.ma
        password : Client2026!
    """

    help = 'Crée ou réinitialise un compte client de test (dev uniquement).'

    def add_arguments(self, parser):
        parser.add_argument('--email', default='client.test@zay.ma')
        parser.add_argument('--password', default='Client2026!')
        parser.add_argument('--first-name', default='Meryem')
        parser.add_argument('--last-name', default='Client')

    def handle(self, *args, **options):
        email = options['email'].strip().lower()
        password = options['password']

        # Le rôle CLIENT doit exister (créé normalement par seed_data,
        # mais on le garantit ici pour que la commande soit autonome).
        role, _ = Role.objects.get_or_create(
            name=Role.RoleName.CLIENT,
            defaults={'description': 'Utilisateur client soumettant des tickets'},
        )

        user = User.objects.filter(email=email).first()

        if user:
            # Compte déjà présent : on réinitialise le mot de passe et on
            # s'assure qu'il est actif, pour garantir des identifiants connus.
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
            f'Compte client de test {action} :\n'
            f'  email    : {email}\n'
            f'  password : {password}\n'
            f'  rôle     : {role.name}'
        ))
        self.stdout.write(self.style.WARNING(
            'À utiliser uniquement en développement local.'
        ))
