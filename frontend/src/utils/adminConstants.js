// src/utils/adminConstants.js
// Libellés et classes de badges pour l'espace admin.
// Les valeurs machine sont en MAJUSCULES pour coller au backend (current_status,
// priority, role...). Les libellés FR sont dérivés ici uniquement pour l'affichage.

export const PRIORITY_LABELS = {
  CRITICAL: "Critique",
  HIGH: "Haute",
  MEDIUM: "Moyenne",
  LOW: "Basse",
};

export const PRIORITY_BADGE = {
  CRITICAL: "bg-red-100 text-red-700 border border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border border-orange-200",
  MEDIUM: "bg-amber-100 text-amber-700 border border-amber-200",
  LOW: "bg-slate-100 text-slate-600 border border-slate-200",
};

export const ROLE_LABELS = {
  ADMIN: "Administrateur",
  SUPERVISOR: "Superviseur",
  AGENT: "Agent",
  CLIENT: "Client",
};

export const ROLE_BADGE = {
  ADMIN: "bg-violet-100 text-violet-700",
  SUPERVISOR: "bg-blue-100 text-blue-700",
  AGENT: "bg-teal-100 text-teal-700",
  CLIENT: "bg-slate-100 text-slate-600",
};

export const ADMIN_NAV = [
  { key: "overview", label: "Vue d'ensemble", to: "/admin" },
  { key: "users", label: "Utilisateurs", to: "/admin/utilisateurs" },
  { key: "sla", label: "Règles SLA", to: "/admin/sla" },
  { key: "escalations", label: "Escalades", to: "/admin/escalades" },
  { key: "ai", label: "Module IA", to: "/admin/ia" },
  { key: "notifications", label: "Notifications", to: "/admin/notifications" },
  { key: "integrations", label: "Intégrations", to: "/admin/integrations" },
  { key: "audit", label: "Logs & Audit", to: "/admin/audit" },
  { key: "profil", label: "Mon profil", to: "/admin/profil" },
];