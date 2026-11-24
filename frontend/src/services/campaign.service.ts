import api from '../utils/api';

export interface MarketingCampaign {
  _id: string;
  code: string;
  name: string;
  description?: string;
  objective: string;
  status: string;
  channels: string[];
  startAt?: string;
  endAt?: string;
  budgetPlan?: {
    totalBudget?: number;
    dailyBudget?: number;
    currency?: string;
  };
  actualSpend?: number;
  targetAudience?: string;
  landingPageUrl?: string;
  metrics?: {
    totalOrders?: number;
    grossRevenue?: number;
    netRevenue?: number;
    lastCalculatedAt?: string;
  };
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export const campaignService = {
  getAll: (params?: { page?: number; limit?: number; status?: string; objective?: string; search?: string }) =>
    api.get('/marketing/campaigns', { params }),

  getById: (id: string) => api.get(`/marketing/campaigns/${id}`),

  create: (data: any) => api.post('/marketing/campaigns', data),

  update: (id: string, data: any) => api.patch(`/marketing/campaigns/${id}`, data),

  updateStatus: (id: string, status: string, reason?: string) =>
    api.patch(`/marketing/campaigns/${id}/status`, { status, reason }),

  delete: (id: string) => api.delete(`/marketing/campaigns/${id}`),
};
