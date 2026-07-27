// frontend/src/api/sla.js
import apiClient from './axiosClient'

// Liste des 4 règles SLA (pas de pagination côté backend pour cet endpoint)
export const fetchSlaRules = async () => {
  const { data } = await apiClient.get('/sla-rules/')
  return data // tableau simple, pas { results: [...] }
}

// Modifier une règle (délai, seuil d'alerte, actif)
export const updateSlaRule = async (id, payload) => {
  const { data } = await apiClient.patch(`/sla-rules/${id}/`, payload)
  return data
}