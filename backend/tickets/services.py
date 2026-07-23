from django.utils import timezone
from django.db import transaction

from sla.services import get_sla_rule, compute_sla_deadline
from tickets.models import (
    Ticket, TicketStatusHistory, TicketAssignment, TicketRating
)
from sla.models import SLARule, SLAHistory
from escalation.models import Escalation
from logs_app.models import AuditLog
from users.models import User
from notifications.services import notification_service


class TicketService:
    """
    Service central pour toutes les opérations sur les tickets.
    Chaque méthode correspond à une action métier précise.
    """

    # ─────────────────────────────────────────────────────────────────────────
    # CRÉER UN TICKET
    # Appelé par : TicketListCreateView.post()
    # ─────────────────────────────────────────────────────────────────────────
    @transaction.atomic
    def create_ticket(self, client, title, description, source='WEB'):
        """
        Crée un ticket complet :
        1. Récupère la règle SLA selon le plan du client et la priorité
        2. Calcule la deadline SLA
        3. Crée le ticket en base
        4. Crée l'entrée dans sla_history
        5. Appelle le module IA pour prédire la priorité
        6. Log l'action dans audit_logs
        """

        # Étape 1 — Récupérer la règle SLA par défaut (MEDIUM) selon le plan du client
        sla_rule = get_sla_rule(client.plan, Ticket.Priority.MEDIUM)

        if sla_rule is None:
            raise Exception(f"Aucune règle SLA MEDIUM active trouvée pour le plan {client.plan}.")

        # Étape 2 — Calculer la deadline
        now = timezone.now()
        sla_deadline = compute_sla_deadline(now, sla_rule)

        # Étape 3 — Créer le ticket en base
        ticket = Ticket.objects.create(
            client         = client,
            title          = title,
            description    = description,
            source         = source,
            priority       = Ticket.Priority.MEDIUM,
            sla_rule       = sla_rule,
            sla_deadline   = sla_deadline,
            current_status = Ticket.Status.OPEN,
        )

        # Étape 4 — Historique SLA
        SLAHistory.objects.create(
            ticket    = ticket,
            sla_start = now,
            sla_end   = sla_deadline,
        )

        # Étape 5 — Appeler le module IA pour prédire la priorité
        self._call_ai_prediction(ticket)

        # Étape 6 — Logger l'action
        AuditLog.objects.create(
            user         = client,
            action_type  = AuditLog.ActionType.CREATE,
            target_model = 'Ticket',
            target_id    = str(ticket.id),
            description  = f"Création du ticket {ticket.ticket_number} : {title}",
        )

        # Notifications (module 5.2.1)
        notification_service.notify('TICKET_CREATED', ticket, recipients=[client])

        supervisors = list(User.objects.filter(role__name='SUPERVISOR', is_active=True))
        if supervisors:
            notification_service.notify(
                'TICKET_CREATED', ticket, recipients=supervisors,
                override_title=f"Nouveau ticket à affecter — {ticket.ticket_number}",
                override_content=f"Le ticket '{title}' nécessite une affectation.",
            )
        return ticket

    # ─────────────────────────────────────────────────────────────────────────
    # CHANGER LE STATUT D'UN TICKET
    # ─────────────────────────────────────────────────────────────────────────
    def change_status(self, ticket, new_status, changed_by, reason=''):
        """
        Change le statut d'un ticket et enregistre
        automatiquement dans ticket_status_history.
        """
        old_status = ticket.current_status

        if old_status == new_status:
            return ticket

        now = timezone.now()
        if new_status == Ticket.Status.IN_PROGRESS and not ticket.taken_in_charge_at:
            ticket.taken_in_charge_at = now
        if new_status == Ticket.Status.RESOLVED:
            ticket.resolved_at     = now
            ticket.is_sla_respected = (now <= ticket.sla_deadline)
        if new_status == Ticket.Status.CLOSED:
            ticket.closed_at = now
        if new_status == Ticket.Status.REOPENED:
            ticket.reopened_count += 1
            ticket.sla_deadline    = compute_sla_deadline(now, ticket.sla_rule)
            ticket.is_sla_respected = True

        ticket.current_status = new_status
        ticket.save()

        TicketStatusHistory.objects.create(
            ticket     = ticket,
            old_status = old_status,
            new_status = new_status,
            changed_by = changed_by,
            reason     = reason,
            changed_at = now,
        )

        # Notifications (modules 5.2.3 à 5.2.6)
        if new_status == Ticket.Status.RESOLVED:
            notification_service.notify('TICKET_RESOLVED', ticket, recipients=[ticket.client])
        elif new_status == Ticket.Status.CLOSED:
            notification_service.notify('TICKET_CLOSED', ticket, recipients=[ticket.client])
        elif new_status == Ticket.Status.REOPENED:
            recipients = [u for u in [ticket.assigned_agent, ticket.supervisor] if u]
            if recipients:
                notification_service.notify('TICKET_REOPENED', ticket, recipients=recipients)
        elif new_status not in (Ticket.Status.ASSIGNED, Ticket.Status.ESCALATED):
            notification_service.notify('TICKET_STATUS_CHANGED', ticket, recipients=[ticket.client])

        AuditLog.objects.create(
            user         = changed_by,
            action_type  = AuditLog.ActionType.UPDATE,
            target_model = 'Ticket',
            target_id    = str(ticket.id),
            description  = (
                f"Statut du ticket {ticket.ticket_number} "
                f"changé de {old_status} vers {new_status}"
            ),
        )

        return ticket

    # ─────────────────────────────────────────────────────────────────────────
    # ASSIGNER UN TICKET À UN AGENT
    # ─────────────────────────────────────────────────────────────────────────
    @transaction.atomic
    def assign_ticket(self, ticket, agent, assigned_by):
        """
        Assigne un ticket à un agent :
        1. Met à jour ticket.assigned_agent
        2. Crée une entrée dans ticket_assignments
        3. Change le statut vers ASSIGNED
        4. Met à jour la disponibilité de l'agent
        """
        from_agent = ticket.assigned_agent

        ticket.assigned_agent = agent
        ticket.assigned_at    = timezone.now()
        ticket.save(update_fields=['assigned_agent', 'assigned_at'])

        TicketAssignment.objects.create(
            ticket          = ticket,
            assigned_from   = from_agent,
            assigned_to     = agent,
            assigned_by     = assigned_by,
            assignment_date = timezone.now(),
        )

        self.change_status(
            ticket, Ticket.Status.ASSIGNED, assigned_by,
            reason=f"Assigné à {agent.first_name} {agent.last_name}"
        )

        self._update_agent_workload(agent)

        AuditLog.objects.create(
            user         = assigned_by,
            action_type  = AuditLog.ActionType.ASSIGN,
            target_model = 'Ticket',
            target_id    = str(ticket.id),
            description  = (
                f"Ticket {ticket.ticket_number} assigné à "
                f"{agent.first_name} {agent.last_name}"
            ),
        )

        # Notifications (module 5.2.2)
        notification_service.notify(
            'TICKET_ASSIGNED', ticket, recipients=[agent],
            override_content=f"Le ticket {ticket.ticket_number} vous a été assigné.",
        )
        notification_service.notify(
            'TICKET_ASSIGNED', ticket, recipients=[ticket.client],
            override_content=f"Votre ticket {ticket.ticket_number} a été pris en charge.",
        )
        return ticket

    # ─────────────────────────────────────────────────────────────────────────
    # ESCALADER UN TICKET
    # ─────────────────────────────────────────────────────────────────────────
    @transaction.atomic
    def escalate_ticket(self, ticket, escalated_by, reason, escalation_type='MANUAL'):
        """
        Escalade un ticket vers le superviseur.
        """
        supervisor = User.objects.filter(
            role__name='SUPERVISOR',
            is_active=True
        ).first()

        if not supervisor:
            raise Exception("Aucun superviseur actif trouvé.")

        escalation = Escalation.objects.create(
            ticket          = ticket,
            escalation_type = escalation_type,
            reason          = reason,
            escalated_by    = escalated_by,
            supervisor      = supervisor,
            escalation_date = timezone.now(),
        )

        self.change_status(
            ticket, Ticket.Status.ESCALATED, escalated_by,
            reason=f"Escalade vers superviseur : {reason}"
        )

        AuditLog.objects.create(
            user         = escalated_by,
            action_type  = AuditLog.ActionType.ESCALATE,
            target_model = 'Ticket',
            target_id    = str(ticket.id),
            description  = (
                f"Ticket {ticket.ticket_number} escaladé "
                f"({escalation_type}) : {reason}"
            ),
        )

        # Notification (modules 5.4.3/5.4.4/6.3/6.4)
        notification_service.notify(
            'ESCALATION_CREATED', ticket, recipients=[supervisor],
            override_content=f"Ticket {ticket.ticket_number} escaladé : {reason}",
        )
        return escalation

    # ─────────────────────────────────────────────────────────────────────────
    # ÉVALUER UN TICKET RÉSOLU
    # ─────────────────────────────────────────────────────────────────────────
    def rate_ticket(self, ticket, client, rating, comment=''):
        """
        Le client évalue la résolution de son ticket (1 à 5 étoiles).
        """
        if ticket.current_status not in [Ticket.Status.RESOLVED, Ticket.Status.CLOSED]:
            raise Exception("Seul un ticket résolu ou clôturé peut être évalué.")

        if ticket.client != client:
            raise Exception("Vous ne pouvez évaluer que vos propres tickets.")

        ticket_rating, created = TicketRating.objects.update_or_create(
            ticket  = ticket,
            defaults={
                'client':  client,
                'agent':   ticket.assigned_agent,
                'rating':  rating,
                'comment': comment,
            }
        )

        AuditLog.objects.create(
            user         = client,
            action_type  = AuditLog.ActionType.UPDATE,
            target_model = 'Ticket',
            target_id    = str(ticket.id),
            description  = (
                f"Évaluation du ticket {ticket.ticket_number} : "
                f"{rating}/5 — {comment}"
            ),
        )

        return ticket_rating

    # ─────────────────────────────────────────────────────────────────────────
    # MÉTHODES PRIVÉES (internes au service)
    # ─────────────────────────────────────────────────────────────────────────
    def _call_ai_prediction(self, ticket):
        """
        Appelle le microservice IA pour prédire la priorité du ticket.
        Si le service IA est indisponible, on ne bloque pas la création
        du ticket (on continue avec la priorité saisie par le client).
        """
        import requests
        from django.conf import settings
        import time

        try:
            start = time.time()
            response = requests.post(
                f"{settings.AI_SERVICE_URL}/predict/",
                json={
                    'title':       ticket.title,
                    'description': ticket.description,
                },
                timeout=settings.AI_SERVICE_TIMEOUT_SECONDS,
            )
            elapsed = time.time() - start

            if response.status_code == 200:
                data = response.json()
                predicted_priority = data.get('priority', ticket.priority)
                confidence         = data.get('confidence', 0)

                ticket.ai_priority   = predicted_priority
                ticket.ai_confidence = confidence
                ticket.save(update_fields=['ai_priority', 'ai_confidence'])

        except Exception:
            # Si le service IA est indisponible, on continue sans lui
            pass

    def _update_agent_workload(self, agent):
        """
        Met à jour le compteur de tickets actifs de l'agent
        dans la table agent_availability.
        """
        from users.models import AgentAvailability
        active_tickets = Ticket.objects.filter(
            assigned_agent = agent,
            current_status__in = [
                Ticket.Status.ASSIGNED,
                Ticket.Status.IN_PROGRESS,
                Ticket.Status.WAITING,
            ]
        ).count()

        AgentAvailability.objects.update_or_create(
            agent    = agent,
            defaults = {'workload': active_tickets}
        )

        # Alerte surcharge (module 5.5.2)
        OVERLOAD_THRESHOLD = 15
        if active_tickets >= OVERLOAD_THRESHOLD:
            supervisors = list(User.objects.filter(role__name='SUPERVISOR', is_active=True))
            if supervisors:
                notification_service.notify(
                    'AGENT_OVERLOAD', None, recipients=supervisors,
                    override_title=f"Surcharge agent — {agent.first_name} {agent.last_name}",
                    override_content=(
                        f"{agent.first_name} {agent.last_name} a {active_tickets} tickets actifs, "
                        f"au-dessus du seuil de {OVERLOAD_THRESHOLD}."
                    ),
                )

    @transaction.atomic
    def supervisor_set_priority_and_assign(self, ticket, priority, agent, supervisor):
        """
        Le superviseur fait deux choses en même temps :
        1. Définit la priorité officielle du ticket
        2. Assigne le ticket à un agent
        3. Recalcule la deadline SLA selon la nouvelle priorité

        Appelée par : TicketSetPriorityAndAssignView
        """
        sla_rule = get_sla_rule(ticket.client.plan, priority)
        if sla_rule is None:
            raise Exception(f"Aucune règle SLA active pour la priorité {ticket.client.plan}/{priority}.")

        now = timezone.now()

        ticket.priority     = priority
        ticket.sla_rule     = sla_rule
        ticket.sla_deadline = compute_sla_deadline(now, sla_rule)
        ticket.supervisor   = supervisor
        ticket.save(update_fields=['priority', 'sla_rule', 'sla_deadline', 'supervisor'])

        SLAHistory.objects.filter(ticket=ticket).update(sla_end=ticket.sla_deadline)

        AuditLog.objects.create(
            user         = supervisor,
            action_type  = AuditLog.ActionType.UPDATE,
            target_model = 'Ticket',
            target_id    = str(ticket.id),
            description  = (
                f"Superviseur {supervisor.first_name} {supervisor.last_name} "
                f"a défini la priorité du ticket {ticket.ticket_number} à {priority}"
            ),
        )

        self.assign_ticket(ticket, agent, supervisor)

        return ticket

    @transaction.atomic
    def ai_auto_process(self, ticket):
        """
        Déclenchée automatiquement si le superviseur n'a pas agi
        dans les 45 minutes suivant la création du ticket.

        1. L'IA analyse le titre + description et prédit la priorité
        2. Recalcule le SLA selon cette priorité
        3. Assigne à l'agent le moins chargé

        Appelée par : TicketAIAutoAssignView (endpoint cron)
        """
        import requests
        import time
        from django.conf import settings

        predicted_priority = 'MEDIUM'
        confidence         = 0

        try:
            start    = time.time()
            response = requests.post(
                f"{settings.AI_SERVICE_URL}/predict/",
                json={
                    'title':       ticket.title,
                    'description': ticket.description,
                },
                timeout=int(getattr(settings, 'AI_SERVICE_TIMEOUT_SECONDS', 5)),
            )
            elapsed = time.time() - start

            if response.status_code == 200:
                data               = response.json()
                predicted_priority = data.get('priority', 'MEDIUM')
                confidence         = data.get('confidence', 0)

        except Exception:
            pass

        sla_rule = get_sla_rule(ticket.client.plan, predicted_priority)
        if sla_rule is None:
            sla_rule = SLARule.objects.filter(plan=ticket.client.plan, active=True).first()
            predicted_priority = sla_rule.priority if sla_rule else 'MEDIUM'

        now = timezone.now()

        ticket.priority      = predicted_priority
        ticket.ai_priority   = predicted_priority
        ticket.ai_confidence = confidence
        ticket.sla_rule      = sla_rule
        ticket.sla_deadline  = compute_sla_deadline(now, sla_rule)
        ticket.save()

        agent = self._get_least_busy_agent()

        if agent:
            self.assign_ticket(ticket, agent, assigned_by=None)

        AuditLog.objects.create(
            user         = None,
            action_type  = AuditLog.ActionType.UPDATE,
            target_model = 'Ticket',
            target_id    = str(ticket.id),
            description  = (
                f"IA a traité automatiquement le ticket {ticket.ticket_number} "
                f"(priorité : {predicted_priority}, confiance : {confidence}%) "
                f"après 45 min sans action du superviseur"
            ),
        )

        return ticket

    def _get_least_busy_agent(self):
        """
        Trouve l'agent actif avec le moins de tickets en cours.
        """
        from users.models import AgentAvailability
        availability = AgentAvailability.objects.filter(
            agent__is_active=True,
            agent__role__name='AGENT',
            status='AVAILABLE',
        ).order_by('workload').first()

        return availability.agent if availability else None


# Instance unique utilisée dans toutes les vues
ticket_service = TicketService()