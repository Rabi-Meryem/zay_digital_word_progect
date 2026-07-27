import { TicketCheck, Hourglass, ShieldCheck, Timer, AlertTriangle, Star } from 'lucide-react'
import { calculerKpisClient } from '../../utils/clientKpis'

// Ligne 1 du Dashboard Client 360 : les 6 KPI essentiels, dans l'ordre
// d'importance retenu côté client (tickets ouverts et tickets en attente
// de son action en premier, satisfaction en dernier).
//
// Chaque carte a son propre dégradé vif pour une lecture immédiate.

function KpiCard({ icon: Icon, label, valeur, unite, degrade, alerte = false, aide }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl p-4 text-white shadow-sm bg-gradient-to-br ${degrade} ${
        alerte ? 'ring-2 ring-white/50' : ''
      }`}
    >
      {/* halo décoratif */}
      <span
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/15"
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-2">
        <p className="text-xs font-semibold leading-tight text-white/90">{label}</p>
        <Icon size={16} className="shrink-0 text-white/70" aria-hidden="true" />
      </div>

      <div className="relative mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight drop-shadow-sm">{valeur}</span>
        {unite && <span className="text-sm font-medium text-white/80">{unite}</span>}
      </div>

      {aide && <p className="relative mt-1 text-[11px] leading-tight text-white/75">{aide}</p>}
    </div>
  )
}

function KpiRow({ tickets = [] }) {
  const k = calculerKpisClient(tickets)

  // Le respect SLA change de couleur selon le niveau atteint
  const degradeSla =
    k.respectSla == null
      ? 'from-slate-400 to-slate-500'
      : k.respectSla >= 90
      ? 'from-emerald-400 to-teal-600'
      : k.respectSla >= 75
      ? 'from-amber-400 to-orange-500'
      : 'from-rose-500 to-red-600'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <KpiCard
        icon={TicketCheck}
        label="Tickets ouverts"
        valeur={k.ouverts}
        degrade="from-blue-500 to-indigo-600"
        aide="Demandes non résolues"
      />

      <KpiCard
        icon={Hourglass}
        label="En attente de votre action"
        valeur={k.enAttenteClient}
        degrade={
          k.enAttenteClient > 0 ? 'from-amber-400 to-orange-500' : 'from-slate-400 to-slate-500'
        }
        alerte={k.enAttenteClient > 0}
        aide={k.enAttenteClient > 0 ? 'Une réponse est attendue' : 'Rien à faire de votre côté'}
      />

      <KpiCard
        icon={ShieldCheck}
        label="Respect SLA"
        valeur={k.respectSla == null ? '—' : k.respectSla}
        unite={k.respectSla == null ? '' : '%'}
        degrade={degradeSla}
        aide="Traités dans les délais"
      />

      <KpiCard
        icon={Timer}
        label="Temps moyen de résolution"
        valeur={k.tempsMoyenResolution}
        degrade="from-cyan-400 to-sky-600"
        aide={`1re réponse : ${k.tempsPremiereReponse}`}
      />

      <KpiCard
        icon={AlertTriangle}
        label="Tickets en retard"
        valeur={k.enRetard}
        degrade={k.enRetard > 0 ? 'from-rose-500 to-red-600' : 'from-emerald-400 to-teal-600'}
        alerte={k.enRetard > 0}
        aide="Échéance SLA dépassée"
      />

      <KpiCard
        icon={Star}
        label="Satisfaction moyenne"
        valeur={k.satisfaction == null ? '—' : k.satisfaction}
        unite={k.satisfaction == null ? '' : '/ 5'}
        degrade="from-fuchsia-500 to-purple-600"
        aide="Sur vos tickets évalués"
      />
    </div>
  )
}

export default KpiRow
