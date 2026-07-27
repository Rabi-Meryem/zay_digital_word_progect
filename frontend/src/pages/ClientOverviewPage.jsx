import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import KpiRow from '../components/dashboard/KpiRow'
import VolumeChart from '../components/dashboard/VolumeChart'
import SatisfactionGauge from '../components/dashboard/SatisfactionGauge'
import PriorityTicketsWidget from '../components/dashboard/PriorityTicketsWidget'
import RecentActivityWidget from '../components/dashboard/RecentActivityWidget'
import ReportExport from '../components/dashboard/ReportExport'
import NotificationCenter from '../components/dashboard/NotificationCenter'
import { fetchTickets } from '../api/tickets'

// Rendue à l'intérieur de ClientLayout (sidebar persistante) — pas de header
// propre ici, ClientLayout gère déjà le logo, la cloche et la déconnexion.

function ClientOverviewPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await fetchTickets({ page_size: 100 })
        setTickets(data.results ?? [])
      } catch (error) {
        toast.error(
          error.response?.data?.detail || "Impossible de charger le tableau de bord."
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        Chargement...
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Tableau de bord</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Vue d'ensemble de vos demandes et de la qualité du support
          </p>
        </div>
        <Link
          to="/tickets/nouveau"
          className="flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg px-3 py-2 hover:opacity-90"
        >
          <Plus size={15} />
          Nouveau ticket
        </Link>
      </div>

      <KpiRow tickets={tickets} />

      <div className="grid lg:grid-cols-2 gap-4">
        <VolumeChart tickets={tickets} />
        <SatisfactionGauge tickets={tickets} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <PriorityTicketsWidget tickets={tickets} />
        <RecentActivityWidget />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 pb-6">
        <ReportExport />
        <NotificationCenter />
      </div>
    </div>
  )
}

export default ClientOverviewPage