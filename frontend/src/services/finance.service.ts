import api from '@/utils/api';

export interface CashAccount {
  _id: string;
  code: string;
  name: string;
  type: 'CASH_DRAWER' | 'BANK_ACCOUNT' | 'PETTY_CASH' | 'PURCHASING_BUDGET';
  openingBalance: number;
  currentBalance: number;
  status: 'ACTIVE' | 'INACTIVE';
  note?: string;
  createdAt: string;
}

export interface CashEntry {
  _id: string;
  entryCode: string;
  account: { _id: string; code: string; name: string; type: string };
  direction: 'IN' | 'OUT';
  category: string;
  amount: number;
  referenceType?: string;
  referenceId?: string;
  partnerName?: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED' | 'REVERSED';
  postedAt: string;
  createdBy?: { _id: string; name: string; email: string };
  note?: string;
  reversalOf?: string;
  createdAt: string;
}

export interface SupplierPayable {
  _id: string;
  supplier: { _id: string; code: string; name: string; phone?: string; email?: string };
  goodsReceipt?: { _id: string; receiptCode: string; receivedAt: string };
  purchaseOrder?: { _id: string; poCode: string };
  invoiceCode: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  paymentHistory: Array<{
    cashEntry: string;
    entryCode: string;
    amount: number;
    paidAt: string;
    note?: string;
  }>;
  note?: string;
  createdAt: string;
}

export interface CodReconciliationItem {
  trackingCode: string;
  codAmount: number;
  shippingFee: number;
  returnFee?: number;
}

export interface ReconcileCodStatementDto {
  statementId: string;
  carrier?: string;
  bankAccountId: string;
  note?: string;
  items: CodReconciliationItem[];
}

export interface CodReconciliationBatch {
  _id: string;
  statementId: string;
  carrier: string;
  bankAccount: { _id: string; code: string; name: string };
  totalCod: number;
  totalShipping: number;
  netPayout: number;
  matchedOrdersCount: number;
  discrepanciesCount: number;
  discrepancies: Array<{ trackingCode: string; reason: string }>;
  cashEntry?: string;
  note?: string;
  reconciledBy?: { _id: string; fullName: string; email: string };
  createdAt: string;
}

export interface PendingCodOrder {
  _id: string;
  orderCode: string;
  customerName?: string;
  phone?: string;
  shippingAddress?: string;
  total: number;
  trackingCode?: string;
  shippingStatus?: string;
  deliveredAt?: string;
  codStatus?: string;
  codDiscrepancyReason?: string;
}

export const financeService = {
  // Accounts
  getAccounts(): Promise<CashAccount[]> {
    return api.get('/finance/accounts').then((res) => res.data?.data ?? res.data);
  },

  createAccount(data: Partial<CashAccount>): Promise<CashAccount> {
    return api.post('/finance/accounts', data).then((res) => res.data?.data ?? res.data);
  },

  updateAccount(id: string, data: Partial<CashAccount>): Promise<CashAccount> {
    return api.put(`/finance/accounts/${id}`, data).then((res) => res.data?.data ?? res.data);
  },

  // Entries
  getEntries(params?: any): Promise<{ data: CashEntry[]; total: number }> {
    return api.get('/finance/entries', { params }).then((res) => res.data?.data ?? res.data);
  },

  createEntry(data: {
    account: string;
    direction: 'IN' | 'OUT';
    category: string;
    amount: number;
    referenceType?: string;
    referenceId?: string;
    partnerName?: string;
    note?: string;
    idempotencyKey?: string;
  }): Promise<CashEntry> {
    return api.post('/finance/entries', data).then((res) => res.data?.data ?? res.data);
  },

  reverseEntry(id: string, reason: string, idempotencyKey?: string): Promise<{ original: CashEntry; reversal: CashEntry }> {
    return api.post(`/finance/entries/${id}/reverse`, { reason, idempotencyKey }).then((res) => res.data?.data ?? res.data);
  },

  exportEntries(params?: any): Promise<Blob> {
    return api
      .get('/finance/entries/export', {
        params,
        responseType: 'blob',
      })
      .then((res) => res.data);
  },

  // Payables
  getPayables(params?: any): Promise<{ data: SupplierPayable[]; total: number }> {
    return api.get('/finance/payables', { params }).then((res) => res.data?.data ?? res.data);
  },

  paySupplier(
    payableId: string,
    data: { accountId: string; amount: number; note?: string; idempotencyKey?: string },
  ): Promise<{ payable: SupplierPayable; cashEntry: CashEntry }> {
    return api.post(`/finance/payables/${payableId}/pay`, data).then((res) => res.data?.data ?? res.data);
  },

  // Receivables (Customer Credit AR)
  getReceivables(params?: any): Promise<{ data: any[]; total: number }> {
    return api.get('/finance/receivables', { params }).then((res) => res.data?.data ?? res.data);
  },

  collectCustomerPayment(
    receivableId: string,
    data: { accountId: string; amount: number; note?: string; idempotencyKey?: string },
  ): Promise<{ receivable: any; cashEntry: CashEntry }> {
    return api.post(`/finance/receivables/${receivableId}/collect`, data).then((res) => res.data?.data ?? res.data);
  },

  getAgingReport(params?: any): Promise<any> {
    return api.get('/finance/reports/aging', { params }).then((res) => res.data?.data ?? res.data);
  },

  getCreditProfiles(params?: any): Promise<{ data: any[]; total: number }> {
    return api.get('/finance/credit-profiles', { params }).then((res) => res.data?.data ?? res.data);
  },

  updateCreditProfile(customerId: string, data: any): Promise<any> {
    return api.put(`/finance/credit-profiles/${customerId}`, data).then((res) => res.data?.data ?? res.data);
  },

  // COD & Logistics Reconciliation (FIN-COD-01)
  reconcileCodStatement(data: ReconcileCodStatementDto): Promise<any> {
    return api.post('/finance/cod-reconciliation', data).then((res) => res.data?.data ?? res.data);
  },

  getCodBatches(): Promise<CodReconciliationBatch[]> {
    return api.get('/finance/cod-reconciliation/batches').then((res) => res.data?.data ?? res.data);
  },

  getPendingCodOrders(): Promise<PendingCodOrder[]> {
    return api.get('/finance/cod-reconciliation/pending').then((res) => res.data?.data ?? res.data);
  },
};

export default financeService;
