import api from '@/utils/api'

export const stockAuditService = {
  getAll: (params?: Record<string, any>) => api.get('/stock-audits', { params }),
  getById: (id: string) => api.get(`/stock-audits/${id}`),
  create: (data: any) => api.post('/stock-audits', data),
  submitCount: (id: string, data: any) => api.patch(`/stock-audits/${id}/submit`, data),
  approve: (id: string, data?: any) => api.patch(`/stock-audits/${id}/approve`, data),
  reject: (id: string, reason: string) => api.patch(`/stock-audits/${id}/reject`, { reason }),
}
