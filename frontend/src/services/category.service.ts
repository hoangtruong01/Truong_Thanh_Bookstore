import api from '@/utils/api'

export const categoryService = {
  getAll: () => api.get('/categories'),
  getTree: (includeInactive = false) =>
    api.get(`/categories/tree${includeInactive ? '?includeInactive=true' : ''}`),
  getAllAdmin: () => api.get('/categories/admin'),
  getById: (id: string) => api.get(`/categories/${id}`),
  getBySlug: (slug: string) => api.get(`/categories/slug/${slug}`),
  getParents: () => api.get('/categories/parents'),
  getSubCategories: (parentId: string) =>
    api.get(`/categories/${parentId}/subcategories`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.patch(`/categories/${id}`, data),
  toggleStatus: (id: string) => api.patch(`/categories/${id}/status`),
  delete: (id: string) => api.delete(`/categories/${id}`),
}
