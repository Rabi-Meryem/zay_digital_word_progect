import { useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Search, LogOut } from 'lucide-react'
import TicketCard from '../components/tickets/TicketCard'
import { MOCK_TICKETS } from '../data/mockTickets'
import { logout } from '../store/authSlice'

// ⚠️ Utilise des données de démonstration (src/data/mockTickets.js) en l'absence
// d'API tickets côté backend pour le moment. À remplacer par un appel réel
// (ex: GET /api/tickets/) dès que la route existera — voir src/api/authService.js
// pour le même principe déjà appliqué à la connexion.

const OPEN_STATUSES = ['OPEN', 'ASSIGNED']
const PROGRESS_STATUSES = ['IN_PROGRESS', 'WAITING', 'ESCALATED', 'REOPENED']
const RESOLVED_STATUSES = ['RESOLVED', 'CLOSED']

const FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'open', label: 'Ouverts' },
  { key: 'progress', label: 'En cours' },
  { key: 'resolved', label: 'Résolus' },
]

function matchesFilter(ticket, filterKey) {
  if (filterKey === 'all') return true
  if (filterKey === 'open') return OPEN_STATUSES.includes(ticket.current_status)
  if (filterKey === 'progress') return PROGRESS_STATUSES.includes(ticket.current_status)
  if (filterKey === 'resolved') return RESOLVED_STATUSES.includes(ticket.current_status)
  return true
}

function ClientDashboardPage() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()

  const counts = useMemo(
    () => ({
      all: MOCK_TICKETS.length,
      open: MOCK_TICKETS.filter((t) => matchesFilter(t, 'open')).length,
      progress: MOCK_TICKETS.filter((t) => matchesFilter(t, 'progress')).length,
      resolved: MOCK_TICKETS.filter((t) => matchesFilter(t, 'resolved')).length,
    }),
    []
  )

  const visibleTickets = useMemo(() => {
    const term = search.trim().toLowerCase()
    return MOCK_TICKETS.filter((t) => matchesFilter(t, activeFilter)).filter((t) =>
      term ? t.title.toLowerCase().includes(term) : true
    )
  }, [activeFilter, search])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-primary text-primary-foreground px-4 sm:px-6 py-4 flex items-center justify-between">
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
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-slate-800">Mes tickets</h1>
          <span className="text-sm text-slate-400">{MOCK_TICKETS.length} tickets</span>
        </div>

        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un ticket..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-secondary/40"
          />
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveFilter(f.key)}
              className={`text-sm px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                activeFilter === f.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>

        <div className="space-y-3 pb-6">
          {visibleTickets.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">
              Aucun ticket ne correspond à ta recherche.
            </p>
          ) : (
            visibleTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
          )}
        </div>
      </main>
    </div>
  )
}

export default ClientDashboardPage
