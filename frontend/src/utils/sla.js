// utils/sla.js — version corrigée
const HOUR_MS = 60 * 60 * 1000

/**
 * Retourne { percentage, remainingMs, level, label } pour un ticket donné.
 * warningPercentage vient du ticket (sla_rule.warning_percentage renvoyé par l'API),
 * PAS d'une table locale — chaque plan/priorité a son propre seuil configuré par l'admin.
 */
export function getSlaInfo(createdAtIso, slaDeadlineIso, warningPercentage = 80) {
  const now = Date.now()
  const start = new Date(createdAtIso).getTime()
  const end = new Date(slaDeadlineIso).getTime()
  const total = Math.max(end - start, 1)
  const elapsed = now - start
  const remainingMs = end - now
  const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100))

  let level = 'ok'
  if (remainingMs <= 0) level = 'breached'
  else if (percentage >= warningPercentage) level = 'warning'

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