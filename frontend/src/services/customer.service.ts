import api from '@/utils/api';

export interface CustomerCRMProfile {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  customerGroup?: 'RETAIL' | 'WHOLESALE' | 'SCHOOL' | 'OFFICE' | 'RESELLER' | 'CORPORATE';
  tier?: 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'VIP';
  priority?: 'NORMAL' | 'HIGH' | 'URGENT';
  totalSpent365d?: number;
  ordersCount365d?: number;
  creditProfile?: {
    creditLimit: number;
    currentExposure: number;
    creditStatus: 'PENDING' | 'APPROVED' | 'BLOCKED';
    paymentTermDays: number;
  };
  notes?: string;
  createdAt?: string;
}

export const customerService = {
  getAll: (params?: any) => api.get('/customers', { params }).then((r) => r.data?.data ?? r.data),
  getById: (id: string) => api.get(`/customers/${id}`).then((r) => r.data?.data ?? r.data),
  updateCRMProfile: (id: string, data: any) => api.patch(`/customers/${id}/crm`, data).then((r) => r.data?.data ?? r.data),
  evaluateTier: (id: string) => api.post(`/customers/${id}/evaluate-tier`).then((r) => r.data?.data ?? r.data),
};

export default customerService;
