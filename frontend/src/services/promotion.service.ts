import api from '@/utils/api'

export const promotionService = {
  getAll: () => api.get('/promotions'),
  getById: (id: string) => api.get(`/promotions/${id}`),
  create: (data: any) => api.post('/promotions', data),
  update: (id: string, data: any) => api.patch(`/promotions/${id}`, data),
  delete: (id: string) => api.delete(`/promotions/${id}`),
  apply: (code: string, orderTotal: number) => api.post('/promotions/apply', { code, orderTotal }),
}
