import api from '@/utils/api'

export interface BankTransferConfig {
  bankName: string
  accountNumber: string
  accountHolder: string
}

export interface EnabledPaymentMethodsResponse {
  methods: ('COD' | 'BANK_TRANSFER' | 'VNPAY' | 'MOMO')[]
  bankTransfer?: BankTransferConfig | null
}

export const paymentService = {
  create: (orderId: string, provider: 'COD' | 'BANK_TRANSFER' | 'VNPAY' | 'MOMO', returnUrl?: string) =>
    api.post('/payments', { orderId, provider, returnUrl }),
  getByOrder: (orderId: string) => api.get(`/payments/order/${orderId}`),
  getEnabledMethods: () =>
    api.get<EnabledPaymentMethodsResponse>('/payments/methods'),
}

