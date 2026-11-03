import api from '@/utils/api';

export type WarehouseType = 'MAIN' | 'STORE' | 'ONLINE' | 'QUARANTINE' | 'DAMAGED';

export interface Warehouse {
  _id: string;
  code: string;
  name: string;
  type: WarehouseType;
  address?: string;
  phone?: string;
  manager?: string;
  isDefault?: boolean;
  isActive: boolean;
  description?: string;
  totalProducts?: number;
  totalQuantity?: number;
}

export interface StockTransferItem {
  product: { _id: string; title?: string; name?: string; sku?: string } | string;
  requestedQty: number;
  receivedQty?: number;
  note?: string;
}

export interface StockTransfer {
  _id: string;
  code: string;
  transferCode?: string;
  fromWarehouse: Warehouse;
  toWarehouse: Warehouse;
  sourceWarehouse?: Warehouse;
  destinationWarehouse?: Warehouse;
  status: 'DRAFT' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  items: StockTransferItem[];
  shippedAt?: string;
  receivedAt?: string;
  note?: string;
  createdAt: string;
}

export interface CreateStockTransferItemPayload {
  product: string;
  requestedQty: number;
  note?: string;
}

export interface CreateStockTransferPayload {
  fromWarehouse: string;
  toWarehouse: string;
  items: CreateStockTransferItemPayload[];
  note?: string;
}

export interface ReceiveStockTransferItemPayload {
  product: string;
  receivedQty: number;
  note?: string;
}

export interface ReceiveStockTransferPayload {
  items: ReceiveStockTransferItemPayload[];
  note?: string;
}

export const warehouseService = {
  getAll: (params?: Record<string, unknown>): Promise<{ data: Warehouse[]; total: number }> =>
    api.get('/warehouses', { params }).then((r) => r.data?.data ?? r.data),

  getById: (id: string): Promise<Warehouse> =>
    api.get(`/warehouses/${id}`).then((r) => r.data?.data ?? r.data),

  create: (data: Partial<Warehouse>): Promise<Warehouse> =>
    api.post('/warehouses', data).then((r) => r.data?.data ?? r.data),

  update: (id: string, data: Partial<Warehouse>): Promise<Warehouse> =>
    api.put(`/warehouses/${id}`, data).then((r) => r.data?.data ?? r.data),

  getStock: (id: string, params?: Record<string, unknown>): Promise<any> =>
    api.get(`/warehouses/${id}/stock`, { params }).then((r) => r.data?.data ?? r.data),

  getSellable: (productId: string): Promise<{ sellableStock: number }> =>
    api.get(`/warehouses/sellable/${productId}`).then((r) => r.data?.data ?? r.data),

  getTransfers: (params?: Record<string, unknown>): Promise<{ data: StockTransfer[]; total: number }> =>
    api.get('/warehouses/transfers/list', { params }).then((r) => r.data?.data ?? r.data),

  createTransfer: (data: CreateStockTransferPayload): Promise<StockTransfer> =>
    api.post('/warehouses/transfers', data).then((r) => r.data?.data ?? r.data),

  approveTransfer: (id: string): Promise<StockTransfer> =>
    api.patch(`/warehouses/transfers/${id}/approve`).then((r) => r.data?.data ?? r.data),

  shipTransfer: (id: string): Promise<StockTransfer> =>
    api.patch(`/warehouses/transfers/${id}/ship`).then((r) => r.data?.data ?? r.data),

  receiveTransfer: (id: string, data: ReceiveStockTransferPayload): Promise<StockTransfer> =>
    api.patch(`/warehouses/transfers/${id}/receive`, data).then((r) => r.data?.data ?? r.data),

  cancelTransfer: (id: string, reason?: string): Promise<StockTransfer> =>
    api.patch(`/warehouses/transfers/${id}/cancel`, { reason }).then((r) => r.data?.data ?? r.data),
};

export default warehouseService;
