// utils/mockSlaHelper.js
// Aide au calcul de deadlines FICTIVES, utilisée uniquement par les fichiers
// mock*.js (données de démo tant que l'API réelle n'existe pas côté frontend).
// Ne pas confondre avec la vraie logique SLA : le calcul réel (heures ouvrées,
// plan client x priorité) est fait côté backend par sla/services.py + business_time.py.

const HOUR_MS = 60 * 60 * 1000

// Correspondance illustrative priorité -> délai, reprise des mêmes valeurs
// que l'ancien seed (Critique 2h, Haute 8h, Moyenne 24h, Basse 72h),
// pour que les tickets mock affichent des barres SLA réalistes.
const MOCK_HOURS_BY_PRIORITY = {
  CRITICAL: 2,
  HIGH: 8,
  MEDIUM: 24,
  LOW: 72,
}

export function fakeSlaDeadline(createdAtIso, priority) {
  const hours = MOCK_HOURS_BY_PRIORITY[priority] ?? MOCK_HOURS_BY_PRIORITY.MEDIUM
  return new Date(new Date(createdAtIso).getTime() + hours * HOUR_MS).toISOString()
}