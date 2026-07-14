from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Role

User = get_user_model()


class Command(BaseCommand):
    help = "Crée un compte de test avec le rôle SUPERVISOR."

    def handle(self, *args, **options):
        role, _ = Role.objects.get_or_create(
            name="SUPERVISOR", defaults={"description": "Superviseur"}
        )
        user, created = User.objects.get_or_create(
            email="superviseur@zay.ma",
            defaults={"first_name": "Karim", "last_name": "Said", "role": role,
                      "is_active": True, "email_verified": True},
        )
        user.role = role
        user.set_password("Superviseur2026!")
        user.save()
        etat = "créé" if created else "mis à jour"
        self.stdout.write(self.style.SUCCESS(
            f"Superviseur de test {etat} : superviseur@zay.ma / Superviseur2026!"
        ))