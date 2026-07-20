// Cartographie métier : les 15 modules applicatifs répartis sur les 4 blocs
// fonctionnels de la plateforme.
//
// ⚠️ Le bloc concerné est une variable d'entrée du modèle de classification de
// criticité (encodé en one-hot et concaténé au vecteur TF-IDF de la description).
// Il n'existe pas encore de champ correspondant sur le modèle Ticket côté Django :
// l'ajout d'un champ `module_concerne` (ou `bloc_concerne`) est nécessaire pour
// que la prédiction dispose de cette variable à la création du ticket.

export const BLOCS = [
  {
    cle: 'collecte',
    label: 'Collecte',
    modules: ['Import de fichiers', 'Connecteurs API', 'Saisie manuelle', 'Ordonnancement'],
  },
  {
    cle: 'fiabilisation',
    label: 'Fiabilisation',
    modules: ['Contrôles qualité', 'Déduplication', 'Normalisation', 'Rapprochement'],
  },
  {
    cle: 'decision',
    label: 'Aide à la décision',
    modules: ['Moteur de règles', 'Scoring', 'Simulation', 'Alerting'],
  },
  {
    cle: 'restitution',
    label: 'Restitution',
    modules: ['Tableaux de bord', 'Exports', 'Diffusion planifiée'],
  },
]

/** Retourne le bloc fonctionnel auquel appartient un module. */
export function blocDuModule(module) {
  return BLOCS.find((b) => b.modules.includes(module))?.label ?? null
}
