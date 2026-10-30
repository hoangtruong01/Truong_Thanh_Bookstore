import api from '@/utils/api'

export const posService = {
  createOrder(data: any) {
    return api.post('/pos/orders', data)
  },

  getOrders(params?: any) {
    return api.get('/pos/orders', { params })
  },

  getOrderById(id: string) {
    return api.get(`/pos/orders/${id}`)
  },

  refundOrder(id: string, data: any) {
    return api.post(`/pos/orders/${id}/refund`, data)
  },

  getSessionReport(params?: any) {
    return api.get('/pos/reports/session', { params })
  },

  searchProducts(keyword: string) {
    return api.get('/pos/products/search', { params: { q: keyword } })
  },
}

export default posService

