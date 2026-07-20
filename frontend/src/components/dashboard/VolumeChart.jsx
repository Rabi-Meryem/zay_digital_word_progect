import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { volumeParMois } from '../../utils/clientKpis'

// Ligne 2 (gauche) : évolution des tickets créés vs résolus sur 6 mois.
// recharts est déjà une dépendance du projet (voir package.json).

function VolumeChart({ tickets = [] }) {
  const data = volumeParMois(tickets, 6).map((m) => ({
    mois: m.label,
    Créés: m.crees,
    Résolus: m.resolus,
  }))

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-800 mb-3">Évolution de vos tickets</h2>

      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              labelStyle={{ color: '#1e293b', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="plainline" />
            <Line type="monotone" dataKey="Créés" stroke="#2D6A9F" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Résolus" stroke="#27AE60" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default VolumeChart
