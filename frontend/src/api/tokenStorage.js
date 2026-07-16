// Centralise le stockage des tokens JWT (access + refresh).
// Un seul endroit à modifier si on change la stratégie de stockage plus tard
// (ex: passer à des cookies httpOnly gérés côté serveur).

const ACCESS_KEY = 'zay_access_token'
const REFRESH_KEY = 'zay_refresh_token'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(ACCESS_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
}

export function setAccessToken(access) {
  localStorage.setItem(ACCESS_KEY, access)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}
