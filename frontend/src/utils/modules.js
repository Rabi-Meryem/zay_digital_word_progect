// src/utils/modules.js
// ─────────────────────────────────────────────────────────────────────────────
// Les 15 modules proposés au client à la création d'un ticket.
//
// ATTENTION : ces libellés doivent être STRICTEMENT identiques (accents,
// espaces, esperluettes compris) aux clés de regle_module_vers_bloc.joblib.
// Le modèle IA déduit le bloc concerné à partir de cette valeur exacte ;
// un caractère qui diffère et la classification lève « Module inconnu ».
//
// Ils doivent également correspondre aux valeurs de la classe Module
// dans backend/tickets/models/ticket.py.
// ─────────────────────────────────────────────────────────────────────────────

export const MODULES = [
  // Collecte — l'information entre dans le système
  'Import / Export de données',
  'API & Intégrations',
  'Synchronisation',
  // Fiabilisation — elle est stockée, protégée, les accès sont contrôlés
  'Authentification & SSO',
  'Gestion des utilisateurs & Droits',
  'Stockage & Fichiers',
  'Base de données',
  'Module de sécurité',
  // Aide à la décision — elle est calculée, exploitée
  'Paiement & Facturation',
  'Moteur de recherche',
  'Moteur de workflow',
  // Restitution — elle est affichée au client
  'Tableau de bord & Reporting',
  'Application mobile',
  'Interface utilisateur',
  'Notifications & E-mails',
]

export default MODULES
