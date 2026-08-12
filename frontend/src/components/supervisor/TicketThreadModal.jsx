import { useEffect, useState } from 'react'
import { X, User } from 'lucide-react'
import toast from 'react-hot-toast'
import PriorityBadge from '../tickets/PriorityBadge'
import StatusBadge, { statusLabel } from '../tickets/StatusBadge'
import { fetchTicket } from '../../api/tickets'

// Consultation d'un ticket par le superviseur : informations du ticket et
// historique des changements de statut.

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function TicketThreadModal({ ticketId, onClose }) {
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTicket(ticketId)
      .then(setTicket)
      .catch(() => toast.error('Impossible de charger le ticket.'))
      .finally(() => setLoading(false))
  }, [ticketId])

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="min-w-0">
            {loading ? (
              <p className="text-sm text-slate-400">Chargement...</p>
            ) : ticket ? (
              <>
                <p className="text-xs text-slate-400">
                  {ticket.ticket_number} · {fmtDate(ticket.created_at)}
                </p>
                <p className="font-semibold text-slate-800 mt-0.5 truncate">{ticket.title}</p>
                <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <User size={12} />
                  {ticket.client?.full_name ?? 'Client'}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Ticket introuvable.</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
            <X size={18} />
          </button>
        </div>

        {ticket && (
          <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.current_status} />
              {ticket.assigned_agent && (
                <span className="text-xs text-slate-500">
                  Agent : {ticket.assigned_agent.full_name}
                </span>
              )}
            </div>

            {ticket.description && (
              <p className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {ticket.description}
              </p>
            )}
            
            {ticket.rating && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Évaluation du client</p>
                <div className="border border-slate-200 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-1 mb-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={n <= ticket.rating.rating ? 'text-amber-400' : 'text-slate-200'}
                      >
                        ★
                      </span>
                    ))}
                    <span className="text-xs font-medium text-slate-600 ml-1">
                      {ticket.rating.rating}/5
                    </span>
                  </div>
                  {ticket.rating.comment ? (
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      « {ticket.rating.comment} »
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">Aucun commentaire laissé.</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Historique des statuts</p>
              {(ticket.status_history ?? []).length === 0 ? (
                <p className="text-sm text-slate-400">Aucun changement enregistré.</p>
              ) : (
                <ol className="space-y-2">
                  {ticket.status_history.map((h, i) => (
                    <li key={i} className="flex gap-2.5 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 shrink-0" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block text-slate-700">
                          {statusLabel(h.old_status)} → {statusLabel(h.new_status)}
                          {h.changed_by ? ` · ${h.changed_by}` : ''}
                        </span>
                        {h.reason && <span className="block text-slate-500 italic">{h.reason}</span>}
                        <span className="block text-slate-400 mt-0.5">{fmtDate(h.changed_at)}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TicketThreadModal
