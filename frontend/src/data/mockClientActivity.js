// ⚠️ DONNÉES FICTIVES — complète mockTickets.js pour le tableau de bord client.
// Le backend expose déjà les modèles Ticket / TicketMessage : ce jeu de données
// sera remplacé par GET /api/activities/ dès que la route existera.

// Activités récentes, tous tickets confondus (ligne 3 du dashboard).
export const MOCK_ACTIVITES = [
  { id: 1, ticket: 'TK-2026-00046', ticketId: 46, libelle: 'Correctif appliqué par Ahmed Karimi', quand: 'il y a 12 min', type: 'agent' },
  { id: 2, ticket: 'TK-2026-00043', ticketId: 43, libelle: "Demande d'informations complémentaires", quand: 'il y a 1 h', type: 'attente' },
  { id: 3, ticket: 'TK-2026-00048', ticketId: 48, libelle: 'Ticket escaladé au niveau 2', quand: 'il y a 2 h', type: 'escalade' },
  { id: 4, ticket: 'TK-2026-00051', ticketId: 51, libelle: 'Ticket créé — en attente de prise en charge', quand: 'il y a 1 h', type: 'client' },
  { id: 5, ticket: 'TK-2026-00046', ticketId: 46, libelle: "Ticket classé Critique par l'IA", quand: 'il y a 2 h', type: 'ia' },
  { id: 6, ticket: 'TK-2026-00045', ticketId: 45, libelle: 'Ticket résolu — évaluation enregistrée', quand: 'il y a 2 j', type: 'resolu' },
]

// Préférences de notification (TODO API : PATCH /api/users/me/preferences/).
export const NOTIFICATION_EVENTS = [
  { cle: 'creation', label: 'Création du ticket', portail: true, email: true },
  { cle: 'statut', label: 'Changement de statut', portail: true, email: true },
  { cle: 'info', label: "Demande d'informations complémentaires", portail: true, email: true },
  { cle: 'resolution', label: 'Résolution du ticket', portail: true, email: true },
  { cle: 'sla', label: 'Dépassement ou risque de dépassement du SLA', portail: true, email: false },
]
