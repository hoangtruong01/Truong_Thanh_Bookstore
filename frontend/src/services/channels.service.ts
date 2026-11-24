import api from '../utils/api';

export interface ChannelAccount {
  _id: string;
  provider: 'TIKTOK_SHOP' | 'SHOPEE' | 'LAZADA' | 'OTHER';
  shopId: string;
  shopName: string;
  status: 'ACTIVE' | 'PAUSED' | 'DISCONNECTED' | 'ERROR';
  authorizedWarehouseId?: string;
  syncStockEnabled: boolean;
  syncOrdersEnabled: boolean;
  appKey?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelSkuMapping {
  _id: string;
  provider: string;
  shopId: string;
  externalSkuId: string;
  externalProductId: string;
  externalSkuName: string;
  productId: {
    _id: string;
    name: string;
    sku: string;
    price: number;
    discountPrice?: number;
    stock: number;
    images?: string[];
  };
  sku: string;
  packMultiplier: number;
  syncStatus: 'SYNCED' | 'MISMATCH' | 'UNMAPPED' | 'FAILED';
  lastStockPushed: number;
  lastPushedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelException {
  _id: string;
  provider: string;
  shopId: string;
  externalOrderId?: string;
  externalSkuId?: string;
  exceptionType: 'UNKNOWN_SKU' | 'INSUFFICIENT_STOCK' | 'SYNC_LAG' | 'SETTLEMENT_MISMATCH';
  message: string;
  payload?: any;
  resolved: boolean;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export interface ChannelSettlement {
  _id: string;
  settlementId: string;
  provider: string;
  shopId: string;
  periodStart: string;
  periodEnd: string;
  grossSalesVnd: number;
  platformFeesVnd: number;
  commissionFeesVnd: number;
  shippingFeesVnd: number;
  netSettlementVnd: number;
  internalAttributedSalesVnd: number;
  discrepancyVnd: number;
  status: 'PENDING' | 'RECONCILED' | 'DISCREPANCY';
  reconciledAt?: string;
  notes?: string;
  createdAt: string;
}

export const channelsService = {
  // Accounts (CHN-01)
  getAccounts: () => api.get<ChannelAccount[]>('/sales-channels/accounts'),
  connectAccount: (data: Partial<ChannelAccount> & { appSecret?: string; accessToken?: string }) =>
    api.post<ChannelAccount>('/sales-channels/connect', data),
  disconnectAccount: (id: string) =>
    api.post<ChannelAccount>(`/sales-channels/accounts/${id}/disconnect`),

  // SKU Mappings & Stock (CHN-02)
  getMappings: (params?: { provider?: string; shopId?: string }) =>
    api.get<ChannelSkuMapping[]>('/sales-channels/mappings', { params }),
  createMapping: (data: {
    provider: string;
    shopId: string;
    externalSkuId: string;
    externalProductId: string;
    externalSkuName: string;
    productId: string;
    sku: string;
    packMultiplier?: number;
  }) => api.post<ChannelSkuMapping>('/sales-channels/mappings', data),
  syncInventory: (shopId?: string) =>
    api.post<{ syncedCount: number; timestamp: string }>('/sales-channels/inventory-sync', null, {
      params: shopId ? { shopId } : {},
    }),

  // Exceptions (CHN-02, CHN-03)
  getExceptions: (resolved = false) =>
    api.get<ChannelException[]>('/sales-channels/exceptions', {
      params: { resolved: String(resolved) },
    }),
  resolveException: (id: string, notes?: string) =>
    api.post<ChannelException>(`/sales-channels/exceptions/${id}/resolve`, { notes }),

  // Reconciliation (CHN-04)
  getSettlements: () => api.get<ChannelSettlement[]>('/sales-channels/reconciliation'),
  recordSettlement: (data: {
    settlementId: string;
    provider: string;
    shopId: string;
    periodStart: string;
    periodEnd: string;
    grossSalesVnd: number;
    platformFeesVnd: number;
    commissionFeesVnd?: number;
    shippingFeesVnd?: number;
    netSettlementVnd: number;
  }) => api.post<ChannelSettlement>('/sales-channels/reconciliation', data),

  // Webhook Simulation (QA-03)
  simulateWebhook: (provider: string, data: any) =>
    api.post(`/sales-channels/webhooks/${provider}`, data, {
      headers: { 'x-tts-signature': 'sandbox_test_signature' },
    }),
};
