import api from '@/utils/api';

export interface ERPDocument {
  _id: string;
  docCode: string;
  docType:
    | 'PURCHASE_ORDER'
    | 'GOODS_RECEIPT'
    | 'PURCHASE_RETURN'
    | 'SALES_ORDER'
    | 'CASH_RECEIPT'
    | 'CASH_PAYMENT'
    | 'STOCK_TRANSFER'
    | 'INVOICE';
  status: 'DRAFT' | 'POSTED' | 'REVERSED' | 'CANCELLED';
  partnerName?: string;
  totalAmount?: number;
  referenceType?: string;
  referenceCode?: string;
  attachments?: Array<{
    _id?: string;
    fileId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
  }>;
  postedAt?: string;
  reversedAt?: string;
  createdAt: string;
}

export const documentService = {
  getAll: (params?: any): Promise<{ data: ERPDocument[]; total: number }> =>
    api.get('/documents', { params }).then((r) => r.data?.data ?? r.data),

  getById: (id: string): Promise<ERPDocument> =>
    api.get(`/documents/${id}`).then((r) => r.data?.data ?? r.data),

  create: (data: Partial<ERPDocument>): Promise<ERPDocument> =>
    api.post('/documents', data).then((r) => r.data?.data ?? r.data),

  post: (id: string): Promise<ERPDocument> =>
    api.patch(`/documents/${id}/post`).then((r) => r.data?.data ?? r.data),

  reverse: (id: string, reason: string): Promise<{ original: ERPDocument; reversal: ERPDocument }> =>
    api.post(`/documents/${id}/reverse`, { reason }).then((r) => r.data?.data ?? r.data),

  addAttachment: (
    id: string,
    data: { fileName: string; fileUrl: string; fileSize?: number; mimeType?: string },
  ): Promise<ERPDocument> =>
    api.post(`/documents/${id}/attachments`, data).then((r) => r.data?.data ?? r.data),

  removeAttachment: (id: string, fileId: string): Promise<ERPDocument> =>
    api.delete(`/documents/${id}/attachments/${fileId}`).then((r) => r.data?.data ?? r.data),
};

export default documentService;
