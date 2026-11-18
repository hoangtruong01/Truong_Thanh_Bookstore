import api from '@/utils/api';

export const reportService = {
  getDashboard: (config?: any) => api.get('/reports/dashboard', config),
  getRevenue: (startDate?: string, endDate?: string, channel?: string, config?: any) =>
    api.get('/reports/revenue', { params: { startDate, endDate, channel }, ...config }),
  getBestSellingProducts: (limit?: number, config?: any) =>
    api.get('/reports/best-selling-products', { params: { limit }, ...config }),
  getLowStockProducts: (config?: any) => api.get('/reports/low-stock-products', config),
  getNotifications: (config?: any) => api.get('/reports/notifications', config),
  getAdvancedDashboard: (config?: any) => api.get('/reports/dashboard/advanced', config),
  getSummary: (range?: 'day' | 'week' | 'month' | 'year', config?: any) =>
    api.get('/reports/summary', { params: { range }, ...config }),
  getOrderStatusStats: (config?: any) => api.get('/reports/order-status-stats', config),
  getCategoryRevenue: (startDate?: string, endDate?: string, channel?: string, config?: any) =>
    api.get('/reports/category-revenue', { params: { startDate, endDate, channel }, ...config }),
  getInventoryLedgerProfit: (params?: any, config?: any) =>
    api.get('/reports/inventory-ledger-profit', { params, ...config }),
  exportInventoryLedgerProfit: (params?: any) =>
    api.get('/reports/export/inventory-ledger-profit', {
      params,
      responseType: 'blob',
    }),
  getReorderSuggestions: (params?: any, config?: any) =>
    api.get('/reports/reorder-suggestions', { params, ...config }),
};
