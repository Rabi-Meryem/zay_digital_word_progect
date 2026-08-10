// Composants partagés par les écrans du portail superviseur.
// Extraits de l'ancien SupervisorDashboardPage monolithique.

export const COLORS = {
  primary: '#1E3A5F', secondary: '#2D6A9F', accent: '#E8A020',
  success: '#27AE60', danger: '#C0392B', slate: '#cbd5e1',
}

export const AI_COLORS = [COLORS.danger, COLORS.accent, COLORS.secondary, COLORS.slate]

export const PRIORITIES = [
  { value: '', label: 'Toutes les priorités' },
  { value: 'CRITICAL', label: 'Critique' },
  { value: 'HIGH', label: 'Haute' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'LOW', label: 'Basse' },
]

export const STATUSES = [
  { value: '', label: 'Tous les statuts' },
  { value: 'OPEN', label: 'Ouvert' },
  { value: 'ASSIGNED', label: 'Affecté' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'WAITING', label: 'En attente' },
  { value: 'ESCALATED', label: 'Escaladé' },
  { value: 'RESOLVED', label: 'Résolu' },
  { value: 'CLOSED', label: 'Clôturé' },
]

export function Avatar({ initials, color, size = 28 }) {
  return (
    <span
      className="rounded-full text-white font-semibold flex items-center justify-center shrink-0"
      style={{ background: color, height: size, width: size, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  )
}

export function Stars({ value }) {
  const full = Math.round(value)
  return (
    <span className="text-accent tracking-wide text-sm" aria-label={`${value} sur 5`}>
      {'\u2605'.repeat(full)}
      <span className="text-slate-300">{'\u2605'.repeat(5 - full)}</span>
      <span className="text-slate-400 text-xs ml-1">{value.toFixed(1)}</span>
    </span>
  )
}

export function TopBar({ title, desc, children }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        {desc && <p className="text-sm text-slate-500 mt-0.5">{desc}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  )
}

// Carte KPI en dégradé vif — même principe que le portail client.
export function Kpi({ label, value, degrade = 'from-slate-400 to-slate-500', alerte = false }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl p-4 text-white shadow-sm bg-gradient-to-br ${degrade} ${
        alerte ? 'ring-2 ring-white/50' : ''
      }`}
    >
      <span
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/15"
        aria-hidden="true"
      />
      <p className="relative text-xs font-semibold text-white/90 leading-tight">{label}</p>
      <p className="relative text-3xl font-bold tracking-tight mt-1 drop-shadow-sm">{value}</p>
    </div>
  )
}

export function Card({ title, hint, right, children, className = '' }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 ${className}`}>
      {(title || right) && (
        <div className="flex items-start justify-between mb-3">
          <div>
            {title && <p className="text-sm font-semibold text-slate-700">{title}</p>}
            {hint && <p className="text-xs text-slate-400">{hint}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  )
}

export function MiniStat({ Icon, tint, value, label, valueColor }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex items-center gap-3">
      <span
        className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: tint.bg, color: tint.fg }}
      >
        <Icon size={20} />
      </span>
      <div>
        <p className="text-xl font-bold leading-none" style={{ color: valueColor }}>{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// Jauge semi-circulaire (SVG) — 0 à 100.
export function Gauge({ value }) {
  const r = 64, cx = 80, cy = 88
  const a = Math.PI * (1 - value / 100)
  const x = cx + r * Math.cos(a), y = cy - r * Math.sin(a)
  return (
    <svg viewBox="0 0 160 100" width="160" height="100">
      <path d={`M16 ${cy} A${r} ${r} 0 0 1 144 ${cy}`} fill="none" stroke="#f1f5f9" strokeWidth="14" strokeLinecap="round" />
      <path d={`M16 ${cy} A${r} ${r} 0 0 1 ${x} ${y}`} fill="none" stroke={COLORS.success} strokeWidth="14" strokeLinecap="round" />
      <text x="80" y="76" fontSize="26" fontWeight="700" fill="#1e293b" textAnchor="middle">{value}%</text>
      <text x="80" y="90" fontSize="9" fill="#94a3b8" textAnchor="middle">objectif : 90%</text>
    </svg>
  )
}
