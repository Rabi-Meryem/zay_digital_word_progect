import { useNavigate } from 'react-router-dom'
import { MessageSquare, ChevronRight, Star } from 'lucide-react'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'
import SlaBar from './SlaBar'

const RESOLVED_STATUSES = ['RESOLVED', 'CLOSED']

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function TicketCard({ ticket }) {
  const navigate = useNavigate()
  const isResolved = RESOLVED_STATUSES.includes(ticket.current_status)

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-secondary/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-slate-400">
            #{ticket.ticket_number.split('-').pop()} · {formatDate(ticket.created_at)}
          </p>
          <h3 className="font-medium text-slate-800 mt-0.5 truncate">{ticket.title}</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <PriorityBadge priority={ticket.priority} />
            {ticket.assigned_agent && (
              <span className="text-xs text-slate-500">
                {ticket.assigned_agent.first_name} {ticket.assigned_agent.last_name}
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={ticket.current_status} />
      </div>

      {!isResolved && (
        <div className="mt-3">
          <SlaBar createdAt={ticket.created_at} slaDeadline={ticket.sla_deadline} priority={ticket.priority} />
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        {isResolved && ticket.rating ? (
          <div className="flex items-center gap-1 text-xs text-slate-500 flex-1">
            <span>Évaluation :</span>
            <Star size={13} className="fill-accent text-accent" />
            <span>{ticket.rating}/5</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigate(`/tickets/${ticket.id}`)}
            className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50"
          >
            <MessageSquare size={13} />
            Messages{ticket.unread_messages ? ` (${ticket.unread_messages})` : ''}
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate(`/tickets/${ticket.id}`)}
          className="flex items-center gap-1 text-xs font-medium text-secondary ml-auto hover:underline"
        >
          Voir détails <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default TicketCard
