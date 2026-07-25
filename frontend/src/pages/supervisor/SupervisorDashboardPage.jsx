import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, ArrowUpCircle, AlarmClock, Users, FileText,
  Bell, LogOut, Download, ArrowLeftRight, Clock, AlertTriangle,
  CheckCircle2, User, X, Check,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import PriorityBadge from '../../components/tickets/PriorityBadge'
import StatusBadge from '../../components/tickets/StatusBadge'
import SlaBar from '../../components/tickets/SlaBar'
import { getSlaInfo } from '../../utils/sla'
import { agentColor, initialsFromName } from '../../utils/agentDisplay'
import { logout } from '../../store/authSlice'
import {
  fetchSupervisorKpis, fetchSupervisorVolume, fetchStatusDistribution,
  fetchAiClassification, fetchSlaTickets, fetchAgentsPerformance,
  fetchAgents, fetchEscalations, takeEscalation, reassignEscalation, sendBackEscalation,
  reassignTicket,
} from '../../api/supervisor'
import { downloadReport } from '../../api/reports'


// ─────────────────────────────────────────────────────────────────────────────
// Espace Superviseur — Écrans 3.x (Vue d'ensemble, Escalades, Supervision SLA,
// Performance équipe, Rapports). Branché sur les vraies routes API backend.
// Charte projet : primary #1E3A5F, secondary #2D6A9F, accent #E8A020.
// ─────────────────────────────────────────────────────────────────────────────

const COLORS = {
  primary: '#1E3A5F', secondary: '#2D6A9F', accent: '#E8A020',
  success: '#27AE60', danger: '#C0392B', slate: '#cbd5e1',
}
const AI_COLORS = [COLORS.danger, COLORS.accent, COLORS.secondary, COLORS.slate]

// Module IA pas encore actif — reste en données de démonstration.
const MOCK_AI_CONF = [
  { label: 'Classification Critique', value: 96 },
  { label: 'Classification Haute', value: 89 },
  { label: 'Classification Moyenne', value: 85 },
  { label: 'Classification Basse', value: 91 },
]
const MOCK_AI_CONF_AVG = 90.3

const PRIORITIES = [
  { value: '', label: 'Toutes les priorités' },
  { value: 'CRITICAL', label: 'Critique' },
  { value: 'HIGH', label: 'Haute' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'LOW', label: 'Basse' },
]

const STATUSES = [
  { value: '', label: 'Tous les statuts' },
  { value: 'OPEN', label: 'Ouvert' },
  { value: 'ASSIGNED', label: 'Affecté' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'WAITING', label: 'En attente' },
  { value: 'ESCALATED', label: 'Escaladé' },
  { value: 'RESOLVED', label: 'Résolu' },
  { value: 'CLOSED', label: 'Clôturé' },
]

const NAV = [
  { key: 'overview', label: "Vue d'ensemble", Icon: LayoutDashboard },
  { key: 'escalations', label: 'Escalades', Icon: ArrowUpCircle },
  { key: 'sla', label: 'Supervision SLA', Icon: AlarmClock },
  { key: 'team', label: 'Performance équipe', Icon: Users },
  { key: 'reports', label: 'Rapports', Icon: FileText },
]

function Avatar({ initials, color, size = 28 }) {
  return (
    <span
      className="rounded-full text-white font-semibold flex items-center justify-center shrink-0"
      style={{ background: color, height: size, width: size, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  )
}

function Stars({ value }) {
  const full = Math.round(value)
  return (
    <span className="text-accent tracking-wide text-sm" aria-label={`${value} sur 5`}>
      {'★'.repeat(full)}
      <span className="text-slate-300">{'★'.repeat(5 - full)}</span>
      <span className="text-slate-400 text-xs ml-1">{value.toFixed(1)}</span>
    </span>
  )
}

function SupervisorDashboardPage() {
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [section, setSection] = useState('overview')
  const [reassign, setReassign] = useState(null) // { id, number, title } | null
  const [pendingEsc, setPendingEsc] = useState(0)
  const [slaBreachedCount, setSlaBreachedCount] = useState(0)

  const name = user ? `${user.first_name} ${user.last_name ?? ''}`.trim() : ''
  const initials = name ? initialsFromName(name) : '--'

  // Badges sidebar — rafraîchis à chaque changement de section
  useEffect(() => {
    fetchEscalations('pending').then((list) => setPendingEsc(list.length)).catch(() => {})
    fetchSupervisorKpis().then((k) => setSlaBreachedCount(k.slaBreached)).catch(() => {})
  }, [section])

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      {/* ── Barre latérale ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 bg-white border-r border-slate-200 min-h-screen sticky top-0">
        <div className="px-5 py-5 border-b border-slate-100">
          <p className="font-semibold text-primary">ZAY Digital World</p>
          <p className="text-xs text-slate-400">Console Superviseur</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ key, label, Icon }) => {
            const active = section === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSection(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${
                  active ? 'bg-primary/5 text-primary font-medium' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} />
                {label}
                {key === 'escalations' && pendingEsc > 0 && (
                  <span className="ml-auto text-xs font-semibold bg-danger text-white rounded-full px-1.5 py-0.5 min-w-5 text-center">
                    {pendingEsc}
                  </span>
                )}
                {key === 'sla' && slaBreachedCount > 0 && (
                  <span className="ml-auto text-xs font-semibold bg-accent text-white rounded-full px-1.5 py-0.5 min-w-5 text-center">
                    {slaBreachedCount}
                  </span>
                )}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => navigate('/supervisor/profil')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
          >
            <User size={16} />
            Mon profil
          </button>
        </nav>

        <div className="px-4 py-4 border-t border-slate-100 flex items-center gap-2.5">
          <Avatar initials={initials} color={COLORS.primary} size={32} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-700 truncate">{name}</p>
            <p className="text-xs text-slate-400">Superviseur</p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(logout())}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Se déconnecter"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ── En-tête mobile ──────────────────────────────────────────────── */}
      <header className="md:hidden bg-primary text-primary-foreground px-4 py-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">ZAY Digital World</p>
          <p className="text-xs text-primary-foreground/70">Console Superviseur</p>
        </div>
        <button type="button" onClick={() => dispatch(logout())} className="opacity-80 hover:opacity-100" aria-label="Se déconnecter">
          <LogOut size={18} />
        </button>
      </header>

      {/* ── Onglets mobile ───────────────────────────────────────────────── */}
      <div className="md:hidden flex gap-1 overflow-x-auto px-3 py-2 bg-white border-b border-slate-200">
        {NAV.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={`whitespace-nowrap text-sm px-3 py-1.5 rounded-full ${
              section === key ? 'bg-primary text-white' : 'text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Contenu ─────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 p-4 sm:p-6">
        {section === 'overview' && <Overview />}
        {section === 'escalations' && <Escalations onReassign={setReassign} />}
        {section === 'sla' && <SlaSupervision onReassign={setReassign} />}
        {section === 'team' && <Team />}
        {section === 'reports' && <Reports />}
      </main>

      {reassign && <ReassignModal ticket={reassign} onClose={() => setReassign(null)} />}
    </div>
  )
}

/* ════════════════ COMPOSANTS PARTAGÉS ════════════════ */
function TopBar({ title, desc, children }) {
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

function BellButton() {
  return (
    <button type="button" className="relative text-slate-500 hover:text-slate-700" aria-label="Notifications">
      <Bell size={19} />
      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-danger" />
    </button>
  )
}

function Kpi({ label, value, warn }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${warn ? 'text-danger' : 'text-slate-800'}`}>{value}</p>
    </div>
  )
}

function Card({ title, hint, right, children, className = '' }) {
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

function MiniStat({ Icon, tint, value, label, valueColor }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex items-center gap-3">
      <span className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: tint.bg, color: tint.fg }}>
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
function Gauge({ value }) {
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

/* ════════════════ SECTION 1 — VUE D'ENSEMBLE ════════════════ */
function Overview() {
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
        <BellButton />
      </TopBar>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
        <Kpi label="Total tickets" value={k.total.toLocaleString('fr-FR')} />
        <Kpi label="Ouverts" value={k.open} />
        <Kpi label="En cours" value={k.inProgress} />
        <Kpi label="Résolus" value={k.resolved} />
        <Kpi label="Critiques actifs" value={k.criticalActive} warn />
        <Kpi label="SLA non respecté" value={k.slaBreached} warn />
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
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm inline-block" style={{ background: COLORS.secondary }} />Créés</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm inline-block" style={{ background: COLORS.success }} />Résolus</span>
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
            <Gauge value={k.slaCompliance} />
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div><p className="text-2xl font-bold text-danger">{k.slaBreached}</p><p className="text-xs text-slate-400">en dépassement</p></div>
                <Clock size={24} className="text-danger" />
              </div>
            </div>
          </div>
        </Card>

        {/* Reste en données de démonstration — module IA non branché */}
        <Card title="Insights IA" hint="fiabilité du module de classification (données démo)"
          right={<span className="text-xs font-semibold px-2 py-0.5 rounded bg-secondary/10 text-secondary">Mistral 7B · fallback</span>}>
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

/* ════════════════ SECTION 2 — ESCALADES ════════════════ */
function Escalations({ onReassign }) {
  const [filter, setFilter] = useState('all')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetchEscalations(filter)
      .then(setList)
      .catch(() => toast.error("Impossible de charger les escalades."))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filter])

  const nPending = list.filter((e) => !e.resolved).length
  const nTaken = list.filter((e) => e.resolved).length

  const CHIPS = [
    { key: 'all', label: `Toutes (${list.length})` },
    { key: 'pending', label: `En attente (${nPending})` },
    { key: 'taken', label: `Prises en charge (${nTaken})` },
  ]

  async function handleTake(id) {
    try {
      await takeEscalation(id)
      toast.success('Escalade prise en charge.')
      load()
    } catch {
      toast.error("Échec de la prise en charge.")
    }
  }

  async function handleSendBack(id) {
    try {
      await sendBackEscalation(id)
      toast.success("Ticket renvoyé à l'agent.")
      load()
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Échec de l'action.")
    }
  }

  if (loading) return <div className="p-6 text-slate-400 text-sm">Chargement...</div>

  return (
    <>
      <TopBar title="Escalades reçues" desc="Tickets transmis par les agents · à qualifier et affecter">
        <BellButton />
      </TopBar>

      <div className="flex gap-2 mb-4 flex-wrap">
        {CHIPS.map((c) => (
          <button key={c.key} type="button" onClick={() => setFilter(c.key)}
            className={`text-sm px-4 py-1.5 rounded-full border ${
              filter === c.key ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200'
            }`}>
            {c.label}
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <p className="text-sm text-slate-400 py-10 text-center">Aucune escalade pour ce filtre.</p>
      )}

      <div className="space-y-3.5 max-w-4xl">
        {list.map((e) => {
          const border = e.priority === 'CRITICAL' ? 'border-l-danger' : e.priority === 'HIGH' ? 'border-l-accent' : 'border-l-slate-200'
          return (
            <div key={e.id} className={`bg-white border border-slate-200 border-l-[3px] ${border} rounded-xl p-4`}>
              <div className="flex justify-between gap-3">
                <div>

                  <p className="text-xs text-slate-400">{e.ticket_number} · {new Date(e.escalation_date).toLocaleDateString('fr-FR')}</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{e.ticket_title}</p>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1"><User size={12} />{e.client_name}</p>
                    
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <PriorityBadge priority={e.priority} />
                  {e.resolved
                    ? <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success whitespace-nowrap">Pris en charge</span>
                    : <StatusBadge status="ESCALATED" />}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap mt-3">
                {e.escalated_by && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Avatar initials={initialsFromName(e.escalated_by.full_name)} color={agentColor(e.escalated_by.id)} size={22} />
                    Escaladé par {e.escalated_by.full_name}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-white ${
                  e.escalation_type === 'AUTO' ? 'text-danger border-danger/40' : 'text-secondary border-secondary/40'
                }`}>
                  {e.escalation_type === 'AUTO' ? 'Automatique · Risque SLA' : 'Manuelle'}
                </span>
              </div>

              <div className="mt-3"><SlaBar createdAt={e.ticket_created_at} slaDeadline={e.sla_deadline} priority={e.priority} /></div>

              <p className="mt-3 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs text-slate-600 italic leading-relaxed">
                « {e.reason} »
              </p>

              <div className="flex gap-2 mt-3 flex-wrap">
                {!e.resolved ? (
                  <>
                    <button type="button" onClick={() => handleTake(e.id)}
                      className="text-xs font-medium bg-primary text-white rounded-lg px-3 py-2 hover:bg-primary/90">Prendre en charge</button>
                    <button type="button" onClick={() => onReassign({ id: e.id, number: e.ticket_number, title: e.ticket_title, isEscalation: true  })}
                      className="flex items-center gap-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-2 hover:bg-slate-50">
                      <ArrowLeftRight size={14} /> Réaffecter
                    </button>
                    <button type="button" onClick={() => handleSendBack(e.id)}
                      className="text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-2 hover:bg-slate-50">Renvoyer à l'agent</button>
                  </>
                ) : (
                  <button type="button" className="text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-2 hover:bg-slate-50">Ouvrir la fiche</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

/* ════════════════ MODALE — FICHE ESCALADE & MESSAGES ════════════════ */
function EscalationDetailModal({ escalation, onClose }) {
  const [messages, setMessages] = useState(escalation.messages ?? [])
  const [draft, setDraft] = useState('')

  // TODO API : POST /api/tickets/{escalation.id}/messages/
  const send = () => {
    if (!draft.trim()) return
    setMessages((prev) => [...prev, { id: Date.now(), author: 'Vous', text: draft.trim(), time: "à l'instant" }])
    setDraft('')
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-400">{escalation.number} · {escalation.date}</p>
            <p className="font-semibold text-slate-800 mt-0.5">{escalation.title}</p>
            <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <User size={12} />Client (identité masquée)
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3.5 overflow-y-auto flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <PriorityBadge priority={escalation.priority} />
            {escalation.state === 'taken'
              ? <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">Pris en charge</span>
              : <StatusBadge status="ESCALATED" />}
            <ReasonChip reason={escalation.reason} />
          </div>

          <SlaBar createdAt={escalation.createdAt} slaDeadline={escalation.slaDeadline} priority={escalation.priority} />

          <p className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs text-slate-600 italic leading-relaxed">
            « {escalation.context} »
          </p>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Messages</p>
            {messages.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun message pour ce ticket.</p>
            ) : (
              <div className="space-y-2">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`text-sm rounded-lg px-3 py-2 max-w-[85%] ${
                      m.author === 'Vous' ? 'ml-auto bg-primary text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 px-5 py-3 border-t border-slate-100">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Écrire un message... (Entrée pour envoyer)"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
          />
          <button type="button" onClick={send} className="bg-primary text-white rounded-lg px-3 py-2 hover:bg-primary/90" aria-label="Envoyer">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════ SECTION 3 — SUPERVISION SLA ════════════════ */
function SlaSupervision({ onReassign }) {
  const [filter, setFilter] = useState('all')
  const [rows, setRows] = useState([])
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchSlaTickets(filter), fetchSupervisorKpis()])
      .then(([tickets, k]) => {
        setRows(
          tickets
            .map((t) => ({ ...t, info: getSlaInfo(t.createdAt, t.slaDeadline, t.priority) }))
            .sort((a, b) => a.info.remainingMs - b.info.remainingMs)
        )
        setKpis(k)
      })
      .catch(() => toast.error("Impossible de charger la supervision SLA."))
      .finally(() => setLoading(false))
  }, [filter])

  const CHIPS = [{ key: 'all', label: 'Tous' }, { key: 'bad', label: 'Dépassé' }, { key: 'risk', label: 'À risque' }]

  if (loading || !kpis) return <div className="p-6 text-slate-400 text-sm">Chargement...</div>

  return (
    <>
      <TopBar title="Supervision SLA" desc="Surveillance des délais en temps réel · tri par urgence"><BellButton /></TopBar>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <MiniStat Icon={AlertTriangle} tint={{ bg: 'rgba(192,57,43,.10)', fg: COLORS.danger }} value={kpis.slaBreached} valueColor={COLORS.danger} label="SLA dépassé" />
        <MiniStat Icon={CheckCircle2} tint={{ bg: 'rgba(39,174,96,.12)', fg: COLORS.success }} value={`${kpis.slaCompliance}%`} valueColor={COLORS.success} label="Conformité globale" />
      </div>

      <div className="flex gap-2 mb-4">
        {CHIPS.map((c) => (
          <button key={c.key} type="button" onClick={() => setFilter(c.key)}
            className={`text-sm px-4 py-1.5 rounded-full border ${filter === c.key ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200'}`}>
            {c.label}
          </button>
        ))}
      </div>


      {rows.length === 0 && (
        <p className="text-sm text-slate-400 py-10 text-center">Aucun ticket pour ce filtre.</p>
      )}

      {rows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="px-4 py-3">Ticket</th><th className="px-4 py-3">Client</th><th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Priorité</th><th className="px-4 py-3 w-1/4">SLA</th><th className="px-4 py-3" />
           
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.number} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3"><p className="font-semibold text-slate-800 text-sm">{t.number}</p><p className="text-xs text-slate-400">{t.title}</p></td>
                    <td className="px-4 py-3 text-sm text-slate-600">{t.client}</td>
                    <td className="px-4 py-3">
                      {t.agent ? (
                        <span className="flex items-center gap-2 text-sm text-slate-600">
                          <Avatar initials={t.agent.initials} color={COLORS.secondary} size={26} />{t.agent.name}
                        </span>
                      ) : <span className="text-xs text-slate-400">Non assigné</span>}
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-4 py-3"><SlaBar createdAt={t.createdAt} slaDeadline={t.slaDeadline} priority={t.priority} /></td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => onReassign({ id: t.id, number: t.number, title: t.title, isEscalation: false })}
                        className="text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-1.5 hover:bg-slate-50 whitespace-nowrap">Réaffecter</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

/* ════════════════ SECTION 4 — PERFORMANCE ÉQUIPE ════════════════ */
function Team() {
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
      toast.success("Export généré.")
    } catch {
      toast.error("Échec de l'export.")
    }
  }}
  className="hidden sm:flex items-center gap-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-2 hover:bg-slate-50"
>
  <Download size={14} /> Exporter
</button>
      </TopBar>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <MiniStat Icon={Users} tint={{ bg: 'rgba(45,106,159,.10)', fg: COLORS.secondary }} value={agents.length} valueColor="#1e293b" label="Agents actifs" />
        <MiniStat Icon={CheckCircle2} tint={{ bg: 'rgba(39,174,96,.12)', fg: COLORS.success }} value={`${avgSat}/5`} valueColor="#1e293b" label="Satisfaction moyenne" />
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
                {chargeData.map((d, i) => <Cell key={i} fill={d.load >= 14 ? COLORS.accent : COLORS.secondary} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="px-4 py-3">Agent</th><th className="px-4 py-3">Traités</th><th className="px-4 py-3">Tps moyen</th>
                  <th className="px-4 py-3 w-1/5">Conformité SLA</th><th className="px-4 py-3">Satisfaction</th>
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
                          <span className="block h-full rounded-full" style={{ width: `${a.slaCompliance}%`, background: a.slaCompliance >= 90 ? COLORS.success : COLORS.accent }} />
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

/* ════════════════ SECTION 5 — RAPPORTS ════════════════ */
function Reports() {
  const [fmt, setFmt] = useState('pdf')
  const [agents, setAgents] = useState([])
  const [agentId, setAgentId] = useState('')
  const [priority, setPriority] = useState('')
  const [ticketStatus, setTicketStatus] = useState('')
  const [downloading, setDownloading] = useState(false)


  const FORMATS = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    
  ]


  useEffect(() => {
    fetchAgents().then(setAgents).catch(() => {})
  }, [])

  async function handleGenerate() {
    try {
      setDownloading(true)
      await downloadReport(fmt, {
        agent_id: agentId || undefined,
        priority: priority || undefined,
        status: ticketStatus || undefined,
      })
      toast.success('Rapport généré.')
    } catch {
      toast.error('Échec de la génération du rapport.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
     <TopBar title="Rapports & exports" desc="Générer un rapport de performance filtré au format PDF ou Excel">
  <BellButton />
</TopBar>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl">
        <Card title="Paramètres du rapport">
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Agent</label>
              <select value={agentId} onChange={(e) => setAgentId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white">
                <option value="">Tous les agents</option>
                {agents.map((a) => (
                  <option key={a.agent_id} value={a.agent_id}>{a.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priorité</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white">
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Statut</label>
              <select value={ticketStatus} onChange={(e) => setTicketStatus(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white">
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </Card>

        <Card title="Format d'export">
          <div className="flex gap-2 mb-5">
            {FORMATS.map((f) => (
              <button key={f.value} type="button" onClick={() => setFmt(f.value)}
                className={`flex-1 border rounded-xl py-3 flex flex-col items-center gap-1.5 text-xs font-medium ${
                  fmt === f.value ? 'border-secondary bg-secondary/5 text-secondary' : 'border-slate-200 text-slate-600'
                }`}>
                <FileText size={20} />{f.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Le rapport inclut la synthèse des KPIs, la performance par agent et le détail des tickets escaladés,
            sur le périmètre filtré à gauche.
          </p>
          <button type="button" onClick={handleGenerate} disabled={downloading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-lg py-2.5 text-sm font-medium mt-4 hover:bg-primary/90 disabled:opacity-50">
            <Download size={15} /> {downloading ? 'Génération...' : 'Générer le rapport'}
          </button>
        </Card>
      </div>
    </>
  )
}

/* ════════════════ MODALE — RÉAFFECTATION ════════════════ */
function ReassignModal({ ticket, onClose }) {
  const [agents, setAgents] = useState([])
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAgents().then(setAgents).catch(() => toast.error("Impossible de charger les agents."))
  }, [])

 async function confirm() {
  if (selected == null) return toast.error('Sélectionne un agent.')
  if (!ticket.id) {
    toast.error("Impossible de réaffecter : ticket introuvable (id manquant).")
    return
  }
  try {
    setSaving(true)
    if (ticket.isEscalation) {
      await reassignEscalation(ticket.id, agents[selected].agent_id, note)
    } else {
      await reassignTicket(ticket.id, agents[selected].agent_id, note)
    }
    toast.success('Ticket réaffecté.')
    onClose()
  } catch (err) {
    toast.error(err?.response?.data?.detail || 'Échec de la réaffectation.')
  } finally {
    setSaving(false)
  }
}

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex gap-2.5">
            <ArrowLeftRight size={19} className="text-secondary mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Réaffecter le ticket {ticket.number}</p>
              <p className="text-xs text-slate-500 mt-0.5">{ticket.title}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Affecter à</p>
            <div className="space-y-2">
              {agents.map((a, i) => (
                <button key={a.agent_id} type="button" onClick={() => setSelected(i)}
                  className={`w-full text-left border rounded-xl px-3.5 py-3 flex items-center gap-3 ${
                    selected === i ? 'border-secondary bg-secondary/5' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                  <Avatar initials={initialsFromName(a.full_name)} color={agentColor(a.agent_id)} size={28} />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-slate-700">{a.full_name}</span>
                    <span className="block text-xs text-slate-500">{a.status === 'AVAILABLE' ? 'Disponible' : a.status}</span>
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{a.workload} tickets</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Note pour l'agent (optionnel)</label>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Consignes, contexte, priorité de traitement…"
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-secondary/40" />
          </div>
        </div>

        <div className="flex gap-2.5 px-5 py-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="flex-1 bg-white border border-slate-200 text-slate-600 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50">Annuler</button>
          <button type="button" onClick={confirm} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            <Check size={15} /> {saving ? 'Enregistrement...' : 'Confirmer la réaffectation'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SupervisorDashboardPage