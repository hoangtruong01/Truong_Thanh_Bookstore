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

  reverseEntry(id: string, reason: string): Promise<{ original: CashEntry; reversal: CashEntry }> {
    return api.post(`/finance/entries/${id}/reverse`, { reason }).then((res) => res.data?.data ?? res.data);
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
};

export default financeService;
