import api from '@/utils/api'

export const purchaseService = {
  // Đơn đặt mua hàng (Purchase Orders)
  getPurchaseOrders: (params?: Record<string, any>) => api.get('/purchase-orders', { params }),
  getPurchaseOrderById: (id: string) => api.get(`/purchase-orders/${id}`),
  createPurchaseOrder: (data: any) => api.post('/purchase-orders', data),
  updatePurchaseOrder: (id: string, data: any) => api.put(`/purchase-orders/${id}`, data),
  approvePurchaseOrder: (id: string, data?: any) => api.patch(`/purchase-orders/${id}/approve`, data),
  sendPurchaseOrder: (id: string, note?: string) => api.patch(`/purchase-orders/${id}/send`, { note }),
  cancelPurchaseOrder: (id: string, reason: string) => api.patch(`/purchase-orders/${id}/cancel`, { reason }),

  // Phiếu nhận hàng (Goods Receipts)
  getGoodsReceipts: (params?: Record<string, any>) => api.get('/goods-receipts', { params }),
  getGoodsReceiptById: (id: string) => api.get(`/goods-receipts/${id}`),
  createGoodsReceipt: (data: any) => api.post('/goods-receipts', data),
}
