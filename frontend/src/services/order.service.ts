import api from '@/utils/api'

export const orderService = {
  checkoutPreview: (data: any) => api.post('/orders/checkout-preview', data),
  create: (data: any) => api.post('/orders', data),
  createAuthenticated: (data: any) => api.post('/orders/authenticated', data),
  getAll: (params?: any) => api.get('/orders', { params }),
  getMyOrders: (params?: any) => api.get('/orders/my-orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  getInvoice: (id: string) =>
    api.get(`/orders/${id}/invoice`, { responseType: 'blob' }),
  getGuestById: (id: string, accessToken: string) =>
    api.get(`/orders/guest/${id}`, {
      headers: { 'x-guest-order-token': accessToken },
    }),
  getGuestInvoice: (id: string, accessToken: string) =>
    api.get(`/orders/guest/${id}/invoice`, {
      responseType: 'blob',
      headers: { 'x-guest-order-token': accessToken },
    }),
  updateStatus: (id: string, orderStatus: string, note?: string) =>
    api.patch(`/orders/${id}/status`, { orderStatus, ...(note ? { note } : {}) }),
  cancel: (id: string) => api.delete(`/orders/${id}`),
  cancelGuest: (id: string, accessToken: string) =>
    api.delete(`/orders/guest/${id}`, {
      headers: { 'x-guest-order-token': accessToken },
    }),
}
