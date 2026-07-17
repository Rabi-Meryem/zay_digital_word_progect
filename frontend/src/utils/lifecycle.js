// Cycle de vie d'un ticket, tel qu'il est présenté au client.
//
// Les 7 étapes sont déduites de current_status : le backend n'a pas besoin
// d'exposer une étape explicite, elle se dérive des champs existants.

export const ETAPES = [
  { cle: 'cree', label: 'Ticket créé' },
  { cle: 'pris_en_charge', label: 'Pris en charge' },
  { cle: 'analyse', label: 'Analyse en cours' },
  { cle: 'solution', label: 'Solution en préparation' },
  { cle: 'validation', label: 'Validation interne' },
  { cle: 'resolu', label: 'Résolu' },
  { cle: 'ferme', label: 'Fermé' },
]

/** Index de l'étape courante à partir de current_status. */
function indexCourant(ticket) {
  switch (ticket.current_status) {
    case 'OPEN':
      return 0
    case 'ASSIGNED':
      return 1
    case 'IN_PROGRESS':
      return 2
    case 'WAITING':
      return 3
    case 'ESCALATED':
      return 4
    case 'REOPENED':
      return 2
    case 'RESOLVED':
      return 5
    case 'CLOSED':
      return 6
    default:
      return 0
  }
}

/**
 * Retourne les 7 étapes enrichies :
 *   etat : 'faite' | 'courante' | 'a_venir'
 *   date : horodatage si connu
 */
export function etapesDuTicket(ticket = {}) {
  const courant = indexCourant(ticket)

  const dates = {
    cree: ticket.created_at,
    pris_en_charge: ticket.first_response_at ?? (ticket.messages ?? []).find((m) => m.author === 'agent')?.sentAt,
    resolu: ticket.resolved_at,
    ferme: ticket.closed_at,
  }

  return ETAPES.map((etape, i) => ({
    ...etape,
    etat: i < courant ? 'faite' : i === courant ? 'courante' : 'a_venir',
    date: dates[etape.cle] || null,
  }))
}

/** Progression en pourcentage, pour la barre du stepper. */
export function progressionPct(ticket = {}) {
  return Math.round((indexCourant(ticket) / (ETAPES.length - 1)) * 100)
}
