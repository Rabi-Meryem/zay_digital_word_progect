import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { LayoutDashboard, Ticket, User, LogOut } from 'lucide-react'
import { logout } from '../../store/authSlice'
import ClientNotificationsBell from './ClientNotificationsBell'

// Layout persistant du portail client — affichage « site web pour PC » :
// une sidebar fixe à gauche (jamais masquée en desktop), un contenu qui
// change à droite via <Outlet />. Toutes les pages client (dashboard,
// tickets, profil, nouveau ticket) passent par ce layout : la sidebar reste
// affichée quel que soit l'écran visité, et on peut naviguer d'une section
// à l'autre sans jamais la perdre.
//
// Le zoom/scale de la maquette mobile n'est plus utilisé ici : ce layout est
// pensé nativement pour un écran desktop (sidebar fixe, contenu large).

const NAV = [
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/tickets', label: 'Mes tickets', icon: Ticket },
  { to: '/profil', label: 'Mon profil', icon: User },
]

function initials(name) {
  return (name || 'C')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function ClientLayout() {
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const clientName = user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : 'Client'

  const isActive = (to) =>
    pathname === to || (to === '/tickets' && pathname.startsWith('/tickets'))

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Sidebar — toujours affichée sur desktop, jamais repliée ──────── */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-white border-r border-slate-200 min-h-screen sticky top-0">
        <div className="px-5 py-5 border-b border-slate-100">
          <p className="font-semibold text-primary">ZAY Digital World</p>
          <p className="text-xs text-slate-400">Portail de support client</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <button
              key={to}
              type="button"
              onClick={() => navigate(to)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(to)
                  ? 'bg-primary/5 text-primary font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-100 flex items-center gap-2.5">
          <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center shrink-0">
            {initials(clientName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-700 truncate">{clientName || 'Client'}</p>
            <p className="text-xs text-slate-400">Client</p>
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
          <p className="text-xs text-primary-foreground/70">Portail client</p>
        </div>
        <div className="flex items-center gap-3">
          <ClientNotificationsBell variant="dark" />
          <button
            type="button"
            onClick={() => dispatch(logout())}
            className="opacity-80 hover:opacity-100"
            aria-label="Se déconnecter"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ── Zone de contenu ──────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 md:flex md:flex-col">
        {/* Barre supérieure desktop : fil du site + cloche de notifications */}
        <div className="hidden md:flex items-center justify-end px-6 py-3 border-b border-slate-200 bg-white">
          <ClientNotificationsBell />
        </div>

        <main className="flex-1 pt-16 md:pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default ClientLayout
