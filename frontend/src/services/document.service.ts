import api from '@/utils/api';

export type DocumentType =
  | 'PURCHASE_ORDER'
  | 'GOODS_RECEIPT'
  | 'PURCHASE_RETURN'
  | 'SALES_ORDER'
  | 'CASH_RECEIPT'
  | 'CASH_PAYMENT'
  | 'STOCK_TRANSFER'
  | 'INVOICE';

export type DocumentStatus = 'DRAFT' | 'POSTED' | 'REVERSED' | 'CANCELLED';

export interface ERPDocumentAttachment {
  _id?: string;
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface ERPDocument {
  _id: string;
  documentNumber: string;
  title: string;
  documentType: DocumentType;
  status: DocumentStatus;
  postingDate?: string;
  entityType?: 'SUPPLIER' | 'CUSTOMER' | 'STAFF' | 'ORDER' | 'INTERNAL';
  entityId?: string;
  entityName?: string;
  linkedDocumentNumber?: string;
  amount?: number;
  attachments?: ERPDocumentAttachment[];
  postedAt?: string;
  reversedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateERPDocumentPayload {
  title: string;
  documentType: DocumentType;
  entityName?: string;
  amount?: number;
  linkedDocumentNumber?: string;
  entityType?: string;
  entityId?: string;
}

export interface AddAttachmentPayload {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export const documentService = {
  getAll: (params?: Record<string, unknown>): Promise<{ data: ERPDocument[]; total: number }> =>
    api.get('/documents', { params }).then((r) => r.data?.data ?? r.data),

  getById: (id: string): Promise<ERPDocument> =>
    api.get(`/documents/${id}`).then((r) => r.data?.data ?? r.data),

  create: (data: CreateERPDocumentPayload): Promise<ERPDocument> =>
    api.post('/documents', data).then((r) => r.data?.data ?? r.data),

  post: (id: string): Promise<ERPDocument> =>
    api.patch(`/documents/${id}/post`).then((r) => r.data?.data ?? r.data),

  reverse: (
    id: string,
    reason: string,
  ): Promise<{ original: ERPDocument; reversal: ERPDocument }> =>
    api.post(`/documents/${id}/reverse`, { reason }).then((r) => r.data?.data ?? r.data),

  addAttachment: (id: string, data: AddAttachmentPayload): Promise<ERPDocument> =>
    api.post(`/documents/${id}/attachments`, data).then((r) => r.data?.data ?? r.data),

  removeAttachment: (id: string, fileId: string): Promise<ERPDocument> =>
    api.delete(`/documents/${id}/attachments/${fileId}`).then((r) => r.data?.data ?? r.data),

  cancel: (id: string): Promise<ERPDocument> =>
    api.patch(`/documents/${id}/cancel`).then((r) => r.data?.data ?? r.data),
};

export default documentService;
