import apiClient from './axiosClient'
import { getRefreshToken } from './tokenStorage'

// Contrat confirmé à partir de backend/users/views.py (branche feature/jwt-authentication) :
//   POST /api/auth/login/   body: { email, password }        -> { access, refresh, user: {...} }
//   POST /api/auth/logout/  body: { refresh }  (auth requise) -> 200
//   GET  /api/auth/me/                         (auth requise) -> { id, first_name, last_name, email, role: {id, name}, ... }

export async function loginRequest({ email, password }) {
  const { data } = await apiClient.post('/auth/login/', { email, password })
  return data
}

export async function logoutRequest() {
  // LogoutView blackliste le refresh token : il faut le renvoyer dans le body.
  await apiClient.post('/auth/logout/', { refresh: getRefreshToken() })
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get('/auth/me/')
  return data
}
