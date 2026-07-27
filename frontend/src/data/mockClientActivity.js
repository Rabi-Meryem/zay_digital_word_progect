// ⚠️ DONNÉES FICTIVES — complète mockTickets.js pour le tableau de bord client.
// Le backend expose déjà les modèles Ticket / TicketMessage : ces deux jeux de
// données seront remplacés par GET /api/tickets/{id}/timeline/ et
// GET /api/activities/ dès que les routes existeront.

// Journal des interventions par ticket (clé = ticket.id de mockTickets.js).
export const MOCK_INTERVENTIONS = {
  1: [
    { heure: '09:12', libelle: 'Ticket créé', type: 'client' },
    { heure: '09:13', libelle: 'Classification automatique effectuée par l\'IA', type: 'ia' },
  ],
  46: [
    { heure: '09:12', libelle: 'Ticket créé', type: 'client' },
    { heure: '09:13', libelle: "Classification automatique : Critique (confiance 94 %)", type: 'ia' },
    { heure: '09:18', libelle: 'Ticket pris en charge par Ahmed Karimi', type: 'agent' },
    { heure: '09:42', libelle: "Analyse en cours — demande de la version applicative", type: 'agent' },
    { heure: '10:02', libelle: 'Informations complémentaires transmises', type: 'client' },
    { heure: '10:15', libelle: 'Solution proposée — mise à jour du fichier de configuration', type: 'agent' },
    { heure: '10:40', libelle: 'Correctif appliqué — vérification en cours', type: 'agent' },
  ],
  48: [
    { heure: '08:05', libelle: 'Ticket créé', type: 'client' },
    { heure: '08:06', libelle: 'Classification automatique : Critique (confiance 87 %)', type: 'ia' },
    { heure: '08:48', libelle: 'Ticket pris en charge par Ahmed Karimi', type: 'agent' },
    { heure: '09:30', libelle: 'Escaladé au superviseur — droits administrateur requis', type: 'systeme' },
  ],
  43: [
    { heure: '14:20', libelle: 'Ticket créé', type: 'client' },
    { heure: '14:21', libelle: 'Classification automatique : Moyenne (confiance 91 %)', type: 'ia' },
    { heure: '17:30', libelle: 'Ticket pris en charge par Fatima Rabi', type: 'agent' },
    { heure: '17:45', libelle: "Demande d'informations complémentaires — copie de la facture", type: 'agent' },
  ],
  47: [
    { heure: '11:00', libelle: 'Ticket créé', type: 'client' },
    { heure: '11:01', libelle: 'Classification automatique : Haute (confiance 89 %)', type: 'ia' },
    { heure: '11:20', libelle: 'Ticket pris en charge par Ahmed Karimi', type: 'agent' },
  ],
}

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
