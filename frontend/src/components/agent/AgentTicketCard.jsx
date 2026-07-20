import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MessageSquare, ArrowUpRight, ChevronRight } from 'lucide-react'
import PriorityBadge from '../tickets/PriorityBadge'
import StatusBadge from '../tickets/StatusBadge'
import SlaBar from '../tickets/SlaBar'
import EscalationModal from './EscalationModal'

// Carte d'un ticket assigné à l'agent — maquette Écran 2.1.
// « Traiter » ouvre la fiche (Écran 2.2), « Messages » le chat (Écran 2.3),
// « Escalader » la fenêtre d'escalade (Écran 2.4).

// L'escalade n'est proposée que sur les priorités où elle a du sens
// (cf. Écran 2.4 : hors compétences / risque SLA).
const ESCALATABLE = ['CRITICAL', 'HIGH']

function AgentTicketCard({ ticket }) {
  const navigate = useNavigate()
  const [showEscalation, setShowEscalation] = useState(false)

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
        <SlaBar
          createdAt={ticket.created_at}
          slaDeadline={ticket.sla_deadline}
          priority={ticket.priority}
        />
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <button
          type="button"
          onClick={() => navigate(`/agent/tickets/${ticket.id}/messages`)}
          className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50"
        >
          <MessageSquare size={13} />
          Messages{ticket.unread_messages ? ` (${ticket.unread_messages})` : ' (0)'}
        </button>

        {ESCALATABLE.includes(ticket.priority) && (
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
          Traiter <ChevronRight size={14} />
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
