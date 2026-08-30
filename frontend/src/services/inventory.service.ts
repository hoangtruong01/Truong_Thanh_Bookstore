import api from '@/utils/api'

export const inventoryService = {
  getAll: () => api.get('/inventory'),
  getLowStock: () => api.get('/inventory/low-stock'),
  getTransactions: (productId?: string) => api.get('/inventory/transactions', { params: { productId } }),
  importStock: (data: any) => api.post('/inventory/import', data),
  exportStock: (data: any) => api.post('/inventory/export', data),
  saleStock: (data: any) => api.post('/inventory/sale', data),
  returnStock: (data: any) => api.post('/inventory/return', data),
  damageStock: (data: any) => api.post('/inventory/damage', data),
  createTransaction: (data: any) => api.post('/inventory/transactions', data),
  adjustStock: (data: any) => api.post('/inventory/adjust', data),
}
