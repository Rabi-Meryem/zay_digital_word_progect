import os
import sys

from django.apps import AppConfig


class AiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ai'

    def ready(self):
        import os
        import sys

        # Pas de planificateur pour les commandes qui ne servent pas le portail
        if any(c in sys.argv for c in ('migrate', 'makemigrations', 'test', 'shell', 'collectstatic', 'createsuperuser')):
            return

        # runserver lance deux processus ; on ne démarre que dans le principal
        if 'runserver' in sys.argv and os.environ.get('RUN_MAIN') != 'true':
            return

        from ai.scheduler import demarrer
        demarrer()