import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ticketsPrioritaires, formatSlaRestant } from '../../utils/clientKpis'
import StatusBadge from '../tickets/StatusBadge'

// Ligne 3 (gauche) : "Mes tickets prioritaires".
// Le client ne doit pas parcourir toute sa liste pour trouver ce qui est urgent :
// on remonte les 5 tickets actifs les plus proches de leur échéance SLA.

function PriorityTicketsWidget({ tickets = [] }) {
  const prioritaires = ticketsPrioritaires(tickets, 5)

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-800">Mes tickets prioritaires</h2>
        <Link to="/tickets" className="text-xs text-secondary hover:underline flex items-center gap-1">
          Voir tous <ArrowRight size={12} />
        </Link>
      </div>

      {prioritaires.length === 0 ? (
        <p className="text-xs text-slate-400 py-8 text-center">Aucun ticket en cours.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="pb-2 font-medium">Ticket</th>
              <th className="pb-2 font-medium">Statut</th>
              <th className="pb-2 font-medium text-right">SLA restant</th>
            </tr>
          </thead>
          <tbody>
            {prioritaires.map((t) => (
              <tr key={t.id} className="border-b border-slate-50 last:border-0">
                <td className="py-2.5 pr-2">
                  <Link to={`/tickets/${t.id}`} className="font-medium text-slate-700 hover:text-secondary">
                    {t.ticket_number}
                  </Link>
                  <p className="text-[11px] text-slate-400 truncate max-w-[170px]">{t.title}</p>
                </td>
                <td className="py-2.5">
                  <StatusBadge status={t.current_status} />
                </td>
                <td
                  className={`py-2.5 text-right font-medium ${
                    t._sla.level === 'breached'
                      ? 'text-danger'
                      : t._sla.level === 'warning'
                      ? 'text-warning'
                      : 'text-slate-600'
                  }`}
                >
                  {formatSlaRestant(t._sla.remainingMs)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default PriorityTicketsWidget
