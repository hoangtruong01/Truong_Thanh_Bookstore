import api from '@/utils/api'

export const cartService = {
  getCart: () => api.get('/cart'),
  validateCart: () => api.get('/cart/validate'),
  addToCart: (productId: string, quantity = 1) => api.post('/cart/items', { productId, quantity }),
  updateQuantity: (productId: string, quantity: number) => api.patch(`/cart/items/${productId}`, { quantity }),
  removeItem: (productId: string) => api.delete(`/cart/items/${productId}`),
  clearCart: () => api.delete('/cart'),
  // 'replace' mirrors the local list (quantities set, missing lines removed); 'merge' adds quantities.
  syncCart: (items: Array<{ productId: string; quantity: number }>, mode?: 'merge' | 'replace') =>
    api.post('/cart/sync', mode ? { items, mode } : { items }),
  applyVoucher: (code: string) => api.post('/cart/voucher', { code }),
  removeVoucher: () => api.delete('/cart/voucher'),
}

