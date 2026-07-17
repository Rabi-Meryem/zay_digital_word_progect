import { TicketCheck, Hourglass, ShieldCheck, Timer, AlertTriangle, Star } from 'lucide-react'
import { calculerKpisClient } from '../../utils/clientKpis'

// Ligne 1 du Dashboard Client 360 : les 6 KPI essentiels, dans l'ordre
// d'importance retenu côté client (tickets ouverts et tickets en attente
// de son action en premier, satisfaction en dernier).

function KpiCard({ icon: Icon, label, valeur, unite, ton = 'neutre', alerte = false, aide }) {
  const tons = {
    neutre: 'text-slate-800',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
  }

  return (
    <div
      className={`bg-white rounded-lg border p-4 ${
        alerte ? 'border-danger/40 ring-1 ring-danger/10' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-500 leading-tight">{label}</p>
        <Icon size={15} className="text-slate-300 shrink-0" aria-hidden="true" />
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`text-2xl font-semibold ${tons[ton]}`}>{valeur}</span>
        {unite && <span className="text-sm text-slate-400">{unite}</span>}
      </div>
      {aide && <p className="mt-1 text-[11px] text-slate-400 leading-tight">{aide}</p>}
    </div>
  )
}

function KpiRow({ tickets = [] }) {
  const k = calculerKpisClient(tickets)

  const tonSla =
    k.respectSla == null ? 'neutre' : k.respectSla >= 90 ? 'success' : k.respectSla >= 75 ? 'warning' : 'danger'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <KpiCard
        icon={TicketCheck}
        label="Tickets ouverts"
        valeur={k.ouverts}
        ton="primary"
        aide="Demandes non résolues"
      />
      <KpiCard
        icon={Hourglass}
        label="En attente de votre action"
        valeur={k.enAttenteClient}
        ton={k.enAttenteClient > 0 ? 'warning' : 'neutre'}
        alerte={k.enAttenteClient > 0}
        aide={k.enAttenteClient > 0 ? 'Une réponse est attendue' : 'Rien à faire de votre côté'}
      />
      <KpiCard
        icon={ShieldCheck}
        label="Respect SLA"
        valeur={k.respectSla == null ? '—' : k.respectSla}
        unite={k.respectSla == null ? '' : '%'}
        ton={tonSla}
        aide="Traités dans les délais"
      />
      <KpiCard
        icon={Timer}
        label="Temps moyen de résolution"
        valeur={k.tempsMoyenResolution}
        aide={`1re réponse : ${k.tempsPremiereReponse}`}
      />
      <KpiCard
        icon={AlertTriangle}
        label="Tickets en retard"
        valeur={k.enRetard}
        ton={k.enRetard > 0 ? 'danger' : 'success'}
        alerte={k.enRetard > 0}
        aide="Échéance SLA dépassée"
      />
      <KpiCard
        icon={Star}
        label="Satisfaction moyenne"
        valeur={k.satisfaction == null ? '—' : k.satisfaction}
        unite={k.satisfaction == null ? '' : '/ 5'}
        ton="warning"
        aide="Sur vos tickets évalués"
      />
    </div>
  )
}

export default KpiRow
