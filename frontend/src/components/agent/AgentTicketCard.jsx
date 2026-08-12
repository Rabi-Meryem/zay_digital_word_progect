import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowUpRight, ChevronRight, CheckCircle2, XCircle, Star } from 'lucide-react'
import PriorityBadge from '../tickets/PriorityBadge'
import StatusBadge from '../tickets/StatusBadge'
import SlaBar from '../tickets/SlaBar'
import EscalationModal from './EscalationModal'

// Carte d'un ticket assigné à l'agent — maquette Écran 2.1.
// « Traiter » ouvre la fiche (Écran 2.2),
// « Escalader » la fenêtre d'escalade (Écran 2.4).

const RESOLVED_STATUSES = ['RESOLVED', 'CLOSED']

// L'escalade n'est proposée que sur les priorités où elle a du sens
// (cf. Écran 2.4 : hors compétences / risque SLA), et jamais sur un
// ticket déjà résolu/clôturé.
const ESCALATABLE = ['CRITICAL', 'HIGH']

// ── Formatage d'une durée (ms) en "Xj" ou "Xh XXmin" ──
function formatDuration(ms) {
  const totalMinutes = Math.floor(Math.abs(ms) / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  if (days >= 1) return `${days}j`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours >= 1) return `${hours}h ${String(minutes).padStart(2, '0')}min`
  return `${minutes}min`
}

// ── État SLA figé pour un ticket déjà résolu/clôturé ──
// Contrairement à SlaBar (qui recalcule par rapport à l'heure actuelle
// et continue donc de "compter" indéfiniment après résolution), ce
// composant calcule une seule fois l'écart entre resolved_at et
// sla_deadline : le résultat ne bouge plus jamais, comme côté client.
function ResolvedSlaInfo({ ticket }) {
  const resolvedAt = ticket.resolved_at ? new Date(ticket.resolved_at) : null
  const slaDeadline = ticket.sla_deadline ? new Date(ticket.sla_deadline) : null

  if (!resolvedAt || !slaDeadline) {
    return (
      <p className="text-xs text-slate-400">
        {ticket.is_sla_respected ? 'SLA respecté' : 'SLA dépassé'}
      </p>
    )
  }

  const diffMs = resolvedAt - slaDeadline // > 0 si résolu après la deadline
  const respected = ticket.is_sla_respected ?? diffMs <= 0

  return (
    <div className="flex items-center gap-1.5">
      {respected ? (
        <>
          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-600 font-medium">
            SLA respecté — résolu {formatDuration(diffMs)} avant l&apos;échéance
          </p>
        </>
      ) : (
        <>
          <XCircle size={13} className="text-danger shrink-0" />
          <p className="text-xs text-danger font-medium">
            SLA dépassé de {formatDuration(diffMs)}
          </p>
        </>
      )}
    </div>
  )
}

function AgentTicketCard({ ticket }) {
  const navigate = useNavigate()
  const [showEscalation, setShowEscalation] = useState(false)

  const isResolved = RESOLVED_STATUSES.includes(ticket.current_status)

  const confirmEscalation = ({ reasonLabel }) => {
    setShowEscalation(false)
    toast.success(`Ticket escaladé au superviseur — motif : ${reasonLabel} (simulation)`)
  }

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-secondary/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-slate-400">
            #{ticket.ticket_number.split('-').pop()}
          </p>
          <h3 className="font-medium text-slate-800 mt-0.5 truncate">{ticket.title}</h3>
          {/* Identité du client volontairement masquée pour l'agent :
              l'agent traite le ticket sans voir qui l'a créé (confidentialité). */}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.current_status} />
        </div>
      </div>

      <div className="mt-3">
        {isResolved ? (
          <ResolvedSlaInfo ticket={ticket} />
        ) : ticket.priority ? (
          <SlaBar createdAt={ticket.created_at} slaDeadline={ticket.sla_deadline} priority={ticket.priority} />
        ) : (
          <p className="text-xs text-slate-400">SLA : en attente de classification</p>
        )}
      </div>

      {ticket.assignment_note && (
        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <p className="text-xs font-semibold text-amber-700 mb-0.5">Note du superviseur</p>
          <p className="text-xs text-amber-800">{ticket.assignment_note}</p>
        </div>
      )}

      {isResolved && ticket.rating != null && (
        <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
          <Star size={12} className="text-amber-400 fill-amber-400" />
          Évaluation : {ticket.rating}/5
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 flex-wrap">

        {!isResolved && ESCALATABLE.includes(ticket.priority) && (
          <button
            type="button"
            onClick={() => setShowEscalation(true)}
            className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50"
          >
            <ArrowUpRight size={13} />
            Escalader
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate(`/agent/tickets/${ticket.id}`)}
          className="flex items-center gap-1 text-xs font-medium text-primary-foreground bg-primary rounded-lg px-3 py-1.5 ml-auto hover:bg-primary/90 transition"
        >
          {isResolved ? 'Voir détails' : 'Traiter'} <ChevronRight size={14} />
        </button>
      </div>

      {showEscalation && (
        <EscalationModal
          ticket={ticket}
          onClose={() => setShowEscalation(false)}
          onConfirm={confirmEscalation}
        />
      )}
    </div>
  )
}

export default AgentTicketCard