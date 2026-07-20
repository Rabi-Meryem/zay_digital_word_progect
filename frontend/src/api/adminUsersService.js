import apiClient from './axiosClient'

// Gestion des comptes par l'ADMIN — routes réelles (backend/users/urls.py) :
//   GET    /api/users/?role=AGENT&search=..&is_active=true   liste filtrable
//   POST   /api/users/                                        créer un compte
//   PATCH  /api/users/{id}/                                   modifier (rôle inclus pour AGENT/SUPERVISOR)
//   DELETE /api/users/{id}/                                   désactiver (soft delete)
//   POST   /api/users/{id}/activate/                          réactiver
//   POST   /api/users/{id}/reset-password/                    réinitialiser le mot de passe

export async function listUsers({ role, search, is_active } = {}) {
  const params = {}
  if (role) params.role = role
  if (search) params.search = search
  if (is_active !== undefined) params.is_active = is_active
  const { data } = await apiClient.get('/users/', { params })
  return data
}

export async function createUser(payload) {
  // payload : { first_name, last_name, email, phone, role_id, password }
  const { data } = await apiClient.post('/users/', payload)
  return data
}

export async function updateUser(id, payload) {
  const { data } = await apiClient.patch(`/users/${id}/`, payload)
  return data
}

export async function deactivateUser(id) {
  const { data } = await apiClient.delete(`/users/${id}/`)
  return data
}

export async function activateUser(id) {
  const { data } = await apiClient.post(`/users/${id}/activate/`)
  return data
}

export async function resetUserPassword(id, { new_password, confirm_password }) {
  const { data } = await apiClient.post(`/users/${id}/reset-password/`, {
    new_password, confirm_password,
  })
  return data
}
