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
import logging

logger = logging.getLogger(__name__)


class TicketService:
    """
    Service central pour toutes les opérations sur les tickets.
    Chaque méthode correspond à une action métier précise.
    """

    # ─────────────────────────────────────────────────────────────────────────
    # CRÉER UN TICKET
    # ─────────────────────────────────────────────────────────────────────────
    @transaction.atomic
    def create_ticket(self, client, title, description, source='WEB', module=None):
        provisional_sla_rule = get_sla_rule(client.plan, Ticket.Priority.MEDIUM)

        if provisional_sla_rule is None:
            raise Exception(f"Aucune règle SLA MEDIUM active trouvée pour le plan {client.plan}.")

        now = timezone.now()
        sla_deadline = compute_sla_deadline(now, provisional_sla_rule)

        ticket = Ticket.objects.create(
            client         = client,
            title          = title,
            description    = description,
            module         = module,
            source         = source,
            priority       = None,
            sla_rule       = provisional_sla_rule,
            sla_deadline   = sla_deadline,
            current_status = Ticket.Status.OPEN,
        )

        SLAHistory.objects.create(
            ticket    = ticket,
            sla_start = now,
            sla_end   = sla_deadline,
        )

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
            ticket.sla_warning_sent = False 

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
        # Client + agent + superviseur, sans l'auteur de l'action.
        recipients = self._status_change_recipients(ticket, changed_by)
        if new_status == Ticket.Status.RESOLVED:
            notification_service.notify('TICKET_RESOLVED', ticket, recipients=recipients)
        elif new_status == Ticket.Status.CLOSED:
            notification_service.notify('TICKET_CLOSED', ticket, recipients=recipients)
        elif new_status == Ticket.Status.REOPENED:
            notification_service.notify('TICKET_REOPENED', ticket, recipients=recipients)
        elif new_status not in (Ticket.Status.ASSIGNED, Ticket.Status.ESCALATED):
            notification_service.notify('TICKET_STATUS_CHANGED', ticket, recipients=recipients)

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

    def _status_change_recipients(self, ticket, changed_by):
        """Client + agent assigné + superviseur, sans l'auteur de l'action."""
        candidates = [ticket.client, ticket.assigned_agent, ticket.supervisor]
        recipients = list({u.id: u for u in candidates if u is not None}.values())
        if changed_by is not None:
            recipients = [u for u in recipients if u.id != changed_by.id]
        return recipients

    # ─────────────────────────────────────────────────────────────────────────
    # ASSIGNER UN TICKET À UN AGENT
    # ─────────────────────────────────────────────────────────────────────────
    @transaction.atomic
    def assign_ticket(self, ticket, agent, assigned_by, note=''):
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
            reason            = note,
        )

        reason = f"Assigné à {agent.first_name} {agent.last_name}"
        if note:
            reason += f" — Note : {note}"

        self.change_status(
            ticket, Ticket.Status.ASSIGNED, assigned_by,
            reason=reason
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
                + (f" — Note : {note}" if note else "")
            ),
        )

        # Notifications (module 5.2.2)
        agent_message = f"Le ticket {ticket.ticket_number} vous a été assigné."
        if note:
            agent_message += f"\nNote du superviseur : {note}"

        notification_service.notify(
            'TICKET_ASSIGNED', ticket, recipients=[agent],
            override_content=agent_message,
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

        # Notification (modules 5.4.3/5.4.4)
        if escalation_type == 'MANUAL':
            notification_service.notify(
                'ESCALATION_MANUAL', ticket, recipients=[supervisor],
                override_content=f"Ticket {ticket.ticket_number} escaladé : {reason}",
            )
        else:  # AUTO
            recipients = [u for u in [ticket.assigned_agent, supervisor] if u]
            notification_service.notify(
                'ESCALATION_AUTO', ticket, recipients=recipients,
                override_content=f"Ticket {ticket.ticket_number} escaladé automatiquement (SLA dépassé) : {reason}",
            )
        return escalation

    # ─────────────────────────────────────────────────────────────────────────
    # ÉVALUER UN TICKET RÉSOLU
    # ─────────────────────────────────────────────────────────────────────────
    def rate_ticket(self, ticket, client, rating, comment=''):
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
    # MÉTHODES PRIVÉES
    # ─────────────────────────────────────────────────────────────────────────
    def _call_ai_prediction(self, ticket):
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
            pass

    def _update_agent_workload(self, agent):
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
        sla_rule = get_sla_rule(ticket.client.plan, priority)
        if sla_rule is None:
            raise Exception(f"Aucune règle SLA active pour la priorité {ticket.client.plan}/{priority}.")

        now = timezone.now()

        ticket.priority     = priority
        ticket.sla_rule     = sla_rule
        ticket.sla_deadline = compute_sla_deadline(now, sla_rule)
        ticket.supervisor   = supervisor
        ticket.sla_warning_sent = False 
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

        # L'agent est optionnel : on ne réaffecte que s'il a été choisi.
        # Si aucun agent n'est fourni, le ticket garde son affectation actuelle
        # (ou reste non affecté) — seule la priorité/SLA est mise à jour.
        if agent:
            self.assign_ticket(ticket, agent, supervisor)

        return ticket

    @transaction.atomic
    def ai_auto_process(self, ticket):
        """Classement automatique d'un ticket non traité par le superviseur."""
        from ai.classification import classer_ticket
        from ai.services import get_utilisateur_ia

        MAP_CRITICITE = {
            'Critique': Ticket.Priority.CRITICAL,
            'Haute':    Ticket.Priority.HIGH,
            'Moyenne':  Ticket.Priority.MEDIUM,
            'Basse':    Ticket.Priority.LOW,
        }

        predicted_priority = Ticket.Priority.MEDIUM
        confidence         = 0
        resultat           = None

        try:
            resultat = classer_ticket(
                ticket.title,
                ticket.description,
                ticket.module,
            )
            predicted_priority = MAP_CRITICITE.get(
                resultat['criticite'], Ticket.Priority.MEDIUM
            )
            # confiance_ml vaut entre 0 et 1 ; ai_confidence est un pourcentage.
            confidence = round(resultat['confiance_ml'] * 100, 1)
        except Exception:
            logger.exception(
                "Classification IA impossible pour %s", ticket.ticket_number
            )

        sla_rule = get_sla_rule(ticket.client.plan, predicted_priority)
        if sla_rule is None:
            sla_rule = SLARule.objects.filter(
                plan=ticket.client.plan, active=True
            ).first()
            predicted_priority = sla_rule.priority if sla_rule else Ticket.Priority.MEDIUM

        now = timezone.now()

        ticket.priority         = predicted_priority
        ticket.ai_priority      = predicted_priority
        ticket.ai_confidence    = confidence
        ticket.sla_warning_sent = False
        ticket.sla_rule         = sla_rule
        ticket.sla_deadline     = compute_sla_deadline(now, sla_rule)

        if resultat is not None:
            ticket.ai_source            = resultat['source']
            ticket.ai_justification     = resultat['justification']
            ticket.ai_relecture_requise = resultat['relecture_requise']
            ticket.ai_seuil_calibre     = resultat['seuil_calibre']

        ticket.save()

        # L'affectation est signée par l'utilisateur système : assigned_by et
        # changed_by sont NOT NULL en base, et passer None annulerait toute la
        # transaction — criticité comprise.
        agent = self._get_least_busy_agent()
        if agent:
            self.assign_ticket(ticket, agent, assigned_by=get_utilisateur_ia())

        AuditLog.objects.create(
            user         = None,
            action_type  = AuditLog.ActionType.UPDATE,
            target_model = 'Ticket',
            target_id    = str(ticket.id),
            description  = (
                f"IA a traité automatiquement le ticket {ticket.ticket_number} "
                f"(criticité : {predicted_priority}, "
                f"source : {resultat['source'] if resultat else 'échec'}, "
                f"confiance ML : {confidence} %) "
                f"faute de classement par le superviseur"
            ),
        )

        return ticket

    def _get_least_busy_agent(self):
        from users.models import AgentAvailability
        availability = AgentAvailability.objects.filter(
            agent__is_active=True,
            agent__role__name='AGENT',
            status='AVAILABLE',
        ).order_by('workload').first()

        return availability.agent if availability else None


# Instance unique utilisée dans toutes les vues
ticket_service = TicketService()