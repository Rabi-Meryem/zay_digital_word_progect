import { useEffect, useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  LayoutDashboard, ArrowUpCircle, ArrowLeftRight, Flame,
  Users, FileText, User, LogOut,
} from 'lucide-react'
import { logout } from '../../store/authSlice'
import { initialsFromName } from '../../utils/agentDisplay'
import { fetchEscalations, fetchSupervisorKpis } from '../../api/supervisor'
import { Avatar, COLORS } from '../supervisor/SupervisorUI'

// Layout persistant du portail superviseur — même principe que ClientLayout
// et AgentLayout : sidebar fixe à gauche (jamais masquée en desktop), le
// contenu change à droite via <Outlet />. Toutes les sections, y compris
// « Mon profil », passent par ce layout : la sidebar reste affichée partout.

const NAV = [
  { to: '/supervisor/dashboard', label: "Vue d'ensemble", Icon: LayoutDashboard },
  { to: '/supervisor/escalades', label: 'Escalades', Icon: ArrowUpCircle },
  { to: '/supervisor/affectation', label: 'Affectation des tickets', Icon: ArrowLeftRight },
  { to: '/supervisor/criticite', label: 'Criticité des tickets', Icon: Flame },
  { to: '/supervisor/equipe', label: 'Performance équipe', Icon: Users },
  { to: '/supervisor/rapports', label: 'Rapports', Icon: FileText },
  { to: '/supervisor/profil', label: 'Mon profil', Icon: User },
]

function SupervisorLayout() {
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()

  const [pendingEsc, setPendingEsc] = useState(0)
  const [slaBreached, setSlaBreached] = useState(0)

  const name = user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : ''
  const initials = name ? initialsFromName(name) : '--'

  useEffect(() => {
    fetchEscalations('pending')
      .then((list) => setPendingEsc(list.length))
      .catch(() => setPendingEsc(0))
    fetchSupervisorKpis()
      .then((k) => setSlaBreached(k.slaBreached ?? 0))
      .catch(() => setSlaBreached(0))
  }, [])

  const badgeFor = (to) => {
    if (to === '/supervisor/escalades') return pendingEsc
    if (to === '/supervisor/affectation') return slaBreached
    return 0
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Sidebar — toujours affichée sur desktop, jamais repliée ──────── */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-white border-r border-slate-200 min-h-screen sticky top-0">
        <div className="px-5 py-5 border-b border-slate-100">
          <p className="font-semibold text-primary">ZAY Digital World</p>
          <p className="text-xs text-slate-400">Console Superviseur</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, Icon }) => {
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
                <span className="min-w-0 truncate">{label}</span>
                {badge > 0 && (
                  <span
                    className={`ml-auto text-xs font-semibold text-white rounded-full px-1.5 py-0.5 min-w-5 text-center shrink-0 ${
                      to === '/supervisor/escalades' ? 'bg-danger' : 'bg-accent'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-100 flex items-center gap-2.5">
          <Avatar initials={initials} color={COLORS.primary} size={32} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-700 truncate">{name}</p>
            <p className="text-xs text-slate-400">Superviseur</p>
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
          <p className="text-xs text-primary-foreground/70">Console Superviseur</p>
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
      <div className="flex-1 min-w-0 pt-16 md:pt-0 p-4 sm:p-6">
        <Outlet />
      </div>
    </div>
  )
}

export default SupervisorLayout
