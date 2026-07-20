import { Link, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { LogOut } from 'lucide-react'
import { logout } from '../../store/authSlice'

// En-tête commun à l'espace client : reprend le bandeau existant de
// ClientDashboardPage, en y ajoutant la navigation entre le tableau de bord
// (nouveau) et la liste des tickets.

const ONGLETS = [
  { to: '/dashboard', label: 'Tableau de bord' },
  { to: '/tickets', label: 'Mes tickets' },
  { to: '/profil', label: 'Mon profil' },
]

function ClientHeader() {
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()
  const { pathname } = useLocation()

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm sm:text-base">ZAY Digital World</p>
          <p className="text-xs text-primary-foreground/70">Portail de support client</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline">{user?.first_name ?? 'Client'}</span>
          <button
            type="button"
            onClick={() => dispatch(logout())}
            className="opacity-80 hover:opacity-100"
            aria-label="Se déconnecter"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <nav className="px-4 sm:px-6 flex gap-1" aria-label="Navigation client">
        {ONGLETS.map((o) => {
          const actif = pathname === o.to || (o.to === '/tickets' && pathname.startsWith('/tickets'))
          return (
            <Link
              key={o.to}
              to={o.to}
              className={`text-sm px-3 py-2 border-b-2 transition-colors ${
                actif
                  ? 'border-white font-medium'
                  : 'border-transparent text-primary-foreground/60 hover:text-primary-foreground'
              }`}
            >
              {o.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}

export default ClientHeader
