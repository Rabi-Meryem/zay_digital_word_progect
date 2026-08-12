// frontend/src/api/users.js
import apiClient from './axiosClient'

// Recherche de clients — utilisée par le superviseur pour créer un ticket
// pour le compte d'un client (voir SupervisorNewTicketPage.jsx).
export const searchClients = async (query = '') => {
  const { data } = await apiClient.get('/users/clients/', {
    params: { search: query },
  })
  return data
}