// Données de démonstration pour l'espace superviseur (Écrans 3.x).
// Vue frontend seule : à remplacer par les vraies routes API quand elles seront
// exposées côté backend, p. ex.
//   GET /api/supervisor/kpis/            -> MOCK_KPIS
//   GET /api/escalations/?status=pending -> MOCK_ESCALATIONS
//   GET /api/agents/performance/         -> MOCK_AGENTS
// La forme des objets reste proche des modèles Django (priority, current_status,
// created_at, sla_deadline...) pour un raccordement direct.

import { computeSlaDeadline } from '../utils/sla'

const now = Date.now()
const hoursAgo = (h) => new Date(now - h * 3600_000).toISOString()

// Petit utilitaire : à partir d'une ancienneté et d'une priorité, on déduit
// created_at + sla_deadline pour que la <SlaBar> calcule couleur et libellé
// exactement comme pour les tickets agent.
function sla(hAgo, priority) {
  const createdAt = hoursAgo(hAgo)
  return { createdAt, slaDeadline: computeSlaDeadline(createdAt, priority) }
}

// ── Écran 3.1 — KPIs ────────────────────────────────────────────────────────
export const MOCK_KPIS = {
  total: 1284,
  open: 312,
  inProgress: 168,
  resolved: 804,
  criticalActive: 9,
  slaBreached: 14,
  slaCompliance: 92, // %
  satisfaction: 4.4, // /5
}

// Volume créés / résolus (7 derniers jours)
export const MOCK_VOLUME = [
  { day: 'Lun', crees: 42, resolus: 38 },
  { day: 'Mar', crees: 55, resolus: 50 },
  { day: 'Mer', crees: 48, resolus: 52 },
  { day: 'Jeu', crees: 63, resolus: 58 },
  { day: 'Ven', crees: 58, resolus: 60 },
  { day: 'Sam', crees: 70, resolus: 64 },
  { day: 'Dim', crees: 52, resolus: 58 },
]

// Répartition par statut
export const MOCK_STATUS = [
  { name: 'Ouvert', value: 312 },
  { name: 'En cours', value: 168 },
  { name: 'Résolu', value: 804 },
]

// Classification IA (part de chaque criticité, %)
export const MOCK_AI_CLASS = [
  { name: 'Critique', value: 9 },
  { name: 'Haute', value: 22 },
  { name: 'Moyenne', value: 41 },
  { name: 'Basse', value: 28 },
]

// Fiabilité du module de classification (Mistral / fallback)
export const MOCK_AI_CONF = [
  { label: 'Classification Critique', value: 96 },
  { label: 'Classification Haute', value: 89 },
  { label: 'Classification Moyenne', value: 85 },
  { label: 'Classification Basse', value: 91 },
]
export const MOCK_AI_CONF_AVG = 90.3

// ── Écran 3.2 — Escalades reçues ────────────────────────────────────────────
// reason.key : COMPETENCE | ACCESS | SLA_RISK | CLIENT  (les 4 motifs de l'Écran 2.4)
// state      : 'pending' (à traiter) | 'taken' (prise en charge)
export const MOCK_ESCALATIONS = [
  {
    id: 48,
    number: '#00048',
    date: '08/07/2026',
    title: 'Serveur de production injoignable',
    client: 'Omar Tazi',
    company: 'Entreprise Y',
    priority: 'CRITICAL',
    escalatedBy: { name: 'Ahmed Karimi', initials: 'AK', color: '#1E3A5F' },
    reason: { key: 'ACCESS', label: 'Accès requis · droits admin' },
    context:
      "Problème serveur lié à la mise à jour d'hier soir. J'ai tenté la réinitialisation du fichier de config sans succès. Besoin d'un accès base de données Niveau 2.",
    state: 'pending',
    ...sla(6, 'CRITICAL'), // -> dépassé
  },
  {
    id: 45,
    number: '#00045',
    date: '08/07/2026',
    title: "Erreur 500 à l'export des rapports",
    client: 'Nadia Alaoui',
    company: 'Société X',
    priority: 'HIGH',
    escalatedBy: { name: 'Ahmed Karimi', initials: 'AK', color: '#1E3A5F' },
    reason: { key: 'COMPETENCE', label: 'Hors compétences · Niveau 2' },
    context:
      "L'export PDF de la synthèse mensuelle renvoie une 500 côté backend depuis la dernière mise à jour. Nécessite l'analyse d'un développeur, hors de mon périmètre.",
    state: 'pending',
    ...sla(7, 'HIGH'), // -> à risque (~1h restante)
  },
  {
    id: 43,
    number: '#00043',
    date: '07/07/2026',
    title: 'Litige facturation — écart de 480 MAD',
    client: 'Meryem Rabi',
    company: 'Société X',
    priority: 'HIGH',
    escalatedBy: { name: 'Fatima Rabi', initials: 'FR', color: '#7c3aed' },
    reason: { key: 'CLIENT', label: 'Client insatisfait' },
    context:
      "La cliente conteste le montant et menace de résilier. L'écart vient probablement d'une remise de 10% du devis — décision commerciale au-dessus de mon niveau.",
    state: 'pending',
    ...sla(4, 'HIGH'), // -> ok (~4h restantes)
  },
  {
    id: 38,
    number: '#00038',
    date: '06/07/2026',
    title: 'Perte de données après migration',
    client: 'Omar Tazi',
    company: 'Entreprise Y',
    priority: 'CRITICAL',
    escalatedBy: { name: 'Fatima Rabi', initials: 'FR', color: '#7c3aed' },
    reason: { key: 'SLA_RISK', label: 'Risque SLA' },
    context:
      "Restauration de la dernière sauvegarde en cours avec l'infogérance. Point de suivi prévu à 15h.",
    state: 'taken',
    takenNote: 'Traité par vous depuis 2h',
    ...sla(1.6, 'CRITICAL'), // -> à risque (~24min)
  },
  {
    id: 29,
    number: '#00029',
    date: '05/07/2026',
    title: 'Accès portail admin refusé',
    client: 'Karim Said',
    company: 'Cabinet Amrani',
    priority: 'HIGH',
    escalatedBy: { name: 'Ahmed Karimi', initials: 'AK', color: '#1E3A5F' },
    reason: { key: 'ACCESS', label: 'Accès requis' },
    context:
      "Droits admin réattribués. En attente de confirmation du client avant clôture.",
    state: 'taken',
    takenNote: 'Réaffecté à Salma Idrissi',
    ...sla(3, 'HIGH'), // -> ok
  },
]

// ── Écran 3.4 — Supervision SLA ─────────────────────────────────────────────
export const MOCK_SLA_TICKETS = [
  { number: '#00048', title: 'Serveur injoignable', client: 'Omar Tazi', agent: { initials: 'AK', name: 'A. Karimi', color: '#1E3A5F' }, priority: 'CRITICAL', ...sla(6, 'CRITICAL') },
  { number: '#00036', title: 'Sauvegarde échouée', client: 'Nadia Alaoui', agent: { initials: 'FR', name: 'F. Rabi', color: '#7c3aed' }, priority: 'CRITICAL', ...sla(3, 'CRITICAL') },
  { number: '#00045', title: 'Erreur 500 export', client: 'Nadia Alaoui', agent: { initials: 'AK', name: 'A. Karimi', color: '#1E3A5F' }, priority: 'HIGH', ...sla(7, 'HIGH') },
  { number: '#00050', title: 'Ralentissement réseau', client: 'Karim Said', agent: { initials: 'YB', name: 'Y. Bennani', color: '#0f766e' }, priority: 'HIGH', ...sla(6.6, 'HIGH') },
  { number: '#00041', title: 'Mise à jour bloquée', client: 'Nadia Alaoui', agent: { initials: 'FR', name: 'F. Rabi', color: '#7c3aed' }, priority: 'MEDIUM', ...sla(20, 'MEDIUM') },
  { number: '#00051', title: "Impossible d'accéder au portail", client: 'Meryem Rabi', agent: { initials: 'SI', name: 'S. Idrissi', color: '#0f766e' }, priority: 'HIGH', ...sla(3, 'HIGH') },
]

// ── Écran 3.5 — Performance de l'équipe ─────────────────────────────────────
export const MOCK_AGENTS = [
  { name: 'Ahmed Karimi', initials: 'AK', color: '#1E3A5F', level: 'Niveau 1', handled: 148, avgResolution: '3h 12', slaCompliance: 94, satisfaction: 4.6, activeLoad: 12 },
  { name: 'Fatima Rabi', initials: 'FR', color: '#7c3aed', level: 'Niveau 1', handled: 121, avgResolution: '4h 05', slaCompliance: 90, satisfaction: 4.4, activeLoad: 8 },
  { name: 'Youssef Bennani', initials: 'YB', color: '#0f766e', level: 'Niveau 1', handled: 96, avgResolution: '5h 40', slaCompliance: 82, satisfaction: 4.1, activeLoad: 15 },
  { name: 'Salma Idrissi', initials: 'SI', color: '#0f766e', level: 'Niveau 2', handled: 73, avgResolution: '3h 48', slaCompliance: 88, satisfaction: 4.3, activeLoad: 9 },
]

// ── Notifications (cloche superviseur) ──────────────────────────────────────
// GET /api/notifications/?role=supervisor (+ WebSocket pour le temps réel)
export const MOCK_NOTIFICATIONS = [
  { id: 1, text: 'Le ticket #00046 a dépassé son SLA critique.', time: 'il y a 12 min', read: false },
  { id: 2, text: 'Nouvelle escalade reçue — Ahmed Karimi (#00048).', time: 'il y a 38 min', read: false },
  { id: 3, text: 'Y. Bennani approche de la surcharge (15 tickets actifs).', time: 'il y a 1h', read: false },
  { id: 4, text: 'Rapport hebdomadaire généré avec succès.', time: 'hier', read: true },
]

// Cibles possibles de réaffectation (Écran 3.2 / modale)
export const REASSIGN_TARGETS = [
  { name: 'Ahmed Karimi', initials: 'AK', color: '#1E3A5F', level: 'Agent · Niveau 1', load: 12 },
  { name: 'Fatima Rabi', initials: 'FR', color: '#7c3aed', level: 'Agent · Niveau 1', load: 8 },
  { name: 'Salma Idrissi', initials: 'SI', color: '#0f766e', level: 'Agent · Niveau 2', load: 9 },
  { name: 'Niveau 2 — Infogérance externe', initials: 'N2', color: '#64748b', level: 'Prestataire technique', load: null },
]
