import api from '@/utils/api';

export const userService = {
  getWishlist: () => api.get('/users/wishlist'),
  toggleWishlist: (productId: string) => api.post(`/users/wishlist/${productId}`),
  removeFromWishlist: (productId: string) => api.delete(`/users/wishlist/${productId}`),
  moveToCart: (productId: string) => api.post(`/users/wishlist/move-to-cart/${productId}`),
  getLoyaltyInfo: () => api.get('/users/loyalty'),
};
