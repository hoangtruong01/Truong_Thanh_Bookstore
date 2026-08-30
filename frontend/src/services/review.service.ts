import api from '@/utils/api';

export interface ReviewQuery {
  page?: number;
  limit?: number;
  productId?: string;
  rating?: number;
  isVisible?: boolean;
  search?: string;
}

export const reviewService = {
  getByProduct: (productId: string) => api.get(`/reviews/product/${productId}`),
  getBreakdown: (productId: string) => api.get(`/reviews/product/${productId}/breakdown`),
  canUserReview: (productId: string) => api.get(`/reviews/product/${productId}/can-review`),
  create: (productId: string, data: { rating: number; content: string; images?: string[] }) =>
    api.post(`/reviews/product/${productId}`, data),
  update: (productId: string, reviewId: string, data: { rating?: number; content?: string; images?: string[] }) =>
    api.patch(`/reviews/${reviewId}/product/${productId}`, data),
  delete: (productId: string, reviewId: string) =>
    api.delete(`/reviews/${reviewId}/product/${productId}`),
  getAllAdmin: (params?: ReviewQuery) => api.get('/reviews/admin', { params }),
  moderate: (reviewId: string, isVisible: boolean) =>
    api.patch(`/reviews/${reviewId}/moderate`, { isVisible }),
  adminReply: (reviewId: string, reply: string) =>
    api.patch(`/reviews/${reviewId}/reply`, { reply }),
};
