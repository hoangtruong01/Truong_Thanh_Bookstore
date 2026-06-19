import api from '@/utils/api'

export const productService = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  getFeatured: () => api.get('/products/featured'),
  getBestSelling: (limit = 10) => api.get('/products/best-selling', { params: { limit } }),
  getDiscounted: (limit = 10) => api.get('/products/discounted', { params: { limit } }),
  getNew: (limit = 10) => api.get('/products/new', { params: { limit } }),
  search: (q: string) => api.get('/products/search', { params: { q } }),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.patch(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
}
