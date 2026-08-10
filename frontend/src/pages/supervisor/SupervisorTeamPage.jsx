import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Users, CheckCircle2, Download } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { fetchAgentsPerformance } from '../../api/supervisor'
import { downloadReport } from '../../api/reports'
import { agentColor } from '../../utils/agentDisplay'
import SupervisorNotificationsBell from '../../components/layout/SupervisorNotificationsBell'
import { TopBar, Card, MiniStat, Avatar, Stars, COLORS } from '../../components/supervisor/SupervisorUI'

function SupervisorTeamPage() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAgentsPerformance()
      .then(setAgents)
      .catch(() => toast.error("Impossible de charger la performance équipe."))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 text-slate-400 text-sm">Chargement...</div>

  const chargeData = agents.map((a) => ({ name: a.initials, load: a.activeLoad }))
  const avgSat = agents.length
    ? (agents.reduce((s, a) => s + a.satisfaction, 0) / agents.length).toFixed(1)
    : '0.0'

  return (
    <>
      <TopBar title="Performance de l'équipe" desc="Charge, délais et satisfaction par agent · 30 derniers jours">
        <button
          type="button"
          onClick={async () => {
            try {
              await downloadReport('pdf', { section: 'team' })
              toast.success('Export généré.')
            } catch {
              toast.error("Échec de l'export.")
            }
          }}
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-2 hover:bg-slate-50"
        >
          <Download size={14} /> Exporter
        </button>
        <SupervisorNotificationsBell />
      </TopBar>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <MiniStat
          Icon={Users}
          tint={{ bg: 'rgba(45,106,159,.10)', fg: COLORS.secondary }}
          value={agents.length}
          valueColor="#1e293b"
          label="Agents actifs"
        />
        <MiniStat
          Icon={CheckCircle2}
          tint={{ bg: 'rgba(39,174,96,.12)', fg: COLORS.success }}
          value={`${avgSat}/5`}
          valueColor="#1e293b"
          label="Satisfaction moyenne"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card title="Charge actuelle" hint="tickets actifs par agent" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chargeData} margin={{ top: 15, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="load" radius={[5, 5, 0, 0]}>
                {chargeData.map((d, i) => (
                  <Cell key={i} fill={d.load >= 14 ? COLORS.accent : COLORS.secondary} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Traités</th>
                  <th className="px-4 py-3">Tps moyen</th>
                  <th className="px-4 py-3 w-1/5">Conformité SLA</th>
                  <th className="px-4 py-3">Satisfaction</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.agent_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2.5">
                        <Avatar initials={a.initials} color={agentColor(a.agent_id)} size={30} />
                        <span className="block text-sm font-semibold text-slate-800">{a.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{a.handled}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{a.avgResolution}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${a.slaCompliance}%`,
                              background: a.slaCompliance >= 90 ? COLORS.success : COLORS.accent,
                            }}
                          />
                        </span>
                        <span className="text-xs font-semibold text-slate-600">{a.slaCompliance}%</span>
                      </span>
                    </td>
                    <td className="px-4 py-3"><Stars value={a.satisfaction} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export default SupervisorTeamPage
