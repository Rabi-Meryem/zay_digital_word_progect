// src/api/adminMocks.js
// Données de démonstration alignées sur les maquettes admin (écrans 3.1 -> 3.7).
// Utilisées comme fallback tant que la route backend n'est pas disponible.
// Chaque bloc reflète le schéma réel du modèle Django correspondant.

// Barème SLA (identique à utils/sla.js et seed_data.py — cf. dette technique §4.4)
export const SLA_BAREME = {
  CRITICAL: 2,
  HIGH: 8,
  MEDIUM: 24,
  LOW: 72,
};

export const mockLogStats = {
  connexions_aujourdhui: 128,
  echecs_aujourdhui: 6,
  alertes_securite: 3,
  top_ips: [
    { ip: "197.32.xx.xx", echecs: 5 },
    { ip: "91.134.xx.xx", echecs: 4 },
    { ip: "10.154.xx.xx", echecs: 2 },
  ],
  dernieres_alertes: [
    { heure: "09:41", description: "Brute force détecté — 5 échecs en 15 min", ip: "197.32.xx.xx" },
    { heure: "08:12", description: "Connexion à heure inhabituelle (3h du matin)", ip: "91.134.xx.xx" },
    { heure: "Hier", description: "Tentatives répétées sur un compte", ip: "10.154.xx.xx" },
  ],
};

export const mockUsers = [
  { id: 1, full_name: "Ahmed Karimi", email: "ahmed@zay.ma", role: "AGENT", is_active: true, tickets_lies: 8, created_at: "2026-01-12", last_login: "aujourd'hui 09:41" },
  { id: 2, full_name: "Fatima Rabi", email: "fatima@zay.ma", role: "AGENT", is_active: true, tickets_lies: 3 },
  { id: 3, full_name: "Karim Said", email: "karim@zay.ma", role: "SUPERVISOR", is_active: true, tickets_lies: null },
  { id: 4, full_name: "Meryem Rabi", email: "meryem@email.com", role: "CLIENT", is_active: true, tickets_lies: 15 },
  { id: 5, full_name: "Sara Benjelloun", email: "sara@zay.ma", role: "AGENT", is_active: false, tickets_lies: 0 },
];

export const mockSlaRules = [
  { id: 1, priority: "CRITICAL", resolution_hours: 2, alert_threshold: 80, is_active: true },
  { id: 2, priority: "HIGH", resolution_hours: 8, alert_threshold: 80, is_active: true },
  { id: 3, priority: "MEDIUM", resolution_hours: 24, alert_threshold: 80, is_active: true },
  { id: 4, priority: "LOW", resolution_hours: 72, alert_threshold: 80, is_active: true },
];

export const mockEscalations = [
  { id: 1, ticket_number: "TK-2026-00046", type: "MANUAL", from_agent: "Ahmed Karimi", to_supervisor: "Karim Said", reason: "hors compétences, nécessite expertise niveau 2", is_resolved: false, when: "il y a 12 min" },
  { id: 2, ticket_number: "TK-2026-00043", type: "AUTO", from_agent: null, to_supervisor: "Karim Said", reason: "délai de résolution sur le point d'être dépassé", is_resolved: false, when: "il y a 40 min" },
  { id: 3, ticket_number: "TK-2026-00039", type: "MANUAL", from_agent: "Fatima Rabi", to_supervisor: "Karim Said", reason: "client insatisfait, situation conflictuelle", is_resolved: true, when: "hier" },
];

export const mockAiPredictions = {
  moyenne_confiance: 82,
  items: [
    { ticket_number: "TK-2026-00046", ai_priority: "CRITICAL", ai_confidence: 94, priority: "CRITICAL", revised: false },
    { ticket_number: "TK-2026-00045", ai_priority: "MEDIUM", ai_confidence: 61, priority: "HIGH", revised: true },
    { ticket_number: "TK-2026-00044", ai_priority: "HIGH", ai_confidence: 88, priority: "HIGH", revised: false },
  ],
};

export const mockNotifications = {
  canaux_actifs: 2,
  types: [
    { id: 1, label: "Nouveau ticket créé", email: true, in_app: true },
    { id: 2, label: "Ticket affecté à un agent", email: true, in_app: true },
    { id: 3, label: "SLA — avertissement", email: true, in_app: false },
    { id: 4, label: "SLA — dépassé", email: true, in_app: true },
    { id: 5, label: "Ticket résolu", email: true, in_app: true },
    { id: 6, label: "Nouveau message", email: false, in_app: true },
  ],
  historique: [
    { heure: "09:41", texte: "SLA dépassé, TK-2026-00046 → email envoyé" },
    { heure: "09:18", texte: "Ticket affecté, TK-2026-00046 → in-app envoyée" },
  ],
};

export const mockAuditLog = [
  { datetime: "09:41", user: "meryem@email.com", action: "Connexion réussie", target: "—", status: "OK", is_suspicious: false },
  { datetime: "09:38", user: "Système IA", action: "Ticket TK-046 classifié CRITICAL (conf. 94%)", target: "Ticket #046", status: "OK", is_suspicious: false },
  { datetime: "09:20", user: "inconnu", action: "Échec de connexion (3 essais)", target: "—", status: "Suspect", is_suspicious: true },
  { datetime: "09:18", user: "ahmed@zay.ma", action: "Ticket #046 assigné à Fatima Rabi", target: "Ticket #046", status: "OK", is_suspicious: false },
  { datetime: "08:12", user: "Système", action: "Alerte : connexion à heure inhabituelle", target: "—", status: "Suspect", is_suspicious: true },
];

// Modules fonctionnels (pour le formulaire de création utilisateur / filtres IA)
export const MODULES = [
  "Réseau", "Facturation", "Accès / Auth", "Infrastructure",
  "Application", "Base de données", "Sécurité",
];
