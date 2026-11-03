import api from '@/utils/api';

export interface QuotationItem {
  product: any;
  productName?: string;
  sku?: string;
  unit?: string;
  moq: number;
  leadTimeDays: number;
  baseUnitPrice: number;
  priceTiers?: Array<{ minQuantity: number; unitPrice: number }>;
}

export interface SupplierQuotation {
  _id: string;
  quotationCode: string;
  supplier: { _id: string; name: string; code?: string; phone?: string; email?: string };
  status: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  validFrom: string;
  validUntil: string;
  paymentTerms?: string;
  defectRate?: number;
  onTimeDeliveryRate?: number;
  items: QuotationItem[];
  notes?: string;
  approvedAt?: string;
  approvedBy?: any;
  rejectionReason?: string;
  createdAt: string;
}

export const quotationService = {
  getAll: (params?: any): Promise<{ data: SupplierQuotation[]; total: number }> =>
    api.get('/supplier-quotations', { params }).then((r) => r.data?.data ?? r.data),

  getById: (id: string): Promise<SupplierQuotation> =>
    api.get(`/supplier-quotations/${id}`).then((r) => r.data?.data ?? r.data),

  create: (data: any): Promise<SupplierQuotation> =>
    api.post('/supplier-quotations', data).then((r) => r.data?.data ?? r.data),

  approve: (id: string): Promise<SupplierQuotation> =>
    api.patch(`/supplier-quotations/${id}/approve`).then((r) => r.data?.data ?? r.data),

  reject: (id: string, reason: string): Promise<SupplierQuotation> =>
    api.patch(`/supplier-quotations/${id}/reject`, { reason }).then((r) => r.data?.data ?? r.data),

  compare: (productId: string, quantity: number): Promise<any> =>
    api.get('/supplier-quotations/compare', { params: { productId, quantity } }).then((r) => r.data?.data ?? r.data),

  getPriceHistory: (productId: string): Promise<any> =>
    api.get(`/supplier-quotations/price-history/${productId}`).then((r) => r.data?.data ?? r.data),

  createPO: (data: {
    quotationId: string;
    items: Array<{ product: string; orderedQuantity: number }>;
    expectedDeliveryDate?: string;
    note?: string;
  }): Promise<any> =>
    api.post('/supplier-quotations/create-po', data).then((r) => r.data?.data ?? r.data),
};

export default quotationService;
