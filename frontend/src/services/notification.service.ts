import api from '@/utils/api';

export interface NotificationQuery {
  page?: number;
  limit?: number;
  type?: string;
}

export const notificationService = {
  getMyNotifications: (params?: NotificationQuery) =>
    api.get('/notifications/my-notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  broadcast: (data: { title: string; message: string; type?: string; meta?: any }) =>
    api.post('/notifications/broadcast', data),
};
