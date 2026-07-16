// Calcul du temps restant / pourcentage écoulé pour la barre de SLA.
//
// Barème (resolution_hours) illustratif — reproduit la logique du modèle réel
// backend/sla/models/sla_rule.py (priority -> resolution_hours, warning_percentage),
// à remplacer par les vraies valeurs une fois l'API SLA disponible.

const HOUR_MS = 60 * 60 * 1000

const SLA_RULES = {
  CRITICAL: { resolutionHours: 4, warningPercentage: 80 },
  HIGH: { resolutionHours: 8, warningPercentage: 80 },
  MEDIUM: { resolutionHours: 24, warningPercentage: 80 },
  LOW: { resolutionHours: 72, warningPercentage: 80 },
}

export function computeSlaDeadline(createdAtIso, priority) {
  const rule = SLA_RULES[priority] ?? SLA_RULES.MEDIUM
  const created = new Date(createdAtIso).getTime()
  return new Date(created + rule.resolutionHours * HOUR_MS).toISOString()
}

/**
 * Retourne { percentage, remainingMs, level, label } pour un ticket donné.
 * level : 'ok' | 'warning' | 'breached'
 */
export function getSlaInfo(createdAtIso, slaDeadlineIso, priority) {
  const rule = SLA_RULES[priority] ?? SLA_RULES.MEDIUM
  const now = Date.now()
  const start = new Date(createdAtIso).getTime()
  const end = new Date(slaDeadlineIso).getTime()
  const total = Math.max(end - start, 1)
  const elapsed = now - start
  const remainingMs = end - now
  const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100))

  let level = 'ok'
  if (remainingMs <= 0) level = 'breached'
  else if (percentage >= rule.warningPercentage) level = 'warning'

  return { percentage, remainingMs, level, label: formatRemaining(remainingMs) }
}

function formatRemaining(ms) {
  if (ms <= 0) {
    const overH = Math.floor(Math.abs(ms) / HOUR_MS)
    if (overH < 1) return 'SLA dépassé'
    if (overH < 24) return `SLA dépassé de ${overH}h`
    return `SLA dépassé de ${Math.floor(overH / 24)}j`
  }
  const totalMinutes = Math.floor(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h < 1) return `${m}min restantes`
  if (h < 24) return `${h}h ${m}min restantes`
  return `${Math.floor(h / 24)}j restants`
}
