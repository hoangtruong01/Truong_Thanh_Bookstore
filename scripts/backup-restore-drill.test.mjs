import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSafeTargetDatabase,
  reconcileCashLedger,
  reconcileInventory,
  reconcileOrders,
  reconcileDocumentCounts,
  executeRestoreDrill,
} from './backup-restore-drill.mjs';

test('backup-restore-drill: safety check rejects production database names', () => {
  assert.equal(isSafeTargetDatabase('production'), false);
  assert.equal(isSafeTargetDatabase('truongthanh_prod'), false);
  assert.equal(isSafeTargetDatabase('truongthanh_production'), false);
  assert.equal(isSafeTargetDatabase('admin'), false);
  assert.equal(isSafeTargetDatabase('config'), false);
  assert.equal(isSafeTargetDatabase('local'), false);
  assert.equal(isSafeTargetDatabase('cluster0'), false);
  assert.equal(isSafeTargetDatabase(''), false);
  assert.equal(isSafeTargetDatabase(null), false);
});

test('backup-restore-drill: safety check accepts safe staging, test, and drill database names', () => {
  assert.equal(isSafeTargetDatabase('truongthanh_restore_drill'), true);
  assert.equal(isSafeTargetDatabase('truongthanh_staging'), true);
  assert.equal(isSafeTargetDatabase('truongthanh_test'), true);
  assert.equal(isSafeTargetDatabase('store_demo_db'), true);
});

test('backup-restore-drill: reconcileCashLedger passes when entries match current balance', () => {
  const accounts = [
    {
      _id: 'acc1',
      code: 'TIENMAT',
      name: 'Tiền mặt',
      openingBalance: 1000000,
      currentBalance: 1400000,
    },
    {
      _id: 'acc2',
      code: 'NGANHANG',
      name: 'Vietcombank',
      openingBalance: 5000000,
      currentBalance: 3500000,
    },
  ];

  const entries = [
    // acc1: +500,000 IN, -100,000 OUT -> balance = 1,000,000 + 400,000 = 1,400,000
    { account: 'acc1', direction: 'IN', amount: 500000, status: 'POSTED' },
    { account: 'acc1', direction: 'OUT', amount: 100000, status: 'POSTED' },
    // DRAFT / CANCELLED / REVERSED entries must NOT affect posted ledger
    { account: 'acc1', direction: 'IN', amount: 200000, status: 'DRAFT' },
    { account: 'acc1', direction: 'OUT', amount: 999999, status: 'CANCELLED' },
    { account: 'acc1', direction: 'IN', amount: 300000, status: 'REVERSED' },

    // acc2: -1,500,000 OUT -> balance = 5,000,000 - 1,500,000 = 3,500,000
    { account: 'acc2', direction: 'OUT', amount: 1500000, status: 'POSTED' },
  ];

  const result = reconcileCashLedger(accounts, entries);
  assert.equal(result.passed, true);
  assert.equal(result.discrepancyCount, 0);
  assert.equal(result.matchedCount, 2);
  assert.equal(result.details[0].calculatedBalance, 1400000);
  assert.equal(result.details[1].calculatedBalance, 3500000);
});

test('backup-restore-drill: reconcileCashLedger flags discrepancy when entries do not match', () => {
  const accounts = [
    {
      _id: 'acc1',
      code: 'TIENMAT',
      name: 'Tiền mặt',
      openingBalance: 1000000,
      currentBalance: 1400000, // Should be 1,300,000 -> mismatch of 100,000
    },
  ];

  const entries = [
    { account: 'acc1', direction: 'IN', amount: 300000, status: 'POSTED' },
  ];

  const result = reconcileCashLedger(accounts, entries);
  assert.equal(result.passed, false);
  assert.equal(result.discrepancyCount, 1);
  assert.equal(result.discrepancies[0].delta, 100000);
  assert.equal(result.discrepancies[0].calculatedBalance, 1300000);
  assert.equal(result.discrepancies[0].currentBalance, 1400000);
});

test('backup-restore-drill: reconcileInventory detects negative stocks', () => {
  const inventories = [
    { product: 'p1', currentStock: 50 },
    { product: 'p2', currentStock: -5 },
  ];

  const result = reconcileInventory(inventories);
  assert.equal(result.passed, false);
  assert.equal(result.negativeStockItems.length, 1);
  assert.equal(result.negativeStockItems[0].productId, 'p2');
});

test('backup-restore-drill: reconcileOrders validates order totals', () => {
  const orders = [
    {
      _id: 'o1',
      subtotal: 200000,
      shippingFee: 30000,
      discountAmount: 10000,
      totalAmount: 220000,
      paymentStatus: 'PAID',
    },
    {
      _id: 'o2',
      subtotal: 100000,
      shippingFee: 0,
      discountAmount: 0,
      totalAmount: 100000,
      paymentStatus: 'PENDING',
    },
  ];

  const result = reconcileOrders(orders);
  assert.equal(result.passed, true);
  assert.equal(result.totalRevenue, 320000);
  assert.equal(result.paidRevenue, 220000);
});

test('backup-restore-drill: reconcileDocumentCounts detects missing records between source and target', () => {
  const source = {
    users: [1, 2, 3],
    products: [1, 2],
  };
  const targetMatches = {
    users: [1, 2, 3],
    products: [1, 2],
  };
  const targetMissing = {
    users: [1, 2, 3],
    products: [1], // Missing 1 product
  };

  assert.equal(reconcileDocumentCounts(source, targetMatches).passed, true);
  const failResult = reconcileDocumentCounts(source, targetMissing);
  assert.equal(failResult.passed, false);
  assert.equal(failResult.mismatches.length, 1);
  assert.equal(failResult.mismatches[0].collection, 'products');
});

test('backup-restore-drill: executeRestoreDrill blocks unsafe database name', async () => {
  await assert.rejects(
    async () => {
      await executeRestoreDrill({
        sourceSnapshot: {},
        targetDbName: 'truongthanh_prod',
      });
    },
    { message: /THAO TÁC BỊ CHẶN/ },
  );
});

test('backup-restore-drill: executeRestoreDrill executes full drill successfully', async () => {
  const snapshot = {
    users: [{ _id: 'u1', username: 'admin' }],
    products: [{ _id: 'p1', sku: 'SKU01', name: 'Bút bi' }],
    inventories: [{ _id: 'i1', product: 'p1', currentStock: 100 }],
    cash_accounts: [
      {
        _id: 'ca1',
        code: 'TM',
        openingBalance: 500000,
        currentBalance: 700000,
      },
    ],
    cash_entries: [
      {
        _id: 'ce1',
        account: 'ca1',
        direction: 'IN',
        amount: 200000,
        status: 'POSTED',
      },
    ],
    orders: [
      {
        _id: 'o1',
        subtotal: 200000,
        shippingFee: 0,
        discountAmount: 0,
        totalAmount: 200000,
        paymentStatus: 'PAID',
      },
    ],
  };

  const drillResult = await executeRestoreDrill({
    sourceSnapshot: snapshot,
    targetDbName: 'truongthanh_restore_drill',
  });

  assert.equal(drillResult.overallPassed, true);
  assert.equal(drillResult.audits.cashLedger.passed, true);
  assert.equal(drillResult.audits.inventory.passed, true);
  assert.equal(drillResult.audits.orders.passed, true);
  assert.equal(drillResult.audits.documentCounts.passed, true);
});
