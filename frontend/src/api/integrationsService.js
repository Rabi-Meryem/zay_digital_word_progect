// src/api/integrationsService.js
// Couche d'accès aux configurations SMTP / IMAP — Écran 3.3 (portail admin).
//
// Routes RÉELLES exposées par le backend (backend/integrations/urls.py) :
//   GET   /api/integrations/smtp/     → configuration SMTP (admin uniquement)
//   PATCH /api/integrations/smtp/     → modifier la configuration SMTP
//   GET   /api/integrations/imap/     → configuration IMAP (admin uniquement)
//   PATCH /api/integrations/imap/     → modifier la configuration IMAP
//   POST  /api/integrations/imap/poll/→ déclencher la relève (protégé X-Cron-Secret)
//
// Routes AJOUTÉES par le patch backend (voir backend_patch/) :
//   POST  /api/integrations/smtp/test/  → envoi d'un email de test
//   POST  /api/integrations/imap/test/  → test de connexion IMAP
// Si le patch n'est pas encore appliqué, ces deux appels renvoient 404 :
// l'interface le signale proprement au lieu de planter.

import apiClient from './axiosClient'

// ── SMTP ────────────────────────────────────────────────────────────────────

export async function getSmtpConfig() {
  const { data } = await apiClient.get('/integrations/smtp/')
  return data
}

export async function updateSmtpConfig(payload) {
  // Le champ password est write_only côté serializer : on ne l'envoie que si
  // l'admin a réellement saisi un nouveau mot de passe.
  const body = { ...payload }
  if (!body.password) delete body.password
  const { data } = await apiClient.patch('/integrations/smtp/', body)
  return data
}

export async function testSmtp(to) {
  const { data } = await apiClient.post('/integrations/smtp/test/', { to })
  return data
}

// ── IMAP ────────────────────────────────────────────────────────────────────

export async function getImapConfig() {
  const { data } = await apiClient.get('/integrations/imap/')
  return data
}

export async function updateImapConfig(payload) {
  const body = { ...payload }
  if (!body.password) delete body.password
  const { data } = await apiClient.patch('/integrations/imap/', body)
  return data
}

export async function testImap() {
  const { data } = await apiClient.post('/integrations/imap/test/')
  return data
}

// ── Utilitaire commun ───────────────────────────────────────────────────────

// Traduit une erreur axios en message lisible pour l'admin.
export function messageErreur(error, defaut = 'Opération impossible.') {
  const s = error?.response?.status
  if (s === 404) {
    return "Route absente du backend — le patch backend n'est pas encore appliqué."
  }
  if (s === 403) {
    return 'Accès refusé : cette configuration est réservée au rôle Administrateur.'
  }
  const d = error?.response?.data
  if (typeof d?.detail === 'string') return d.detail
  if (d && typeof d === 'object') {
    const premier = Object.entries(d)[0]
    if (premier) {
      const [champ, valeur] = premier
      return `${champ} : ${Array.isArray(valeur) ? valeur[0] : valeur}`
    }
  }
  return defaut
}
