import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Clock } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import {
  fetchSupervisorKpis, fetchSupervisorVolume,
  fetchStatusDistribution, fetchAiClassification,
} from '../../api/supervisor'
import SupervisorNotificationsBell from '../../components/layout/SupervisorNotificationsBell'
import { TopBar, Kpi, Card, Gauge, COLORS, AI_COLORS } from '../../components/supervisor/SupervisorUI'

// Module IA pas encore actif — reste en données de démonstration.
const MOCK_AI_CONF = [
  { label: 'Classification Critique', value: 96 },
  { label: 'Classification Haute', value: 89 },
  { label: 'Classification Moyenne', value: 85 },
  { label: 'Classification Basse', value: 91 },
]
const MOCK_AI_CONF_AVG = 90.3

function SupervisorOverviewPage() {
  const [k, setK] = useState(null)
  const [volume, setVolume] = useState([])
  const [statusDist, setStatusDist] = useState([])
  const [aiClass, setAiClass] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      fetchSupervisorKpis(), fetchSupervisorVolume(),
      fetchStatusDistribution(), fetchAiClassification(),
    ])
      .then(([kpis, vol, dist, ai]) => {
        if (!mounted) return
        setK(kpis); setVolume(vol); setStatusDist(dist); setAiClass(ai)
      })
      .catch(() => toast.error("Impossible de charger la vue d'ensemble."))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  if (loading || !k) return <div className="p-6 text-slate-400 text-sm">Chargement...</div>

  return (
    <>
      <TopBar title="Vue d'ensemble" desc="Indicateurs de performance de la plateforme">
        <SupervisorNotificationsBell />
      </TopBar>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        <Kpi label="Total tickets" value={(k.total ?? 0).toLocaleString('fr-FR')} degrade="from-blue-500 to-indigo-600" />
        <Kpi label="Ouverts" value={k.open ?? 0} degrade="from-cyan-400 to-sky-600" />
        <Kpi label="En cours" value={k.inProgress ?? 0} degrade="from-violet-500 to-purple-600" />
        <Kpi label="Résolus" value={k.resolved ?? 0} degrade="from-emerald-400 to-teal-600" />
        <Kpi
          label="Critiques actifs"
          value={k.criticalActive ?? 0}
          degrade={k.criticalActive > 0 ? 'from-rose-500 to-red-600' : 'from-slate-400 to-slate-500'}
          alerte={k.criticalActive > 0}
        />
        <Kpi
          label="SLA non respecté"
          value={k.slaBreached ?? 0}
          degrade={k.slaBreached > 0 ? 'from-amber-400 to-orange-500' : 'from-emerald-400 to-teal-600'}
          alerte={k.slaBreached > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card title="Volume de tickets" hint="7 derniers jours · créés vs résolus">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={volume} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="crees" name="Créés" stroke={COLORS.secondary} strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="resolus" name="Résolus" stroke={COLORS.success} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-sm inline-block" style={{ background: COLORS.secondary }} />Créés
            </span>
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-sm inline-block" style={{ background: COLORS.success }} />Résolus
            </span>
          </div>
        </Card>

        <Card title="Répartition par statut" hint="tickets actifs">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusDist} margin={{ top: 15, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                <Cell fill="#94a3b8" /><Cell fill={COLORS.secondary} /><Cell fill={COLORS.success} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Classification IA" hint="par criticité">
          {aiClass.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              Module IA pas encore actif — aucune classification disponible.
            </p>
          ) : (
            <div className="flex items-center gap-3">
              <ResponsiveContainer width="55%" height={160}>
                <PieChart>
                  <Pie data={aiClass} dataKey="value" nameKey="name" innerRadius={40} outerRadius={62} paddingAngle={2} stroke="none">
                    {aiClass.map((e, i) => <Cell key={i} fill={AI_COLORS[i % AI_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 text-xs text-slate-600">
                {aiClass.map((e, i) => (
                  <div key={e.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: AI_COLORS[i % AI_COLORS.length] }} />
                    {e.name}<span className="ml-auto font-semibold text-slate-700">{e.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Conformité SLA">
          <div className="flex items-center gap-6">
            <Gauge value={k.slaCompliance ?? 0} />
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-danger">{k.slaBreached ?? 0}</p>
                  <p className="text-xs text-slate-400">en dépassement</p>
                </div>
                <Clock size={24} className="text-danger" />
              </div>
            </div>
          </div>
        </Card>

        {/* Reste en données de démonstration — module IA non branché */}
        <Card
          title="Insights IA"
          hint="fiabilité du module de classification (données démo)"
          right={<span className="text-xs font-semibold px-2 py-0.5 rounded bg-secondary/10 text-secondary">Mistral 7B · fallback</span>}
        >
          {MOCK_AI_CONF.map((r) => (
            <div key={r.label} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0">
              <span className="text-slate-600">{r.label}</span>
              <span className="font-semibold text-slate-700">{r.value}%</span>
            </div>
          ))}
          <div className="mt-3 bg-slate-50 rounded-lg px-3 py-2.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Score de confiance moyen</span>
              <span className="font-bold text-success">{MOCK_AI_CONF_AVG}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-success rounded-full" style={{ width: `${MOCK_AI_CONF_AVG}%` }} />
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}

export default SupervisorOverviewPage
