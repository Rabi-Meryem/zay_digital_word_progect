import { statsMoisEnCours } from '../../utils/clientKpis'

// Ligne 2 (droite) : taux de satisfaction + bloc "Qualité du support ce mois-ci".

function SatisfactionGauge({ tickets = [] }) {
  const stats = statsMoisEnCours(tickets)
  const note = stats.satisfaction

  const R = 40
  const C = 2 * Math.PI * R
  const offset = C * (1 - (note == null ? 0 : note / 5))
  const couleur = note == null ? '#cbd5e1' : note >= 4.5 ? '#27AE60' : note >= 3.5 ? '#E67E22' : '#C0392B'

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-800 mb-3">Qualité du support ce mois-ci</h2>

      <div className="flex items-center gap-5">
        <svg
          viewBox="0 0 100 100"
          className="w-24 h-24 shrink-0"
          role="img"
          aria-label={`Satisfaction moyenne : ${note ?? 'non disponible'} sur 5`}
        >
          <g transform="rotate(-90 50 50)">
            <circle cx="50" cy="50" r={R} fill="none" stroke="#f1f5f9" strokeWidth="9" />
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={couleur}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
            />
          </g>
          <text x="50" y="49" textAnchor="middle" fontSize="19" fontWeight="600" fill="#1e293b">
            {note == null ? '—' : note}
          </text>
          <text x="50" y="62" textAnchor="middle" fontSize="9" fill="#94a3b8">
            / 5
          </text>
        </svg>

        <dl className="flex-1 space-y-1.5 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Tickets créés</dt>
            <dd className="font-medium text-slate-800">{stats.crees}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Tickets résolus</dt>
            <dd className="font-medium text-slate-800">{stats.resolus}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Respect du SLA</dt>
            <dd className="font-medium text-slate-800">
              {stats.respectSla == null ? '—' : `${stats.respectSla} %`}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Temps moyen de résolution</dt>
            <dd className="font-medium text-slate-800">{stats.tempsMoyen}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

export default SatisfactionGauge
