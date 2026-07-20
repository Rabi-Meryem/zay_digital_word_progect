// src/api/adminApi.js
// Couche d'accès API pour l'espace administrateur.
// S'appuie sur les routes REST réellement exposées par le backend Django
// (apps: users, logs_app, sla, escalation, notifications, tickets).
//
// Les endpoints marqués "TODO API" ne sont pas encore exposés côté serveur
// (SLARule et SMTPConfiguration n'ont pas de route) -> voir points à remonter
// à Rabi-Meryem. Ils sont branchés sur des mocks tant que la route n'existe pas.

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const client = axios.create({ baseURL: API_BASE });

// Injection du JWT (même mécanisme que le reste du portail)
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---------- USERS (app users) ----------
export const usersApi = {
  list: (params) => client.get("/users/", { params }),            // GET /api/users/
  retrieve: (id) => client.get(`/users/${id}/`),                  // GET /api/users/:id/
  create: (data) => client.post("/users/", data),                 // POST /api/users/
  update: (id, data) => client.patch(`/users/${id}/`, data),      // PATCH /api/users/:id/
  remove: (id) => client.delete(`/users/${id}/`),                 // DELETE /api/users/:id/
  activate: (id) => client.post(`/users/${id}/activate/`),        // POST .../activate/
  resetPassword: (id) => client.post(`/users/${id}/reset-password/`),
};

// ---------- LOGS & AUDIT (app logs_app) ----------
export const logsApi = {
  stats: () => client.get("/logs/stats/"),                        // GET /api/logs/stats/
  list: (params) => client.get("/logs/", { params }),             // GET /api/logs/
  anomalies: () => client.get("/logs/anomalies/"),                // GET /api/logs/anomalies/
  auditByUser: (userId) => client.get(`/logs/audit/user/${userId}/`),
  auditByTicket: (ticketId) => client.get(`/logs/audit/ticket/${ticketId}/`),
};

// ---------- ESCALATIONS (app escalation) ----------
export const escalationApi = {
  list: (params) => client.get("/escalations/", { params }),      // GET /api/escalations/
  resolve: (id) => client.post(`/escalations/${id}/resolve/`),
};

// ---------- NOTIFICATIONS (app notifications) ----------
export const notificationsApi = {
  types: () => client.get("/notifications/types/"),               // NotificationType
  channels: () => client.get("/notifications/channels/"),         // NotificationChannel
  history: () => client.get("/notifications/history/"),           // NotificationHistory
  toggle: (typeId, channel, enabled) =>
    client.patch(`/notifications/types/${typeId}/`, { [channel]: enabled }),
};

// ---------- IA / TICKETS (app tickets) ----------
export const aiApi = {
  // Champs ai_priority / ai_confidence portés par le modèle Ticket
  predictions: (params) => client.get("/tickets/", { params }),   // GET /api/tickets/
  overrided: (id, priority) => client.patch(`/tickets/${id}/`, { priority }),
};

// ---------- SLA (app sla) — TODO API: pas de route GET /api/sla/rules/ ----------
export const slaApi = {
  // Le modèle SLARule existe mais aucune route ne l'expose (cf. récap §4.4).
  // On garde la signature pour brancher dès que la route existe.
  rules: () => client.get("/sla/rules/"),
  updateRule: (id, data) => client.patch(`/sla/rules/${id}/`, data),
};

export default client;
