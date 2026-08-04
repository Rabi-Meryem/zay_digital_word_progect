// src/api/passwordResetService.js
// ─────────────────────────────────────────────────────────────────────────────
// Demande de réinitialisation de mot de passe — libre-service (écran 1.1).
//
// ÉTAT RÉEL DU BACKEND (vérifié dans le dépôt) :
//   • Il n'existe PAS de fichier users/service.py.
//   • La seule réinitialisation existante est :
//       POST /api/users/<id>/reset-password/   (users/views.py → PasswordResetView)
//     → réservée au rôle ADMIN (permission IsAdminRole), corps
//       { new_password, confirm_password }. C'est l'ADMIN qui fixe le nouveau
//       mot de passe : ce n'est pas une demande faite PAR l'utilisateur.
//   • Aucune route ne permet à un client / agent / superviseur de DEMANDER
//     une réinitialisation.
//
// Cette couche appelle la route ajoutée par le patch backend fourni :
//   POST /api/auth/password-reset-request/   { email }
// → enregistre la demande dans les logs d'audit et notifie les administrateurs,
//   qui traitent ensuite la demande depuis l'écran 3.2 (Gestion des utilisateurs
//   → icône clé → « Réinitialiser le mot de passe »).
//
// Tant que le patch n'est pas appliqué, l'appel renvoie 404 : l'interface
// affiche quand même le message neutre côté utilisateur (bonne pratique de
// sécurité : ne jamais révéler si un compte existe) et signale le problème
// dans la console uniquement en développement.
// ─────────────────────────────────────────────────────────────────────────────

import apiClient from './axiosClient'

export const ROUTE_ABSENTE = 'ROUTE_ABSENTE'

export async function requestPasswordReset(email) {
  try {
    const { data } = await apiClient.post('/auth/password-reset-request/', { email })
    return { transmis: true, data }
  } catch (error) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      // Le patch backend n'est pas encore appliqué.
      return { transmis: false, raison: ROUTE_ABSENTE }
    }
    throw error
  }
}
