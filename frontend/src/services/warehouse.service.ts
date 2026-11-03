import api from '@/utils/api';

export interface Warehouse {
  _id: string;
  code: string;
  name: string;
  type: 'MAIN' | 'STORE' | 'ONLINE' | 'QUARANTINE' | 'DAMAGED';
  address?: string;
  isActive: boolean;
  isSellable: boolean;
  totalProducts?: number;
  totalQuantity?: number;
}

export interface StockTransfer {
  _id: string;
  transferCode: string;
  sourceWarehouse: Warehouse;
  destinationWarehouse: Warehouse;
  status: 'DRAFT' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  items: Array<{
    product: { _id: string; title: string; sku: string };
    quantity: number;
    receivedQuantity?: number;
  }>;
  shippedAt?: string;
  receivedAt?: string;
  note?: string;
  createdAt: string;
}

export const warehouseService = {
  getAll: (params?: any): Promise<{ data: Warehouse[]; total: number }> =>
    api.get('/warehouses', { params }).then((r) => r.data?.data ?? r.data),

  getById: (id: string): Promise<Warehouse> =>
    api.get(`/warehouses/${id}`).then((r) => r.data?.data ?? r.data),

  create: (data: Partial<Warehouse>): Promise<Warehouse> =>
    api.post('/warehouses', data).then((r) => r.data?.data ?? r.data),

  update: (id: string, data: Partial<Warehouse>): Promise<Warehouse> =>
    api.put(`/warehouses/${id}`, data).then((r) => r.data?.data ?? r.data),

  getStock: (id: string, params?: any): Promise<any> =>
    api.get(`/warehouses/${id}/stock`, { params }).then((r) => r.data?.data ?? r.data),

  getSellable: (productId: string): Promise<{ sellableStock: number }> =>
    api.get(`/warehouses/sellable/${productId}`).then((r) => r.data?.data ?? r.data),

  getTransfers: (params?: any): Promise<{ data: StockTransfer[]; total: number }> =>
    api.get('/warehouses/transfers/list', { params }).then((r) => r.data?.data ?? r.data),

  createTransfer: (data: any): Promise<StockTransfer> =>
    api.post('/warehouses/transfers', data).then((r) => r.data?.data ?? r.data),

  approveTransfer: (id: string): Promise<StockTransfer> =>
    api.patch(`/warehouses/transfers/${id}/approve`).then((r) => r.data?.data ?? r.data),

  shipTransfer: (id: string): Promise<StockTransfer> =>
    api.patch(`/warehouses/transfers/${id}/ship`).then((r) => r.data?.data ?? r.data),

  receiveTransfer: (id: string, data?: any): Promise<StockTransfer> =>
    api.patch(`/warehouses/transfers/${id}/receive`, data || {}).then((r) => r.data?.data ?? r.data),

  cancelTransfer: (id: string, reason?: string): Promise<StockTransfer> =>
    api.patch(`/warehouses/transfers/${id}/cancel`, { reason }).then((r) => r.data?.data ?? r.data),
};

export default warehouseService;
