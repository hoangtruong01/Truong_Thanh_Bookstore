import api from '@/utils/api';

export const userService = {
  // Customer methods
  getWishlist: () => api.get('/users/wishlist'),
  toggleWishlist: (productId: string) => api.post(`/users/wishlist/${productId}`),
  removeFromWishlist: (productId: string) => api.delete(`/users/wishlist/${productId}`),
  moveToCart: (productId: string) => api.post(`/users/wishlist/move-to-cart/${productId}`),
  getLoyaltyInfo: () => api.get('/users/loyalty'),

  // Admin / Staff management methods
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  createStaff: (data: any) => api.post('/users', data),
  updateRole: (id: string, role: string) => api.patch(`/users/${id}/role`, { role }),
  updatePermissions: (id: string, permissions: string[]) =>
    api.patch(`/users/${id}/permissions`, { permissions }),
  updateStatus: (id: string, status: boolean) => api.patch(`/users/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/users/${id}`),
};
