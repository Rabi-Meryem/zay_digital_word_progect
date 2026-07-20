// frontend/src/api/tickets.js
import apiClient from './axiosClient'

// Liste des tickets — le backend filtre automatiquement par rôle
export const fetchTickets = async (params = {}) => {
  const { data } = await apiClient.get('/tickets/', { params })
  return data  // { total, page, results: [...] }
}

// Détail d'un ticket
export const fetchTicket = async (id) => {
  const { data } = await apiClient.get(`/tickets/${id}/`)
  return data
}

// Créer un ticket (client)
export const createTicket = async ({ title, description }) => {
  const { data } = await apiClient.post('/tickets/', { title, description })
  return data
}

// Superviseur : définir priorité + assigner agent
export const setPriorityAndAssign = async (id, priority, agentId) => {
  const { data } = await apiClient.post(`/tickets/${id}/set-priority/`, {
    priority,
    agent_id: agentId,
  })
  return data
}

// Agent : prendre en charge
export const takeTicket = async (id) => {
  const { data } = await apiClient.post(`/tickets/${id}/take/`)
  return data
}

// Agent : résoudre
export const resolveTicket = async (id, resolutionNote) => {
  const { data } = await apiClient.post(`/tickets/${id}/resolve/`, {
    resolution_note: resolutionNote,
  })
  return data
}

// Agent : escalader
export const escalateTicket = async (id, reason) => {
  const { data } = await apiClient.post(`/tickets/${id}/escalate/`, { reason })
  return data
}

// Client : rouvrir
export const reopenTicket = async (id, reason) => {
  const { data } = await apiClient.post(`/tickets/${id}/reopen/`, { reason })
  return data
}

// Client : évaluer
export const rateTicket = async (id, rating, comment = '') => {
  const { data } = await apiClient.post(`/tickets/${id}/rate/`, { rating, comment })
  return data
}

// Historique d'un ticket
export const fetchTicketHistory = async (id) => {
  const { data } = await apiClient.get(`/tickets/${id}/history/`)
  return data
}

// Upload pièce jointe
export const uploadAttachment = async (ticketId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post(
    `/tickets/${ticketId}/attachments/upload/`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

// Pièces jointes d'un ticket
export const fetchAttachments = async (ticketId) => {
  const { data } = await apiClient.get(`/tickets/${ticketId}/attachments/`)
  return data
}