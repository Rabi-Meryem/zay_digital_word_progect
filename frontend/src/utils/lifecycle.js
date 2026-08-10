// Cycle de vie d'un ticket, tel qu'il est présenté au client.
//
// Seules 4 étapes sont visibles côté client : Créé, Pris en charge, Résolu,
// Fermé. Les statuts internes (Affecté, En attente, Escaladé) sont réservés
// à l'agent/superviseur et sont donc absorbés dans "Pris en charge" ici.
//
// La réouverture n'est pas une étape de la timeline : elle peut survenir
// après "Fermé", donc elle est exposée à part (flag `reouvert`) pour être
// affichée comme un badge/bandeau distinct par le composant.

export const ETAPES = [
  { cle: 'cree', label: 'Ticket créé' },
  { cle: 'pris_en_charge', label: 'Pris en charge' },
  { cle: 'resolu', label: 'Résolu' },
  { cle: 'ferme', label: 'Fermé' },
]

/** Index de l'étape courante à partir de current_status. */
function indexCourant(ticket) {
  switch (ticket.current_status) {
    case 'OPEN':
      return 0
    case 'ASSIGNED':
    case 'IN_PROGRESS':
    case 'WAITING':
    case 'ESCALATED':
      return 1
    case 'RESOLVED':
      return 2
    case 'CLOSED':
      return 3
    // Un ticket réouvert repart en traitement : on revient visuellement
    // sur "Pris en charge", le flag `reouvert` signale l'événement à part.
    case 'REOPENED':
      return 1
    default:
      return 0
  }
}

/**
 * Retourne les 4 étapes enrichies :
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

/** Le ticket a-t-il été réouvert ? Utile pour afficher un badge séparé. */
export function estReouvert(ticket = {}) {
  return ticket.current_status === 'REOPENED'
}

/** Date de réouverture, si connue (à adapter au champ réel du backend). */
export function dateReouverture(ticket = {}) {
  return ticket.reopened_at ?? null
}

/** Progression en pourcentage, pour la barre du stepper. */
export function progressionPct(ticket = {}) {
  return Math.round((indexCourant(ticket) / (ETAPES.length - 1)) * 100)
}