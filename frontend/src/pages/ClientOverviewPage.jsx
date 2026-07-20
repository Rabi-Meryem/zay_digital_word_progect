import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import ClientHeader from '../components/layout/ClientHeader'
import KpiRow from '../components/dashboard/KpiRow'
import VolumeChart from '../components/dashboard/VolumeChart'
import SatisfactionGauge from '../components/dashboard/SatisfactionGauge'
import PriorityTicketsWidget from '../components/dashboard/PriorityTicketsWidget'
import RecentActivityWidget from '../components/dashboard/RecentActivityWidget'
import ReportExport from '../components/dashboard/ReportExport'
import NotificationCenter from '../components/dashboard/NotificationCenter'
import { MOCK_TICKETS } from '../data/mockTickets'

// Tableau de bord client 360° — nouvelle page d'accueil de l'espace client (/dashboard).
//
// Structure retenue :
//   Ligne 1 : les 6 KPI essentiels
//   Ligne 2 : évolution des tickets       | qualité du support (satisfaction)
//   Ligne 3 : mes tickets prioritaires    | activités récentes
//   Ligne 4 : export de rapports          | centre de notifications
//
// ⚠️ S'appuie sur MOCK_TICKETS (voir mockTickets.js) — à remplacer par
// GET /api/tickets/?client=me dès que la route existera.

function ClientOverviewPage() {
  const tickets = MOCK_TICKETS

  return (
    <div className="min-h-screen bg-slate-50">
      <ClientHeader />

      <main className="max-w-6xl mx-auto px-4 py-5 space-y-4">
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

        {/* Ligne 1 — KPI */}
        <KpiRow tickets={tickets} />

        {/* Ligne 2 — évolution + satisfaction */}
        <div className="grid lg:grid-cols-2 gap-4">
          <VolumeChart tickets={tickets} />
          <SatisfactionGauge tickets={tickets} />
        </div>

        {/* Ligne 3 — prioritaires + activités */}
        <div className="grid lg:grid-cols-2 gap-4">
          <PriorityTicketsWidget tickets={tickets} />
          <RecentActivityWidget />
        </div>

        {/* Ligne 4 — rapports + notifications */}
        <div className="grid lg:grid-cols-2 gap-4 pb-6">
          <ReportExport />
          <NotificationCenter />
        </div>
      </main>
    </div>
  )
}

export default ClientOverviewPage
