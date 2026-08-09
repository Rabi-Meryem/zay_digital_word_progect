const PRIORITY_STYLES = {
  CRITICAL: { label: 'Critique', className: 'bg-danger/10 text-danger' },
  HIGH: { label: 'Haute', className: 'bg-accent/10 text-accent' },
  MEDIUM: { label: 'Moyenne', className: 'bg-secondary/10 text-secondary' },
  LOW: { label: 'Basse', className: 'bg-slate-100 text-slate-500' },
}

// Ticket pas encore classifié par le superviseur ou l'IA.
const UNCLASSIFIED = { label: 'Non classé', className: 'bg-slate-100 text-slate-400' }

function PriorityBadge({ priority }) {
  const p = PRIORITY_STYLES[priority] ?? UNCLASSIFIED
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap ${p.className}`}>
      {p.label}
    </span>
  )
}

export default PriorityBadge
