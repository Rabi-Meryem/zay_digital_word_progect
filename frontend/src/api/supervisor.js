import apiClient from './axiosClient'

export const fetchSupervisorKpis = async () => {
  const { data } = await apiClient.get('/supervisor/kpis/')
  return data
}

export const fetchSupervisorVolume = async () => {
  const { data } = await apiClient.get('/supervisor/volume/')
  return data
}

export const fetchStatusDistribution = async () => {
  const { data } = await apiClient.get('/supervisor/status-distribution/')
  return data
}

export const fetchAiClassification = async () => {
  const { data } = await apiClient.get('/supervisor/ai-classification/')
  return data
}

export const fetchSlaTickets = async (filter = 'all') => {
  const { data } = await apiClient.get('/supervisor/sla-tickets/', { params: { filter } })
  return data
}

export const fetchAgentsPerformance = async () => {
  const { data } = await apiClient.get('/supervisor/agents-performance/')
  return data
}

export const fetchAgents = async () => {
  const { data } = await apiClient.get('/agents/')
  return data
}

export const fetchEscalations = async (state = 'all') => {
  const { data } = await apiClient.get('/escalations/', {
    params: state === 'all' ? {} : { state },
  })
  return data
}

export const takeEscalation = async (id) => {
  const { data } = await apiClient.post(`/escalations/${id}/take/`)
  return data
}

export const reassignEscalation = async (id, agentId, note) => {
  const { data } = await apiClient.post(`/escalations/${id}/reassign/`, { agent_id: agentId, note })
  return data
}

export const sendBackEscalation = async (id) => {
  const { data } = await apiClient.post(`/escalations/${id}/send-back/`)
  return data
}