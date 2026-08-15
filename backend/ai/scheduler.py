# backend/ai/scheduler.py
# ---------------------------------------------------------------------------
# Déclencheur automatique de la reprise IA.
#
# Django ne se réveille pas tout seul : il attend des requêtes. APScheduler
# fait tourner un fil de fond qui appelle ai_auto_process toutes les 5 minutes
# sur les tickets non classés depuis plus de AI_CLASSIFICATION_DELAY_MINUTES.
#
# Démarre avec runserver, s'arrête avec lui. Rien à configurer.
# ---------------------------------------------------------------------------

import logging

from apscheduler.schedulers.background import BackgroundScheduler
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

_scheduler = None


def reprendre_tickets_non_classes():
    """Classe par IA les tickets que le superviseur n'a pas traités à temps."""
    from tickets.models import Ticket
    from tickets.services import ticket_service

    delai = getattr(settings, 'AI_CLASSIFICATION_DELAY_MINUTES', 45)
    deadline = timezone.now() - timezone.timedelta(minutes=delai)

    en_attente = Ticket.objects.filter(
        current_status=Ticket.Status.OPEN,
        assigned_agent=None,
        created_at__lte=deadline,
    )
    print(f"[IA] Passage du planificateur — {en_attente.count()} ticket(s) a traiter.")

    for ticket in en_attente:
        try:
            ticket_service.ai_auto_process(ticket)
            print(f"[IA] Ticket {ticket.ticket_number} repris et classe.")
        except Exception:
            logger.exception("Reprise IA impossible pour %s", ticket.ticket_number)


def demarrer():
    """Lance le planificateur. Appelé une seule fois au démarrage de Django."""
    global _scheduler

    if _scheduler is not None:
        return

    _scheduler = BackgroundScheduler(timezone=str(timezone.get_current_timezone()))
    _scheduler.add_job(
        reprendre_tickets_non_classes,
        trigger='interval',
        minutes=5,
        id='reprise_ia_tickets',
        replace_existing=True,
        max_instances=1,      # un seul passage à la fois : le LLM prend du temps
        coalesce=True,        # les passages manqués ne s'accumulent pas
    )
    _scheduler.start()
    print("========== PLANIFICATEUR IA DEMARRE (controle toutes les 5 min) ==========")