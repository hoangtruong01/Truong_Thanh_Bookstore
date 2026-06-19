import api from '@/utils/api'

export const categoryService = {
  getAll: () => api.get('/categories'),
  getById: (id: string) => api.get(`/categories/${id}`),
  getParents: () => api.get('/categories/parents'),
  getSubCategories: (parentId: string) => api.get(`/categories/${parentId}/subcategories`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.patch(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
}
