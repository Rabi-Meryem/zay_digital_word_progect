import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, CheckCircle2, Clock, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchMyStats } from '../../api/tickets'

// « Mon évolution » — statistiques personnelles de l'agent.
// Branché sur GET /api/agents/me/stats/?months=6

function AgentStatsPanel() {
  const [monthly, setMonthly] = useState([])
  const [totals, setTotals] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyStats(6)
      .then((data) => {
        setMonthly(data.monthly)
        setTotals(data.totals)
      })
      .catch(() => toast.error("Impossible de charger vos statistiques."))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 text-slate-400 text-sm">Chargement...</div>
  if (!totals) return <div className="p-6 text-slate-400 text-sm">Aucune donnée disponible.</div>

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={CheckCircle2}
          label="Résolus (6 mois)"
          value={totals.totalResolved}
          gradient="from-sky-500 to-blue-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Résolus ce mois"
          value={totals.lastResolved}
          gradient="from-indigo-500 to-violet-600"
        />
        <StatCard
          icon={Clock}
          label="Délai moyen"
          value={`${totals.lastAvg} h`}
          gradient="from-orange-400 to-amber-500"
        />
        <StatCard
          icon={Star}
          label="Satisfaction"
          value={`${totals.lastSat}/5`}
          gradient="from-emerald-400 to-teal-500"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Tickets résolus par mois</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthly} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <Tooltip />
            <Line type="monotone" dataKey="resolved" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Délai moyen de résolution (heures)</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthly} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <Tooltip />
            <Line type="monotone" dataKey="avg_hours" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl px-4 py-3.5 text-white shadow-sm`}>
      <div className="flex items-center justify-between">
        <Icon size={18} className="text-white/80" />
      </div>
      <p className="text-2xl font-bold mt-1.5">{value}</p>
      <p className="text-xs text-white/80 mt-0.5">{label}</p>
    </div>
  )
}

export default AgentStatsPanel