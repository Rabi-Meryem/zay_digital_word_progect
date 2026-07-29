// ⚠️ DONNÉES FICTIVES — même principe que mockTickets.js (côté client) :
// aucune API "tickets assignés à l'agent" n'existe encore côté backend.
// La forme copie les modèles Django réels (Ticket : description, ai_priority,
// ai_confidence, sla_deadline… + TicketMessage + TicketAttachment) pour qu'un
// futur GET /api/tickets/?assigned_to=me soit un remplacement direct.
//
// Répartition alignée sur la maquette Écran 2.1 : 2 Critiques, 3 Hautes,
// 3 Moyennes, 12 Basses (les compteurs sont CALCULÉS depuis cette liste).
// NB : "category" est illustratif en attendant le module Catégories (Écran 3.2).
import { fakeSlaDeadline } from '../utils/mockSlaHelper'


const HOUR = 60 * 60 * 1000
const MIN = 60 * 1000

function ago(ms) {
  return new Date(Date.now() - ms).toISOString()
}

// Message de conversation — forme calquée sur messages_app/ticket_message :
// l'auteur est 'AGENT' (vous) ou 'CLIENT', "at" est un ISO calculé par
// décalage depuis la création du ticket (les heures restent donc réalistes).
function msg(id, author, createdAtIso, minutesAfter, text) {
  return {
    id,
    author,
    text,
    at: new Date(new Date(createdAtIso).getTime() + minutesAfter * MIN).toISOString(),
  }
}

// Clients fictifs (avec leur société, affichée sous le titre du ticket)
const MERYEM = { id: 10, first_name: 'Meryem', last_name: 'Rabi', company: 'Société X' }
const OMAR = { id: 11, first_name: 'Omar', last_name: 'Tazi', company: 'Entreprise Y' }
const NADIA = { id: 12, first_name: 'Nadia', last_name: 'Alaoui', company: 'Société X' }
const KARIM = { id: 13, first_name: 'Karim', last_name: 'Said', company: 'Cabinet Amrani' }

function ticket({ createdAt, priority, ...rest }) {
  return {
    unread_messages: 0,
    current_status: 'ASSIGNED',
    category: 'Divers',
    description: '',
    ai_priority: null,
    ai_confidence: null, // 0 → 1, comme le DecimalField du modèle
    attachments: [],
    messages: [],
    priority,
    created_at: createdAt,
    sla_deadline: fakeSlaDeadline(createdAt, priority),
    ...rest,
  }
}

// ── Tickets urgents (rédigés à la main pour coller aux Écrans 2.1 et 2.2) ──
const T48_CREATED = ago(2 * HOUR + 20 * MIN) // → SLA (2h) déjà dépassé : barre rouge
const T46_CREATED = ago(37 * MIN)            // → ~1h 23min restantes (maquette)
const T45_CREATED = ago(6 * HOUR + 50 * MIN) // → ~1h 10min : barre orange (seuil 80 %)
const T44_CREATED = ago(4 * HOUR + 20 * MIN) // → ~3h 40min restantes (maquette)
const T43_CREATED = ago(6 * HOUR)            // → ~18h restantes (maquette)

const URGENT_TICKETS = [
  // Critiques (SLA 2h)
  ticket({
    id: 148,
    ticket_number: 'TK-2026-00048',
    title: 'Serveur de production injoignable',
    client: OMAR,
    priority: 'CRITICAL',
    ai_priority: 'CRITICAL',
    ai_confidence: 0.97,
    category: 'Infrastructure',
    current_status: 'IN_PROGRESS',
    unread_messages: 1,
    description:
      "Depuis 10h, le serveur de production ne répond plus (timeout sur toutes les requêtes). " +
      "Les équipes ne peuvent plus travailler. Le redémarrage à distance a échoué.",
    createdAt: T48_CREATED,
    messages: [
      msg(1, 'AGENT', T48_CREATED, 10,
        "Bonjour Omar, je prends votre incident en charge en priorité. Pouvez-vous me confirmer si le ping vers le serveur répond ?"),
      msg(2, 'CLIENT', T48_CREATED, 130,
        "Bonjour, non, aucun ping ne passe. Toute l'équipe est bloquée, c'est urgent."),
    ],
  }),
  ticket({
    id: 146,
    ticket_number: 'TK-2026-00046',
    title: 'Application ne démarre plus',
    client: MERYEM,
    priority: 'CRITICAL',
    ai_priority: 'CRITICAL',
    ai_confidence: 0.94,
    category: 'Bug système',
    current_status: 'IN_PROGRESS',
    unread_messages: 2,
    description:
      "Depuis ce matin 9h, mon application de gestion plante au démarrage. " +
      'Message : "Cannot connect to server". Redémarrage PC sans succès.',
    attachments: [{ id: 1, file_name: 'screenshot_erreur.png' }],
    createdAt: T46_CREATED,
    // Conversation de la maquette Écran 2.3
    messages: [
      msg(1, 'AGENT', T46_CREATED, 8,
        "Bonjour Meryem, j'ai bien reçu votre ticket. Pouvez-vous me préciser la version de votre application ?"),
      msg(2, 'CLIENT', T46_CREATED, 20,
        'Bonjour Ahmed ! C\'est la version 3.2.1. Le message d\'erreur est "Cannot connect to server".'),
      msg(3, 'AGENT', T46_CREATED, 30,
        "Merci. J'ai identifié le problème — c'est lié à la mise à jour du serveur d'hier soir. " +
        "Je travaille sur la solution, je reviens vers vous dans 30 minutes."),
      msg(4, 'CLIENT', T46_CREATED, 34,
        "D'accord, merci beaucoup pour votre réactivité !"),
    ],
  }),

  // Hautes (SLA 8h)
  ticket({
    id: 145,
    ticket_number: 'TK-2026-00045',
    title: "Erreur 500 à l'export des rapports",
    client: NADIA,
    priority: 'HIGH',
    ai_priority: 'HIGH',
    ai_confidence: 0.91,
    category: 'Bug système',
    current_status: 'IN_PROGRESS',
    unread_messages: 1,
    description:
      "L'export PDF des rapports mensuels renvoie une erreur 500 depuis la mise à jour. " +
      "L'export Excel fonctionne normalement.",
    createdAt: T45_CREATED,
    messages: [
      msg(1, 'AGENT', T45_CREATED, 60,
        "Bonjour Nadia, pouvez-vous me préciser quel rapport déclenche l'erreur ?"),
      msg(2, 'CLIENT', T45_CREATED, 390,
        "Bonjour, c'est le rapport « Synthèse mensuelle » uniquement, les autres passent."),
    ],
  }),
  ticket({
    id: 144,
    ticket_number: 'TK-2026-00044',
    title: "Impossible d'accéder au portail admin",
    client: OMAR,
    priority: 'HIGH',
    ai_priority: 'HIGH',
    ai_confidence: 0.88,
    category: 'Accès / Auth',
    description:
      "Mon compte administrateur est refusé sur le portail d'administration " +
      "(« accès non autorisé ») alors que mes droits n'ont pas changé.",
    createdAt: T44_CREATED,
  }),
  ticket({
    id: 142,
    ticket_number: 'TK-2026-00042',
    title: 'VPN se déconnecte toutes les 5 minutes',
    client: KARIM,
    priority: 'HIGH',
    ai_priority: 'MEDIUM',
    ai_confidence: 0.62, // confiance faible → requalifié Haute par l'agent
    category: 'Réseau',
    description:
      'Le VPN se coupe environ toutes les 5 minutes depuis hier, sur plusieurs postes du cabinet.',
    createdAt: ago(1 * HOUR),
  }),

  // Moyennes (SLA 24h)
  ticket({
    id: 141,
    ticket_number: 'TK-2026-00041',
    title: 'Mise à jour bloquée à 80 %',
    client: NADIA,
    priority: 'MEDIUM',
    ai_priority: 'MEDIUM',
    ai_confidence: 0.9,
    category: 'Bug système',
    current_status: 'IN_PROGRESS',
    description:
      "La mise à jour du client lourd reste bloquée à 80 % sur mon poste, même après redémarrage.",
    createdAt: ago(20 * HOUR), // → ~4h restantes : barre orange
  }),
  ticket({
    id: 143,
    ticket_number: 'TK-2026-00043',
    title: 'Erreur sur la facture de mars',
    client: MERYEM,
    priority: 'MEDIUM',
    ai_priority: 'MEDIUM',
    ai_confidence: 0.93,
    category: 'Facturation',
    current_status: 'WAITING',
    unread_messages: 1,
    description:
      "Le montant de la facture de mars ne correspond pas au devis validé (écart de 480 MAD).",
    createdAt: T43_CREATED,
    messages: [
      msg(1, 'AGENT', T43_CREATED, 60,
        "Bonjour Meryem, je transmets votre facture au service concerné pour vérification."),
      msg(2, 'CLIENT', T43_CREATED, 300,
        "Merci ! Pour info, l'écart vient peut-être de la remise de 10 % prévue au devis."),
    ],
  }),
  ticket({
    id: 139,
    ticket_number: 'TK-2026-00039',
    title: 'Demande de réinitialisation de mot de passe',
    client: OMAR,
    priority: 'MEDIUM',
    ai_priority: 'LOW',
    ai_confidence: 0.71,
    category: 'Accès / Auth',
    description: "Un collaborateur n'arrive plus à se connecter, demande de réinitialisation.",
    createdAt: ago(3 * HOUR),
  }),
]

// ── 12 tickets Basse priorité (SLA 72h), générés en série ───────────────────
const LOW_TITLES = [
  'Question sur la facturation annuelle',
  "Demande d'augmentation de quota",
  'Lenteur ponctuelle sur le portail',
  "Ajout d'un utilisateur secondaire",
  'Question sur les sauvegardes',
  'Mise à jour des coordonnées de contact',
  'Demande de documentation API',
  'Icône manquante sur le tableau de bord',
  "Problème d'affichage sur mobile",
  'Demande de formation visioconférence',
  'Question sur le renouvellement du contrat',
  'Export CSV : colonne dupliquée',
]
const LOW_CLIENTS = [MERYEM, OMAR, NADIA, KARIM]

const LOW_TICKETS = LOW_TITLES.map((title, i) =>
  ticket({
    id: 120 + i,
    ticket_number: `TK-2026-000${20 + i}`,
    title,
    client: LOW_CLIENTS[i % LOW_CLIENTS.length],
    priority: 'LOW',
    description: `${title} — demande transmise via le portail client.`,
    createdAt: ago((i + 4) * 5 * HOUR),
  })
)

export const MOCK_AGENT_TICKETS = [...URGENT_TICKETS, ...LOW_TICKETS]
