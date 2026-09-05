#!/usr/bin/env node
/**
 * Trường Thành Bookstore — Concurrent Orders & Stock Race-Condition Load Test
 * Usage: node scripts/load/concurrent-orders.load.js [TARGET_URL] [CONCURRENCY]
 * Example: node scripts/load/concurrent-orders.load.js http://localhost:3000 10
 */

const targetUrl = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');
const totalConcurrentRequests = Number(process.argv[3] || 10);
if (!Number.isSafeInteger(totalConcurrentRequests) || totalConcurrentRequests < 1) {
  throw new Error('CONCURRENCY must be a positive integer');
}
const request = (url, options = {}) => fetch(url, {
  ...options, signal: AbortSignal.timeout(15000),
});

console.log('======================================================================');
console.log('🔒 CONCURRENT ORDERS & INVENTORY RACE-CONDITION SAFETY TEST');
console.log(`Target:      ${targetUrl}`);
console.log(`Concurrency: ${totalConcurrentRequests} simultaneous checkout requests`);
console.log('======================================================================\n');

async function runRaceConditionTest() {
  // Step 1: Find a product to test with
  console.log('Step 1: Finding an active product for checkout test...');
  const prodRes = await request(`${targetUrl}/api/products?limit=10`);
  if (!prodRes.ok) {
    throw new Error(`Failed to fetch products: ${prodRes.status} ${prodRes.statusText}`);
  }
  const prodData = await prodRes.json();
  const products = prodData.data?.data || prodData.data || prodData;
  const targetProduct = Array.isArray(products)
    ? products.find((p) => p.stock > 0)
    : null;

  if (!targetProduct) {
    throw new Error('No in-stock product found: concurrency test was not executed');
  }

  const initialStock = targetProduct.stock;
  console.log(`  Selected Product: "${targetProduct.name}" (ID: ${targetProduct._id})`);
  console.log(`  Initial Stock:    ${initialStock}`);
  console.log(`  Firing ${totalConcurrentRequests} checkout requests (quantity = 1 each)...\n`);

  // Step 2: Prepare concurrent requests
  const checkoutPayload = {
    customerName: 'Load Tester Race Condition',
    phone: '0988776655',
    customerEmail: `loadtest_${Date.now()}@example.com`,
    shippingAddress: '123 Phố Kiểm Thử Chịu Tải, Hà Nội',
    paymentMethod: 'COD',
    items: [
      {
        product: targetProduct._id,
        name: targetProduct.name,
        price: targetProduct.discountPrice > 0 ? targetProduct.discountPrice : targetProduct.price,
        quantity: 1,
      },
    ],
  };

  const requests = Array.from({ length: totalConcurrentRequests }, (_, idx) =>
    request(`${targetUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        ...checkoutPayload,
        idempotencyKey: `load-${crypto.randomUUID()}`,
        customerName: `Tester #${idx + 1}`,
      }),
    }).then(async (res) => {
      const body = await res.json().catch(() => ({}));
      return { status: res.status, body };
    }).catch((err) => ({
      status: 0,
      error: err.message,
    }))
  );

  const results = await Promise.all(requests);

  // Step 3: Analyze results
  let successCount = 0;
  let outOfStockCount = 0;
  let otherErrorsCount = 0;

  for (const r of results) {
    if (r.status === 201) {
      successCount++;
    } else if (
      r.status === 400 &&
      /không đủ|hết hàng|stock|insufficient/i.test(JSON.stringify(r.body))
    ) {
      outOfStockCount++;
    } else {
      otherErrorsCount++;
    }
  }

  console.log('======================================================================');
  console.log('📊 CONCURRENCY RESULTS');
  console.log('======================================================================');
  console.log(`Total Requests Sent:    ${totalConcurrentRequests}`);
  console.log(`Orders Created (201):   ${successCount}`);
  console.log(`Rejected Stock (400):   ${outOfStockCount}`);
  console.log(`Other Responses / Err:  ${otherErrorsCount}`);
  console.log('----------------------------------------------------------------------');

  // Step 4: Verify final stock
  const finalProdRes = await request(`${targetUrl}/api/products/${targetProduct._id}`);
  let finalStock = null;
  if (finalProdRes.ok) {
    const finalProdData = await finalProdRes.json();
    finalStock = (finalProdData.data || finalProdData).stock;
    console.log(`Final Stock in DB:      ${finalStock}`);
  }

  console.log('======================================================================');

  // Invariants:
  // 1. successCount cannot exceed initialStock
  // 2. Final stock cannot be negative (stock >= 0)
  // 3. successCount + finalStock === initialStock (exact balance conservation)
  let invariantPassed = successCount > 0 && otherErrorsCount === 0 &&
    Number.isSafeInteger(finalStock) && Number.isSafeInteger(initialStock);
  if (!invariantPassed) {
    console.error('FAILED: requires successful checkouts, zero unexpected responses (including throttling), and a verified final stock.');
  }

  if (successCount > initialStock) {
    console.error(`❌ CRITICAL BUG: Oversold! Created ${successCount} orders but only ${initialStock} in stock.`);
    invariantPassed = false;
  }

  if (finalStock !== null && finalStock < 0) {
    console.error(`❌ CRITICAL BUG: Negative inventory! Final stock is ${finalStock}.`);
    invariantPassed = false;
  }

  if (finalStock !== null && successCount + finalStock !== initialStock) {
    console.error(
      `❌ INVENTORY CONSERVATION VIOLATED: Initial (${initialStock}) != Success (${successCount}) + Final (${finalStock})`
    );
    invariantPassed = false;
  }

  if (invariantPassed) {
    console.log('✅ ATOMIC CONCURRENCY SAFETY VERIFIED: Zero overselling, zero negative stock!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runRaceConditionTest().catch((err) => {
  console.error('Fatal load test error:', err);
  process.exit(1);
});
