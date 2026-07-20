import apiClient from './axiosClient'

// Profil de l'ADMINISTRATEUR connecté.
// Contrairement aux autres rôles, l'admin a le droit de modifier lui-même son
// rôle et son mot de passe, via les routes réelles de gestion des utilisateurs :
//   PATCH /api/users/{id}/               (UserUpdateSerializer : first_name,
//                                          last_name, phone, is_active, role_id)
//   POST  /api/users/{id}/reset-password/ { new_password, confirm_password }
// Le profil de base reste lisible via GET /api/auth/me/.

export async function fetchMyProfile() {
  const { data } = await apiClient.get('/auth/me/')
  return data
}

// Mise à jour libre (rôle inclus) — réservée à l'admin sur son propre compte.
export async function updateAdminSelf(userId, { first_name, last_name, phone, role_id }) {
  const body = { first_name, last_name, phone }
  if (role_id != null) body.role_id = role_id
  const { data } = await apiClient.patch(`/users/${userId}/`, body)
  return data
}

// Changement de mot de passe (l'admin le fait lui-même).
export async function changeAdminPassword(userId, { new_password, confirm_password }) {
  const { data } = await apiClient.post(`/users/${userId}/reset-password/`, {
    new_password, confirm_password,
  })
  return data
}
