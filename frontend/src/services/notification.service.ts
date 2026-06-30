import api from '@/utils/api'

export const notificationService = {
  getMyNotifications: () => api.get('/notifications/my-notifications'),
}
