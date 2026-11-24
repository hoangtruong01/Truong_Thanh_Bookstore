import api from '../utils/api';

export interface LivestreamSession {
  _id: string;
  title: string;
  platform: 'FACEBOOK' | 'TIKTOK' | 'YOUTUBE' | 'OTHER';
  streamUrl: string;
  thumbnailUrl?: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  startAt?: string;
  endAt?: string;
  featuredProductIds?: any[];
  campaignId?: string;
  viewerCountPeak?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const livestreamService = {
  getActiveLive: () => api.get('/marketing/livestreams/active'),

  getAll: (status?: string) => api.get('/marketing/livestreams', { params: { status } }),

  getById: (id: string) => api.get(`/marketing/livestreams/${id}`),

  create: (data: any) => api.post('/marketing/livestreams', data),

  update: (id: string, data: any) => api.patch(`/marketing/livestreams/${id}`, data),

  updateStatus: (id: string, status: string) =>
    api.patch(`/marketing/livestreams/${id}/status`, { status }),

  delete: (id: string) => api.delete(`/marketing/livestreams/${id}`),
};
