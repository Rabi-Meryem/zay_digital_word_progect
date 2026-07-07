import axios from 'axios'
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  clearTokens,
} from './tokenStorage'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Ajoute automatiquement le token JWT sur chaque requête, si présent.
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si une requête échoue avec 401 (token expiré), on tente un rafraîchissement
// une seule fois via /auth/refresh/, puis on rejoue la requête d'origine.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const refreshToken = getRefreshToken()

    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login/')

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      refreshToken &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh/`,
          { refresh: refreshToken }
        )
        setAccessToken(data.access)
        originalRequest.headers.Authorization = `Bearer ${data.access}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
