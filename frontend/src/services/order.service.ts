import api from '@/utils/api'
import type { CheckoutPreviewRequest, CheckoutPreviewResponse, PricingPolicy } from '@/types'

export const orderService = {
  checkoutPreview: (data: CheckoutPreviewRequest) =>
    api.post<CheckoutPreviewResponse>('/orders/checkout-preview', data),
  // Display-only policy for screens without a preview (empty cart, banners). Optional, so no global toast.
  getPricingPolicy: () =>
    api.get<PricingPolicy>('/orders/pricing-policy', { skipGlobalErrorHandler: true }),
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
  requestReturn: (id: string, reason: string, overrideToken?: string) =>
    api.post(`/orders/${id}/return-request`, { reason, ...(overrideToken ? { overrideToken } : {}) }),
  approveReturn: (id: string, note?: string) =>
    api.post(`/orders/${id}/return-approve`, { note }),
  confirmReturnReceived: (id: string, note?: string) =>
    api.post(`/orders/${id}/return-received`, { note }),
  rejectReturn: (id: string, reason: string) =>
    api.post(`/orders/${id}/return-reject`, { reason }),
  cancel: (id: string) => api.delete(`/orders/${id}`),
  cancelGuest: (id: string, accessToken: string) =>
    api.delete(`/orders/guest/${id}`, {
      headers: { 'x-guest-order-token': accessToken },
    }),
}
