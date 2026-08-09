// Badge de statut affiché côté client (dashboard + carte ticket).
//
// Contrairement à StatusBadge (vue agent/superviseur, qui affiche le statut
// interne brut : Affecté, En attente, Escaladé...), ce composant traduit
// current_status vers les 5 statuts que le client doit voir :
// Créé, En cours, Résolu, Fermé, Réouvert.

const CLIENT_STATUS_STYLES = {
  OPEN: { label: 'Créé', className: 'bg-slate-100 text-slate-600' },
  ASSIGNED: { label: 'En cours', className: 'bg-secondary/10 text-secondary' },
  IN_PROGRESS: { label: 'En cours', className: 'bg-secondary/10 text-secondary' },
  WAITING: { label: 'En cours', className: 'bg-secondary/10 text-secondary' },
  ESCALATED: { label: 'En cours', className: 'bg-secondary/10 text-secondary' },
  RESOLVED: { label: 'Résolu', className: 'bg-success/10 text-success' },
  CLOSED: { label: 'Fermé', className: 'bg-slate-100 text-slate-500' },
  REOPENED: { label: 'Réouvert', className: 'bg-accent/10 text-accent' },
}

function ClientStatusBadge({ status }) {
  const s = CLIENT_STATUS_STYLES[status] ?? CLIENT_STATUS_STYLES.OPEN
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${s.className}`}>
      {s.label}
    </span>
  )
}

export default ClientStatusBadge
