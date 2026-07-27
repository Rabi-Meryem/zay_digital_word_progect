import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Ticket, MessageSquare, LineChart, User, LogOut } from 'lucide-react'
import { logout } from '../../store/authSlice'
import { MOCK_AGENT_TICKETS } from '../../data/mockAgentTickets'

// Layout persistant du portail agent — même principe que ClientLayout :
// une sidebar fixe à gauche (jamais masquée en desktop), le contenu change
// à droite via <Outlet />. Toutes les pages agent (mes tickets, messages,
// mon évolution, mon profil, détail d'un ticket) passent par ce layout :
// la sidebar reste affichée quel que soit l'écran visité.

const RESOLVED_STATUSES = ['RESOLVED', 'CLOSED']

const NAV = [
  { to: '/agent/dashboard', label: 'Mes tickets', icon: Ticket },
  { to: '/agent/messages', label: 'Messages', icon: MessageSquare },
  { to: '/agent/stats', label: 'Mon évolution', icon: LineChart },
  { to: '/agent/profil', label: 'Mon profil', icon: User },
]

function initials(name) {
  return (name || 'A')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function AgentLayout() {
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const agentName = user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : 'Ahmed Karimi'

  const activeTickets = MOCK_AGENT_TICKETS.filter((t) => !RESOLVED_STATUSES.includes(t.current_status))
  const criticalCount = activeTickets.filter((t) => t.priority === 'CRITICAL').length
  const unreadTotal = activeTickets.reduce((sum, t) => sum + (t.unread_messages ?? 0), 0)

  const badgeFor = (to) => {
    if (to === '/agent/dashboard') return criticalCount
    if (to === '/agent/messages') return unreadTotal
    return 0
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Sidebar — toujours affichée sur desktop, jamais repliée ──────── */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-white border-r border-slate-200 min-h-screen sticky top-0">
        <div className="px-5 py-5 border-b border-slate-100">
          <p className="font-semibold text-primary">ZAY Digital World</p>
          <p className="text-xs text-slate-400">Console Agent</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const badge = badgeFor(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/5 text-primary font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <Icon size={16} />
                {label}
                {badge > 0 && (
                  <span className="ml-auto text-xs font-semibold bg-danger text-white rounded-full px-1.5 py-0.5 min-w-5 text-center">
                    {badge}
                  </span>
                )}
              </NavLink>
            )
          })}
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

      {/* ── En-tête mobile compact (repli uniquement en dessous de md) ──── */}
      <header className="md:hidden bg-primary text-primary-foreground px-4 py-4 flex items-center justify-between fixed top-0 inset-x-0 z-20">
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

      {/* ── Zone de contenu — pleine largeur desktop ────────────────────── */}
      <div className="flex-1 min-w-0 pt-16 md:pt-0">
        <Outlet />
      </div>
    </div>
  )
}

export default AgentLayout
