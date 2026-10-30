import api from '@/utils/api'

export const inventoryService = {
  getAll: (params?: Record<string, any>) => api.get('/inventory', { params }),
  getLowStock: () => api.get('/inventory/low-stock'),
  getTransactions: (params?: Record<string, any> | string) => {
    const configParams = typeof params === 'string' ? { productId: params } : params
    return api.get('/inventory/transactions', { params: configParams })
  },
  exportTransactions: (params?: Record<string, any>) =>
    api.get('/inventory/transactions/export', { params, responseType: 'blob' }),
  reconcile: () => api.get('/inventory/reconcile'),
  syncMissing: () => api.post('/inventory/sync-missing'),
  importStock: (data: any) => api.post('/inventory/import', data),
  exportStock: (data: any) => api.post('/inventory/export', data),
  saleStock: (data: any) => api.post('/inventory/sale', data),
  returnStock: (data: any) => api.post('/inventory/return', data),
  damageStock: (data: any) => api.post('/inventory/damage', data),
  createTransaction: (data: any) => api.post('/inventory/transactions', data),
  adjustStock: (data: any) => api.post('/inventory/adjust', data),
}
