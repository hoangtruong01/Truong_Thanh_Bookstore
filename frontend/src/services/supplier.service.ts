import api from '@/utils/api'

export const supplierService = {
  getAll: (params?: Record<string, any>) => api.get('/suppliers', { params }),
  getById: (id: string) => api.get(`/suppliers/${id}`),
  getByProduct: (productId: string) => api.get(`/suppliers/by-product/${productId}`),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: string, data: any) => api.put(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
}
