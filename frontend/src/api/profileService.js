import apiClient from './axiosClient'

// Profil de l'utilisateur connecté — routes RÉELLES du backend
// (backend/users/urls.py + MeView) :
//   GET   /api/auth/me/   -> { id, first_name, last_name, email, phone, photo, role:{id,name}, ... }
//   PATCH /api/auth/me/   body: { first_name, last_name, phone }  (ProfileUpdateSerializer)
//
// ⚠️ Le rôle et le mot de passe NE sont PAS modifiables ici : ils relèvent
// de l'administrateur (POST/PATCH /api/users/, reset-password). Le formulaire
// « Demande à l'administrateur » ci-dessous n'a pas encore de route dédiée
// (point TODO API) : on simule l'envoi en attendant.

export async function fetchMyProfile() {
  const { data } = await apiClient.get('/auth/me/')
  return data
}

export async function updateMyProfile({ first_name, last_name, phone }) {
  const { data } = await apiClient.patch('/auth/me/', { first_name, last_name, phone })
  return data
}

// Demande envoyée à l'administrateur (changement de rôle OU de mot de passe).
// TODO API : POST /api/users/requests/  { type: 'ROLE'|'PASSWORD', message }
export async function sendAdminRequest({ type, message }) {
  // await apiClient.post('/users/requests/', { type, message })
  return new Promise((resolve) => setTimeout(resolve, 400))
}
