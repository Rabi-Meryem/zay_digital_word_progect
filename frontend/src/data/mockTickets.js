// ⚠️ DONNÉES FICTIVES — le backend expose déjà les modèles Ticket / TicketMessage /
// SLARule (migrations appliquées), mais aucune route REST n'est encore branchée dessus
// (tickets/views.py et messages_app/views.py sont vides, pas de urls.py).
// Ce fichier reproduit exactement la forme des vrais modèles Django pour que le
// remplacement par un vrai appel API (GET /api/tickets/, etc.) soit direct le
// moment venu — voir src/api/ pour l'équivalent du côté authentification.

import { computeSlaDeadline } from '../utils/sla'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const MIN = 60 * 1000

function ago(ms) {
  return new Date(Date.now() - ms).toISOString()
}

const AHMED = { id: 2, first_name: 'Ahmed', last_name: 'Karimi' }
const FATIMA = { id: 3, first_name: 'Fatima', last_name: 'Rabi' }
const KARIM = { id: 4, first_name: 'Karim', last_name: 'Said' }

function ticket({ createdAt, priority, ...rest }) {
  return {
    unread_messages: 0,
    assigned_agent: null,
    rating: null,
    messages: [],
    priority,
    created_at: createdAt,
    sla_deadline: computeSlaDeadline(createdAt, priority),
    ...rest,
  }
}

export const MOCK_TICKETS = [
  // -- Ouverts (3) --
  ticket({
    id: 51,
    ticket_number: 'TK-2026-00051',
    title: "Impossible d'accéder au portail",
    description: "Depuis ce matin, je n'arrive plus à me connecter au portail, la page reste blanche.",
    priority: 'HIGH',
    current_status: 'OPEN',
    createdAt: ago(1 * HOUR),
  }),
  ticket({
    id: 50,
    ticket_number: 'TK-2026-00050',
    title: 'Ralentissement réseau au bureau',
    description: "Le réseau est très lent depuis hier après-midi sur tout l'étage.",
    priority: 'HIGH',
    current_status: 'OPEN',
    createdAt: ago(5 * HOUR),
  }),
  ticket({
    id: 49,
    ticket_number: 'TK-2026-00049',
    title: "Demande d'augmentation de quota de stockage",
    description: "Pourriez-vous augmenter mon quota de stockage, je suis à 95% d'utilisation.",
    priority: 'LOW',
    current_status: 'ASSIGNED',
    assigned_agent: KARIM,
    createdAt: ago(1 * DAY),
  }),

  // -- En cours (4) --
  ticket({
    id: 46,
    ticket_number: 'TK-2026-00046',
    title: 'Application ne démarre plus',
    description:
      'Depuis ce matin 9h, mon application de gestion plante au démarrage. Message : "Cannot connect to server". Redémarrage PC sans succès.',
    priority: 'CRITICAL',
    current_status: 'IN_PROGRESS',
    assigned_agent: AHMED,
    unread_messages: 2,
    createdAt: ago(2 * HOUR + 15 * MIN),
    messages: [
      {
        id: 1,
        author: 'agent',
        text: "Bonjour, j'ai bien reçu votre ticket. Pouvez-vous me préciser la version de votre application ?",
        sentAt: ago(2 * HOUR),
      },
      {
        id: 2,
        author: 'client',
        text: 'Bonjour Ahmed ! C\'est la version 3.2.1. Le message d\'erreur est "Cannot connect to server".',
        sentAt: ago(90 * MIN),
      },
      {
        id: 3,
        author: 'agent',
        text: "Merci. J'ai identifié le problème — je travaille sur la solution, je reviens vers vous dans 30 minutes.",
        sentAt: ago(70 * MIN),
      },
    ],
  }),
  ticket({
    id: 43,
    ticket_number: 'TK-2026-00043',
    title: 'Erreur sur ma facture de mars',
    description: 'Le montant facturé ne correspond pas à mon abonnement habituel.',
    priority: 'MEDIUM',
    current_status: 'WAITING',
    assigned_agent: FATIMA,
    createdAt: ago(1 * DAY + 4 * HOUR),
    messages: [
      {
        id: 1,
        author: 'client',
        text: "Bonjour, le montant facturé ce mois-ci est plus élevé que d'habitude.",
        sentAt: ago(1 * DAY),
      },
      {
        id: 2,
        author: 'agent',
        text: 'Je vérifie avec la facturation et reviens vers vous rapidement.',
        sentAt: ago(20 * HOUR),
      },
    ],
  }),
  ticket({
    id: 48,
    ticket_number: 'TK-2026-00048',
    title: "Erreur 500 lors de l'export PDF",
    description: "L'export en PDF de mes rapports échoue systématiquement avec une erreur 500.",
    priority: 'CRITICAL',
    current_status: 'ESCALATED',
    assigned_agent: AHMED,
    createdAt: ago(3 * HOUR),
  }),
  ticket({
    id: 47,
    ticket_number: 'TK-2026-00047',
    title: 'Mot de passe oublié, compte bloqué',
    description: "J'ai fait trop de tentatives de connexion et mon compte est maintenant bloqué.",
    priority: 'HIGH',
    current_status: 'IN_PROGRESS',
    assigned_agent: AHMED,
    unread_messages: 1,
    createdAt: ago(4 * HOUR),
  }),

  // -- Résolus / Clôturés (8) --
  ticket({
    id: 40,
    ticket_number: 'TK-2026-00040',
    title: 'Question sur mon abonnement',
    description: 'Je voulais savoir ce qui est inclus dans mon offre actuelle.',
    priority: 'LOW',
    current_status: 'RESOLVED',
    assigned_agent: KARIM,
    rating: 4,
    createdAt: ago(6 * DAY),
  }),
  ticket({
    id: 41,
    ticket_number: 'TK-2026-00041',
    title: 'Facture en double reçue par email',
    description: "J'ai reçu deux fois la même facture par email ce mois-ci.",
    priority: 'MEDIUM',
    current_status: 'RESOLVED',
    assigned_agent: FATIMA,
    rating: 5,
    createdAt: ago(5 * DAY),
  }),
  ticket({
    id: 42,
    ticket_number: 'TK-2026-00042',
    title: 'Configuration VPN ne fonctionne pas',
    description: 'Impossible de me connecter au VPN depuis mon domicile.',
    priority: 'HIGH',
    current_status: 'RESOLVED',
    assigned_agent: AHMED,
    rating: 3,
    createdAt: ago(4 * DAY),
  }),
  ticket({
    id: 44,
    ticket_number: 'TK-2026-00044',
    title: 'Interface lente sur Firefox',
    description: "L'interface met plusieurs secondes à charger sur Firefox uniquement.",
    priority: 'MEDIUM',
    current_status: 'RESOLVED',
    assigned_agent: KARIM,
    rating: 4,
    createdAt: ago(3 * DAY),
  }),
  ticket({
    id: 45,
    ticket_number: 'TK-2026-00045',
    title: 'Erreur de calcul dans le rapport mensuel',
    description: 'Les totaux affichés dans le rapport mensuel semblent incorrects.',
    priority: 'HIGH',
    current_status: 'RESOLVED',
    assigned_agent: AHMED,
    rating: 5,
    createdAt: ago(2 * DAY),
  }),
  ticket({
    id: 39,
    ticket_number: 'TK-2026-00039',
    title: 'Problème de synchronisation des données',
    description: 'Les données ne se synchronisent plus entre mes appareils depuis 3 jours.',
    priority: 'MEDIUM',
    current_status: 'CLOSED',
    assigned_agent: FATIMA,
    createdAt: ago(8 * DAY),
  }),
  ticket({
    id: 38,
    ticket_number: 'TK-2026-00038',
    title: 'Mise à jour de mes coordonnées',
    description: 'Besoin de mettre à jour mon adresse de facturation.',
    priority: 'LOW',
    current_status: 'CLOSED',
    createdAt: ago(10 * DAY),
  }),
  ticket({
    id: 37,
    ticket_number: 'TK-2026-00037',
    title: 'Demande de formation sur le nouveau module',
    description: 'Souhait de formation pour la nouvelle interface de reporting.',
    priority: 'LOW',
    current_status: 'CLOSED',
    createdAt: ago(12 * DAY),
  }),
]
