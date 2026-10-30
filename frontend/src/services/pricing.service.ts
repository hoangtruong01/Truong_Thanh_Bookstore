import api from '@/utils/api';

export interface PricePolicy {
  _id: string;
  name: string;
  scope: 'GLOBAL' | 'CATEGORY' | 'PRODUCT' | 'CHANNEL' | 'TIER';
  category?: { _id: string; name: string };
  product?: { _id: string; name: string; sku: string; unit?: string };
  channel?: string;
  customerTier?: string;
  targetMarginPercent: number;
  markupPercent?: number;
  minMarginFloor: number;
  maxDiscountPercent: number;
  effectiveFrom: string;
  effectiveTo?: string;
  priority: number;
  status: 'ACTIVE' | 'INACTIVE';
  reason?: string;
  createdAt: string;
}

export interface CalculatePriceDto {
  costPrice: number;
  targetMarginPercent?: number;
  markupPercent?: number;
}

export interface CheckMarginDto {
  costPrice: number;
  sellingPrice: number;
  discountPercent?: number;
  productId?: string;
  categoryId?: string;
  channel?: string;
  customerTier?: string;
}

export interface PriceCalculationResult {
  valid: boolean;
  proposedPrice?: number;
  costPrice: number;
  marginPercent?: number;
  markupPercent?: number;
  message?: string;
}

export interface MarginCheckResult {
  requiresApproval: boolean;
  effectiveSellingPrice: number;
  costPrice: number;
  effectiveMarginPercent: number;
  minMarginFloor: number;
  maxDiscountPercent: number;
  appliedPolicyName?: string;
  reason?: string;
}

export const pricingService = {
  calculatePrice(dto: CalculatePriceDto): Promise<PriceCalculationResult> {
    return api.post('/pricing/calculate', dto).then((res) => res.data?.data ?? res.data);
  },

  checkMargin(dto: CheckMarginDto): Promise<MarginCheckResult> {
    return api.post('/pricing/check-margin', dto).then((res) => res.data?.data ?? res.data);
  },

  getPolicies(params?: any): Promise<{ data: PricePolicy[]; total: number }> {
    return api.get('/pricing/policies', { params }).then((res) => res.data?.data ?? res.data);
  },

  getPolicyById(id: string): Promise<PricePolicy> {
    return api.get(`/pricing/policies/${id}`).then((res) => res.data?.data ?? res.data);
  },

  createPolicy(data: Partial<PricePolicy>): Promise<PricePolicy> {
    return api.post('/pricing/policies', data).then((res) => res.data?.data ?? res.data);
  },

  updatePolicy(id: string, data: Partial<PricePolicy>): Promise<PricePolicy> {
    return api.put(`/pricing/policies/${id}`, data).then((res) => res.data?.data ?? res.data);
  },

  deletePolicy(id: string): Promise<{ success: boolean; message: string }> {
    return api.delete(`/pricing/policies/${id}`).then((res) => res.data?.data ?? res.data);
  },
};

export default pricingService;
