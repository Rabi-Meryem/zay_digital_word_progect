export const STATUS_STYLES = {
  OPEN: { label: 'Ouvert', className: 'bg-slate-100 text-slate-600' },
  ASSIGNED: { label: 'Affecté', className: 'bg-secondary/10 text-secondary' },
  IN_PROGRESS: { label: 'En cours', className: 'bg-secondary/10 text-secondary' },
  WAITING: { label: 'En attente', className: 'bg-accent/10 text-accent' },
  ESCALATED: { label: 'Escaladé', className: 'bg-danger/10 text-danger' },
  RESOLVED: { label: 'Résolu', className: 'bg-success/10 text-success' },
  CLOSED: { label: 'Clôturé', className: 'bg-slate-100 text-slate-500' },
  REOPENED: { label: 'Réouvert', className: 'bg-accent/10 text-accent' },
}

// Libellé français d'un statut, identique à celui affiché à l'agent.
export function statusLabel(status) {
  return STATUS_STYLES[status]?.label ?? status
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.OPEN
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${s.className}`}>
      {s.label}
    </span>
  )
}

export default StatusBadge
