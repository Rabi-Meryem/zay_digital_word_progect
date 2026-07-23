import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { fetchTicketHistoryList } from '../../api/tickets'

const STATUS_PASTILLE = {
  OPEN: 'bg-slate-400',
  ASSIGNED: 'bg-secondary',
  IN_PROGRESS: 'bg-secondary',
  WAITING: 'bg-accent',
  ESCALATED: 'bg-danger',
  RESOLVED: 'bg-success',
  CLOSED: 'bg-success',
  REOPENED: 'bg-accent',
}

const STATUS_LABEL = {
  OPEN: 'Ticket créé — en attente de prise en charge',
  ASSIGNED: 'Ticket assigné',
  IN_PROGRESS: 'Pris en charge par un agent',
  WAITING: "En attente d'informations complémentaires",
  ESCALATED: 'Ticket escaladé au superviseur',
  RESOLVED: 'Ticket résolu',
  CLOSED: 'Ticket clôturé',
  REOPENED: 'Ticket réouvert',
}

function formatAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  return `il y a ${Math.floor(hours / 24)} j`
}

function RecentActivityWidget() {
  const [activites, setActivites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTicketHistoryList({ page_size: 6, ordering: '-updated_at' })
      .then((data) => setActivites(data.results ?? []))
      .catch(() => toast.error("Impossible de charger les activités récentes."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-800 mb-3">Activités récentes</h2>

      {loading ? (
        <p className="text-xs text-slate-400">Chargement...</p>
      ) : activites.length === 0 ? (
        <p className="text-xs text-slate-400">Aucune activité récente.</p>
      ) : (
        <ol className="space-y-3">
          {activites.map((a) => {
            const status = a.last_action?.new_status ?? a.current_status
            return (
              <li key={a.ticket_number} className="flex gap-2.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${STATUS_PASTILLE[status] ?? 'bg-slate-300'}`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-700 leading-snug">
                    <Link to={`/tickets/${a.ticket_number}`} className="font-medium text-slate-800 hover:text-secondary">
                      {a.ticket_number}
                    </Link>{' '}
                    — {STATUS_LABEL[status] ?? status}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatAgo(a.last_action?.changed_at ?? a.updated_at)}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

export default RecentActivityWidget