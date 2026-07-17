import { Link } from 'react-router-dom'
import { MOCK_ACTIVITES } from '../../data/mockClientActivity'

// Ligne 3 (droite) : activités récentes, tous tickets confondus.

const PASTILLE = {
  agent: 'bg-secondary',
  client: 'bg-slate-400',
  attente: 'bg-accent',
  escalade: 'bg-danger',
  ia: 'bg-primary',
  resolu: 'bg-success',
}

function RecentActivityWidget({ activites = MOCK_ACTIVITES }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-800 mb-3">Activités récentes</h2>

      <ol className="space-y-3">
        {activites.map((a) => (
          <li key={a.id} className="flex gap-2.5">
            <span
              className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${PASTILLE[a.type] ?? 'bg-slate-300'}`}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-700 leading-snug">
                <Link to={`/tickets/${a.ticketId}`} className="font-medium text-slate-800 hover:text-secondary">
                  {a.ticket}
                </Link>{' '}
                — {a.libelle}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{a.quand}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default RecentActivityWidget
