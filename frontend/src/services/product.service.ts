import api from '@/utils/api'

export const productService = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  getFeatured: () => api.get('/products/featured'),
  getNew: (limit = 10) => api.get('/products', { params: { limit, sort: 'newest' } }),
  getBestSelling: (limit = 10) => api.get('/products/best-selling', { params: { limit } }),
  getDiscounted: (limit = 10) => api.get('/products/discounted', { params: { limit } }),
  search: (q: string) => api.get('/products/search', { params: { q } }),
  getSuggestions: (q: string, limit = 6) =>
    api.get('/products/suggestions', { params: { q, limit } }),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.patch(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  getReviews: (id: string) => api.get(`/products/${id}/reviews`),
  addReview: (id: string, data: any) => api.post(`/products/${id}/reviews`, data),
  updateReview: (id: string, reviewId: string, data: any) => api.patch(`/products/${id}/reviews/${reviewId}`, data),
  deleteReview: (id: string, reviewId: string) => api.delete(`/products/${id}/reviews/${reviewId}`),
  subscribeStockAlert: (id: string, email: string) => api.post(`/products/${id}/alert`, { email }),
  downloadTemplate: () => api.get('/products/export/template', { responseType: 'blob' }),
  exportExcel: () => api.get('/products/export/excel', { responseType: 'blob' }),
  importExcel: (formData: FormData) =>
    api.post('/products/import/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
}


