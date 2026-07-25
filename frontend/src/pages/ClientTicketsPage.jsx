import { useEffect, useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Search, Plus, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import TicketCard from '../components/tickets/TicketCard'
import { fetchTickets } from '../api/tickets'
import { logout } from '../store/authSlice'

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
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const data = await fetchTickets()
      setTickets(data.results ?? [])
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Impossible de charger les tickets."
      )
    } finally {
      setLoading(false)
    }
  }

  const counts = useMemo(
    () => ({
      all: tickets.length,
      open: tickets.filter((t) => matchesFilter(t, 'open')).length,
      progress: tickets.filter((t) => matchesFilter(t, 'progress')).length,
      resolved: tickets.filter((t) => matchesFilter(t, 'resolved')).length,
    }),
    [tickets]
  )

  const visibleTickets = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tickets.filter((t) => matchesFilter(t, activeFilter)).filter((t) =>
      term ? t.title.toLowerCase().includes(term) : true
    )
  }, [tickets, activeFilter, search])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Chargement...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h1 className="text-lg font-semibold text-slate-800">Mes tickets</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{tickets.length} tickets</span>
            <Link
              to="/tickets/nouveau"
              className="flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:opacity-90"
            >
              <Plus size={15} />
              Nouveau
            </Link>
            <button
              type="button"
              onClick={() => dispatch(logout())}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Se déconnecter"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un ticket..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-secondary/40"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pb-6">
          {visibleTickets.length === 0 ? (
            <p className="col-span-full text-center text-sm text-slate-400 py-10">
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