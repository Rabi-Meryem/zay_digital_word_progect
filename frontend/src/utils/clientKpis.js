// Calcul des indicateurs (KPI) du portail client.
//
// ⚠️ Fonctions calées sur la forme réelle des modèles Django (voir mockTickets.js) :
// current_status, priority, created_at, sla_deadline, rating, assigned_agent.
// Le bascule vers un vrai GET /api/tickets/ ne demandera aucun changement ici.
//
// Les champs first_response_at / resolved_at n'existent pas encore côté mock :
// les fonctions concernées retournent null proprement le cas échéant, et le
// backend n'aura qu'à les exposer pour que les KPI s'alimentent d'eux-mêmes.

import { getSlaInfo } from './sla'

export const OPEN_STATUSES = ['OPEN', 'ASSIGNED']
export const PROGRESS_STATUSES = ['IN_PROGRESS', 'WAITING', 'ESCALATED', 'REOPENED']
export const CLOSED_STATUSES = ['RESOLVED', 'CLOSED']

const toDate = (v) => (v ? new Date(v) : null)

export const isClosed = (t) => CLOSED_STATUSES.includes(t.current_status)
export const isActive = (t) => !isClosed(t)

/** Tickets non résolus (ouverts + en cours). */
export function ticketsOuverts(tickets = []) {
  return tickets.filter(isActive).length
}

/**
 * Tickets qui attendent une action du client.
 * WAITING = le support attend une réponse ; REOPENED = le client doit confirmer.
 */
export function ticketsEnAttenteClient(tickets = []) {
  return tickets.filter((t) => t.current_status === 'WAITING' || t.current_status === 'REOPENED').length
}

/** Tickets actifs dont l'échéance SLA est dépassée. */
export function ticketsEnRetard(tickets = []) {
  return tickets.filter((t) => {
    if (isClosed(t)) return false
    const { level } = getSlaInfo(t.created_at, t.sla_deadline, t.priority)
    return level === 'breached'
  }).length
}

/**
 * Temps moyen de résolution, en millisecondes.
 * Utilise resolved_at si le backend l'expose, sinon l'échéance SLA des tickets
 * résolus comme approximation de démonstration.
 */
export function tempsMoyenResolutionMs(tickets = []) {
  const durees = tickets
    .filter(isClosed)
    .map((t) => {
      const fin = toDate(t.resolved_at) || toDate(t.sla_deadline)
      const debut = toDate(t.created_at)
      return fin && debut ? fin - debut : null
    })
    .filter((d) => Number.isFinite(d) && d > 0)

  if (durees.length === 0) return null
  return durees.reduce((a, b) => a + b, 0) / durees.length
}

/** Temps moyen de première réponse, en millisecondes. */
export function tempsPremiereReponseMs(tickets = []) {
  const durees = tickets
    .map((t) => {
      // first_response_at si disponible, sinon 1er message d'un agent.
      const premier =
        t.first_response_at || (t.messages ?? []).find((m) => m.author === 'agent')?.sentAt
      if (!premier || !t.created_at) return null
      return toDate(premier) - toDate(t.created_at)
    })
    .filter((d) => Number.isFinite(d) && d > 0)

  if (durees.length === 0) return null
  return durees.reduce((a, b) => a + b, 0) / durees.length
}

/**
 * Taux de respect des SLA, en pourcentage (0-100).
 * Un ticket est conforme tant que son SLA n'est pas dépassé.
 */
export function respectSla(tickets = []) {
  if (tickets.length === 0) return null

  const conformes = tickets.filter((t) => {
    const { level } = getSlaInfo(t.created_at, t.sla_deadline, t.priority)
    return level !== 'breached'
  }).length

  return Math.round((conformes / tickets.length) * 100)
}

/** Note de satisfaction moyenne sur 5 (champ rating). */
export function satisfactionMoyenne(tickets = []) {
  const notes = tickets.map((t) => t.rating).filter((n) => typeof n === 'number' && n > 0)
  if (notes.length === 0) return null
  return Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 10) / 10
}

/** Formate une durée en millisecondes vers "4h 23min". */
export function formatDuree(ms) {
  if (ms == null || !Number.isFinite(ms)) return '—'
  const totalMin = Math.round(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} min`
  if (h < 24) return `${h}h ${String(m).padStart(2, '0')}min`
  return `${Math.floor(h / 24)}j ${h % 24}h`
}

/** Volume mensuel des tickets créés et résolus, sur les N derniers mois. */
export function volumeParMois(tickets = [], nbMois = 6, now = new Date()) {
  const mois = []
  for (let i = nbMois - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    mois.push({
      cle: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('fr-FR', { month: 'short' }),
      crees: 0,
      resolus: 0,
    })
  }

  const index = new Map(mois.map((m) => [m.cle, m]))
  const cleDe = (v) => {
    const d = toDate(v)
    if (!d || Number.isNaN(d.getTime())) return null
    return `${d.getFullYear()}-${d.getMonth()}`
  }

  tickets.forEach((t) => {
    const kc = cleDe(t.created_at)
    if (kc && index.has(kc)) index.get(kc).crees += 1

    if (isClosed(t)) {
      const kr = cleDe(t.resolved_at || t.sla_deadline)
      if (kr && index.has(kr)) index.get(kr).resolus += 1
    }
  })

  return mois
}

/** Statistiques du mois en cours, pour le bloc "Qualité du support". */
export function statsMoisEnCours(tickets = [], now = new Date()) {
  const memeMois = (v) => {
    const d = toDate(v)
    return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }

  return {
    crees: tickets.filter((t) => memeMois(t.created_at)).length,
    resolus: tickets.filter((t) => isClosed(t) && memeMois(t.resolved_at || t.sla_deadline)).length,
    respectSla: respectSla(tickets),
    tempsMoyen: formatDuree(tempsMoyenResolutionMs(tickets)),
    satisfaction: satisfactionMoyenne(tickets),
  }
}

/** Les N tickets actifs les plus urgents, triés par échéance SLA croissante. */
export function ticketsPrioritaires(tickets = [], limite = 5) {
  return tickets
    .filter(isActive)
    .map((t) => ({ ...t, _sla: getSlaInfo(t.created_at, t.sla_deadline, t.priority) }))
    .sort((a, b) => a._sla.remainingMs - b._sla.remainingMs)
    .slice(0, limite)
}

/** Formate le temps restant avant échéance : "1h 15", "En retard". */
export function formatSlaRestant(restantMs) {
  if (!Number.isFinite(restantMs)) return '—'
  if (restantMs <= 0) return 'En retard'
  const totalMin = Math.round(restantMs / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} min`
  if (h < 24) return `${h}h ${String(m).padStart(2, '0')}`
  return `${Math.floor(h / 24)}j`
}

/** Agrégat de tous les KPI, pour la ligne 1 du dashboard. */
export function calculerKpisClient(tickets = []) {
  return {
    ouverts: ticketsOuverts(tickets),
    enAttenteClient: ticketsEnAttenteClient(tickets),
    enRetard: ticketsEnRetard(tickets),
    respectSla: respectSla(tickets),
    tempsMoyenResolution: formatDuree(tempsMoyenResolutionMs(tickets)),
    tempsPremiereReponse: formatDuree(tempsPremiereReponseMs(tickets)),
    satisfaction: satisfactionMoyenne(tickets),
  }
}
