import api from '@/utils/api'

export const orderService = {
  create: (data: any) => api.post('/orders', data),
  createAuthenticated: (data: any) => api.post('/orders/authenticated', data),
  getAll: (params?: any) => api.get('/orders', { params }),
  getMyOrders: (params?: any) => api.get('/orders/my-orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  updateStatus: (id: string, orderStatus: string) => api.patch(`/orders/${id}/status`, { orderStatus }),
  cancel: (id: string) => api.delete(`/orders/${id}`),
}
