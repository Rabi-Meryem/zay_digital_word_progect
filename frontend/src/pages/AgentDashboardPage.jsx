import { useEffect, useMemo, useState } from 'react'
import AgentTicketCard from '../components/agent/AgentTicketCard'
import NotificationsPanel from '../components/agent/NotificationsPanel'
import { fetchTickets } from '../api/tickets'
import toast from 'react-hot-toast'

// Console Agent — Écran 2.1 : « Dashboard des Assignations & Files d'Attente
// Urgent SLA ». Rendue à l'intérieur d'AgentLayout (sidebar persistante).

const RESOLVED_STATUSES = ['RESOLVED', 'CLOSED']
const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

const COUNTERS = [
  { key: 'CRITICAL', label: 'Critiques', gradient: 'from-rose-500 to-red-600' },
  { key: 'HIGH', label: 'Hautes', gradient: 'from-orange-400 to-amber-500' },
  { key: 'MEDIUM', label: 'Moyennes', gradient: 'from-sky-500 to-blue-600' },
  { key: 'LOW', label: 'Basses', gradient: 'from-slate-400 to-slate-500' },
]

function AgentDashboardPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const data = await fetchTickets()
      setTickets(data.results ?? data)
    } catch (error) {
      toast.error(error.response?.data?.detail || "Impossible de charger les tickets.")
    } finally {
      setLoading(false)
    }
  }

  const activeTickets = useMemo(
    () => tickets.filter((t) => !RESOLVED_STATUSES.includes(t.current_status)),
    [tickets]
  )

  // Tickets résolus/clôturés : gardés visibles côté agent, triés du plus
  // récemment résolu au plus ancien.
  const resolvedTickets = useMemo(
    () =>
      tickets
        .filter((t) => RESOLVED_STATUSES.includes(t.current_status))
        .sort((a, b) => new Date(b.resolved_at ?? b.updated_at) - new Date(a.resolved_at ?? a.updated_at)),
    [tickets]
  )

  const countsByPriority = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
    activeTickets.forEach((t) => { counts[t.priority] += 1 })
    return counts
  }, [activeTickets])

  // Tous les tickets actifs (toutes priorités confondues), triés par
  // priorité puis par échéance SLA la plus proche.
  const sortedActiveTickets = useMemo(
    () =>
      [...activeTickets].sort(
        (a, b) =>
          PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
          new Date(a.sla_deadline) - new Date(b.sla_deadline)
      ),
    [activeTickets]
  )

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  }

  return (
    <main className="p-4 sm:p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-slate-800">Mes tickets assignés</h1>
        <NotificationsPanel />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {COUNTERS.map((c) => (
          <div key={c.key} className={`bg-gradient-to-br ${c.gradient} rounded-xl px-4 py-3.5 text-center text-white shadow-sm`}>
            <p className="text-2xl font-bold">{countsByPriority[c.key]}</p>
            <p className="text-xs text-white/80 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
        Tickets en cours — par priorité SLA
      </p>
      {sortedActiveTickets.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-10">Aucun ticket en cours. 🎉</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pb-6">
          {sortedActiveTickets.map((ticket) => (
            <AgentTicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}

      {resolvedTickets.length > 0 && (
        <>
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3 mt-4">
            Tickets résolus ({resolvedTickets.length})
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pb-6">
            {resolvedTickets.map((ticket) => (
              <AgentTicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </>
      )}
    </main>
  )
}

export default AgentDashboardPage