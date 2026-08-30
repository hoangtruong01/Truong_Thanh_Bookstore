import api from '@/utils/api';

export const reportService = {
  getDashboard: () => api.get('/reports/dashboard'),
  getRevenue: (startDate?: string, endDate?: string) =>
    api.get('/reports/revenue', { params: { startDate, endDate } }),
  getBestSellingProducts: (limit?: number) =>
    api.get('/reports/best-selling-products', { params: { limit } }),
  getLowStockProducts: () => api.get('/reports/low-stock-products'),
  getNotifications: () => api.get('/reports/notifications'),
  getAdvancedDashboard: () => api.get('/reports/dashboard/advanced'),
  getSummary: (range?: 'day' | 'week' | 'month' | 'year') =>
    api.get('/reports/summary', { params: { range } }),
  getOrderStatusStats: () => api.get('/reports/order-status-stats'),
  getCategoryRevenue: () => api.get('/reports/category-revenue'),
};
