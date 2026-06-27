import api from '@/utils/api'

export const reportService = {
  getDashboard: () => api.get('/reports/dashboard'),
  getRevenue: (startDate?: string, endDate?: string) => api.get('/reports/revenue', { params: { startDate, endDate } }),
  getBestSellingProducts: (limit?: number) => api.get('/reports/best-selling-products', { params: { limit } }),
  getLowStockProducts: () => api.get('/reports/low-stock-products'),
  getNotifications: () => api.get('/reports/notifications'),
}
