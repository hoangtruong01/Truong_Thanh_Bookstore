import api from '@/utils/api'

export const cartService = {
  getCart: () => api.get('/cart'),
  validateCart: () => api.get('/cart/validate'),
  addToCart: (productId: string, quantity = 1) => api.post('/cart/items', { productId, quantity }),
  updateQuantity: (productId: string, quantity: number) => api.patch(`/cart/items/${productId}`, { quantity }),
  removeItem: (productId: string) => api.delete(`/cart/items/${productId}`),
  clearCart: () => api.delete('/cart'),
  syncCart: (items: Array<{ productId: string; quantity: number }>) => api.post('/cart/sync', { items }),
  applyVoucher: (code: string) => api.post('/cart/voucher', { code }),
  removeVoucher: () => api.delete('/cart/voucher'),
}

