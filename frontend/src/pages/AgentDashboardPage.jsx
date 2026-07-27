import { useMemo } from 'react'
import AgentTicketCard from '../components/agent/AgentTicketCard'
import NotificationsPanel from '../components/agent/NotificationsPanel'
import { MOCK_AGENT_TICKETS } from '../data/mockAgentTickets'

// Console Agent — Écran 2.1 : « Dashboard des Assignations & Files d'Attente
// Urgent SLA ». Vue frontend seule : les données viennent de mockAgentTickets.js
// (à remplacer par GET /api/tickets/?assigned_to=me quand la route existera).
// Rendue à l'intérieur d'AgentLayout (sidebar persistante fournie par le layout).

const RESOLVED_STATUSES = ['RESOLVED', 'CLOSED']
const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

// Un compteur par priorité — couleurs vives pour distinguer chaque niveau
// d'un coup d'œil (fond dégradé plein, pas juste un texte coloré).
const COUNTERS = [
  { key: 'CRITICAL', label: 'Critiques', gradient: 'from-rose-500 to-red-600' },
  { key: 'HIGH', label: 'Hautes', gradient: 'from-orange-400 to-amber-500' },
  { key: 'MEDIUM', label: 'Moyennes', gradient: 'from-sky-500 to-blue-600' },
  { key: 'LOW', label: 'Basses', gradient: 'from-slate-400 to-slate-500' },
]

function AgentDashboardPage() {
  const activeTickets = useMemo(
    () => MOCK_AGENT_TICKETS.filter((t) => !RESOLVED_STATUSES.includes(t.current_status)),
    []
  )

  // Compteurs CALCULÉS depuis les données (jamais codés en dur).
  const countsByPriority = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
    activeTickets.forEach((t) => {
      counts[t.priority] += 1
    })
    return counts
  }, [activeTickets])

  const unreadTotal = useMemo(
    () => activeTickets.reduce((sum, t) => sum + (t.unread_messages ?? 0), 0),
    [activeTickets]
  )

  // File d'attente urgente : Critique > Haute > Moyenne, puis, à priorité
  // égale, l'échéance SLA la plus proche d'abord (« PAR PRIORITÉ SLA »).
  const urgentTickets = useMemo(
    () =>
      activeTickets
        .filter((t) => t.priority !== 'LOW')
        .sort(
          (a, b) =>
            PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
            new Date(a.sla_deadline) - new Date(b.sla_deadline)
        ),
    [activeTickets]
  )

  return (
    <main className="p-4 sm:p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-slate-800">Mes tickets assignés</h1>
        <NotificationsPanel />
      </div>

      {/* Compteurs dynamiques par priorité */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {COUNTERS.map((c) => (
          <div
            key={c.key}
            className={`bg-gradient-to-br ${c.gradient} rounded-xl px-4 py-3.5 text-center text-white shadow-sm`}
          >
            <p className="text-2xl font-bold">{countsByPriority[c.key]}</p>
            <p className="text-xs text-white/80 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* File d'attente urgente */}
      <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
        Tickets urgents — par priorité SLA
      </p>
      {urgentTickets.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-10">
          Aucun ticket urgent. 🎉
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pb-2">
          {urgentTickets.map((ticket) => (
            <AgentTicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
      {countsByPriority.LOW > 0 && (
        <p className="text-center text-xs text-slate-400 pt-1 pb-6">
          + {countsByPriority.LOW} tickets Basse priorité hors file urgente
        </p>
      )}
    </main>
  )
}

export default AgentDashboardPage
