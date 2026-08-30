import api from '@/utils/api'

export const paymentService = {
  create: (orderId: string, provider: 'COD' | 'BANK_TRANSFER' | 'VNPAY' | 'MOMO', returnUrl?: string) =>
    api.post('/payments', { orderId, provider, returnUrl }),
  getByOrder: (orderId: string) => api.get(`/payments/order/${orderId}`),
}
