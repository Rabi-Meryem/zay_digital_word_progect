import apiClient from './axiosClient'

export const fetchNotifications = async () => {
  const { data } = await apiClient.get('/notifications/')
  return data
}

export const markNotificationRead = async (id) => {
  const { data } = await apiClient.patch(`/notifications/${id}/read/`)
  return data
}

export const markAllRead = async () => {
  const { data } = await apiClient.post('/notifications/mark-all-read/')
  return data
}
export const fetchUnreadCount = async () => {
  const { data } = await apiClient.get('/notifications/unread-count/')
  return data
}