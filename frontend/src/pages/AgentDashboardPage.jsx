import { useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Ticket, MessageSquare, LogOut, User, LineChart } from 'lucide-react'
import AgentTicketCard from '../components/agent/AgentTicketCard'
import NotificationsPanel from '../components/agent/NotificationsPanel'
import { MOCK_AGENT_TICKETS } from '../data/mockAgentTickets'
import { logout } from '../store/authSlice'

// Console Agent — Écran 2.1 : « Dashboard des Assignations & Files d'Attente
// Urgent SLA ». Vue frontend seule : les données viennent de mockAgentTickets.js
// (à remplacer par GET /api/tickets/?assigned_to=me quand la route existera).

const RESOLVED_STATUSES = ['RESOLVED', 'CLOSED']
const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

// Un compteur par priorité — mêmes couleurs que PriorityBadge pour la cohérence.
const COUNTERS = [
  { key: 'CRITICAL', label: 'Critiques', className: 'text-danger' },
  { key: 'HIGH', label: 'Hautes', className: 'text-accent' },
  { key: 'MEDIUM', label: 'Moyennes', className: 'text-secondary' },
  { key: 'LOW', label: 'Basses', className: 'text-slate-500' },
]

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function AgentDashboardPage() {
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // En mode VITE_SKIP_AUTH (aucune connexion), on affiche l'agent de la maquette.
  const agentName = user ? `${user.first_name} ${user.last_name ?? ''}`.trim() : 'Ahmed Karimi'

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
    <div className="min-h-screen bg-slate-50 md:flex">
      {/* ── Barre latérale (masquée sur mobile) ─────────────────────────── */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 bg-white border-r border-slate-200 min-h-screen sticky top-0">
        <div className="px-5 py-5 border-b border-slate-100">
          <p className="font-semibold text-primary">ZAY Digital World</p>
          <p className="text-xs text-slate-400">Console Agent</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            type="button"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary/5 text-primary"
          >
            <Ticket size={16} />
            Mes tickets
            {countsByPriority.CRITICAL > 0 && (
              <span className="ml-auto text-xs font-semibold bg-danger text-white rounded-full px-1.5 py-0.5 min-w-5 text-center">
                {countsByPriority.CRITICAL}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/agent/messages')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
          >
            <MessageSquare size={16} />
            Messages
            {unreadTotal > 0 && (
              <span className="ml-auto text-xs font-semibold bg-secondary text-white rounded-full px-1.5 py-0.5 min-w-5 text-center">
                {unreadTotal}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/agent/stats')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
          >
            <LineChart size={16} />
            Mon évolution
          </button>
          <button
            type="button"
            onClick={() => navigate('/agent/profil')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
          >
            <User size={16} />
            Mon profil
          </button>
        </nav>

        <div className="px-4 py-4 border-t border-slate-100 flex items-center gap-2.5">
          <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center shrink-0">
            {initials(agentName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-700 truncate">{agentName}</p>
            <p className="text-xs text-slate-400">Agent support</p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(logout())}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Se déconnecter"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ── En-tête compact (mobile uniquement) ─────────────────────────── */}
      <header className="md:hidden bg-primary text-primary-foreground px-4 py-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">ZAY Digital World</p>
          <p className="text-xs text-primary-foreground/70">Console Agent</p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(logout())}
          className="opacity-80 hover:opacity-100"
          aria-label="Se déconnecter"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* ── Contenu principal ───────────────────────────────────────────── */}
      <main className="flex-1 p-4 sm:p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-slate-800">Mes tickets assignés</h1>
          <NotificationsPanel />
        </div>

        {/* Compteurs dynamiques par priorité */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {COUNTERS.map((c) => (
            <div
              key={c.key}
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-center"
            >
              <p className={`text-2xl font-bold ${c.className}`}>
                {countsByPriority[c.key]}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* File d'attente urgente */}
        <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
          Tickets urgents — par priorité SLA
        </p>
        <div className="space-y-3 pb-6">
          {urgentTickets.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">
              Aucun ticket urgent. 🎉
            </p>
          ) : (
            urgentTickets.map((ticket) => (
              <AgentTicketCard key={ticket.id} ticket={ticket} />
            ))
          )}
          {countsByPriority.LOW > 0 && (
            <p className="text-center text-xs text-slate-400 pt-1">
              + {countsByPriority.LOW} tickets Basse priorité hors file urgente
            </p>
          )}
        </div>
      </main>
    </div>
  )
}

export default AgentDashboardPage
