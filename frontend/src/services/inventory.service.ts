import api from '@/utils/api'

export const inventoryService = {
  getAll: () => api.get('/inventory'),
  getLowStock: () => api.get('/inventory/low-stock'),
  getTransactions: (productId?: string) => api.get('/inventory/transactions', { params: { productId } }),
  importStock: (data: any) => api.post('/inventory/import', data),
  exportStock: (data: any) => api.post('/inventory/export', data),
  adjustStock: (data: any) => api.post('/inventory/adjust', data),
}
