const API_BASE = 'http://localhost:3000/api';
const ADMIN_PASSWORD = process.env.QA_ADMIN_PASSWORD;
const CUSTOMER_PASSWORD = process.env.QA_CUSTOMER_PASSWORD;

if (!ADMIN_PASSWORD || !CUSTOMER_PASSWORD) {
  throw new Error('QA_ADMIN_PASSWORD and QA_CUSTOMER_PASSWORD are required');
}

const results = [];

function assert(condition, suite, name, details) {
  results.push({ suite, name, passed: !!condition, details });
  if (condition) {
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    console.error(`  ❌ [FAIL] ${name}`, details ? JSON.stringify(details, null, 2) : '');
  }
}

function extractToken(res) {
  const cookie = res.headers.get('set-cookie');
  if (cookie) {
    const match = cookie.match(/access_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

async function runQA() {
  console.log('====================================================');
  console.log('   🔍 QA/QC AUTOMATED NOTIFICATION TEST SUITE');
  console.log('====================================================\n');

  // 1. ADMIN AUTHENTICATION
  console.log('📌 Test Suite 1: Admin Authentication & Reports Notifications');
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@truongthanh.vn',
      password: ADMIN_PASSWORD,
    }),
  });
  const adminToken = extractToken(adminLoginRes);
  assert(!!adminToken, 'Admin Auth', 'Admin should login successfully and receive auth cookie');

  // 2. GET ADMIN NOTIFICATIONS
  const adminNotifRes = await fetch(`${API_BASE}/reports/notifications`, {
    headers: { 
      Authorization: `Bearer ${adminToken}`,
      Cookie: `access_token=${adminToken}`
    },
  });
  const adminNotifsPayload = await adminNotifRes.json();
  const adminNotifs = adminNotifsPayload.data || adminNotifsPayload;
  assert(Array.isArray(adminNotifs), 'Admin Notifications', 'API should return array of notifications', { count: adminNotifs.length });
  
  if (Array.isArray(adminNotifs) && adminNotifs.length > 0) {
    const first = adminNotifs[0];
    assert(!!first.id && !!first.title && !!first.message && !!first.type && !!first.createdAt, 
      'Admin Notifications', 'Notification item should have id, title, message, type, createdAt', first);
    
    // Check sorting
    let isSorted = true;
    for (let i = 0; i < adminNotifs.length - 1; i++) {
      if (new Date(adminNotifs[i].createdAt).getTime() < new Date(adminNotifs[i + 1].createdAt).getTime()) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, 'Admin Notifications', 'Notifications must be sorted newest first (descending)');
  }

  // 3. CUSTOMER AUTHENTICATION
  console.log('\n📌 Test Suite 2: Customer Authentication & Notifications');
  const custLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'customer@truongthanh.vn',
      password: CUSTOMER_PASSWORD,
    }),
  });
  const custToken = extractToken(custLoginRes);
  assert(!!custToken, 'Customer Auth', 'Customer should login successfully');

  const custNotifRes = await fetch(`${API_BASE}/notifications/my-notifications`, {
    headers: { 
      Authorization: `Bearer ${custToken}`,
      Cookie: `access_token=${custToken}`
    },
  });
  const custNotifsPayload = await custNotifRes.json();
  const notifList = custNotifsPayload.data?.data || custNotifsPayload.data || custNotifsPayload;
  assert(Array.isArray(notifList), 'Customer Notifications', 'API should return customer notification array', { count: notifList.length });

  // 4. ORDER PLACEMENT & LOYALTY NOTIFICATIONS
  console.log('\n📌 Test Suite 3: Order Lifecycle & Loyalty Point Triggering');
  
  // Get an active product
  const productsRes = await fetch(`${API_BASE}/products?limit=5`);
  const productsData = await productsRes.json();
  const productList = productsData.data?.data || productsData.data || productsData;
  const product = productList[0];
  assert(!!product, 'Products API', 'Should find active product to test order placement', { name: product?.name, price: product?.price });

  const orderPayload = {
    customerName: 'Nguyen Van QA Test',
    phone: '0912345678',
    shippingAddress: '123 Nguyen Trai, Q.1, TP.HCM',
    paymentMethod: 'COD',
    note: 'QA Test Order Automated',
    items: [
      {
        product: product._id,
        name: product.name,
        quantity: 2,
        price: product.price,
      }
    ],
  };

  const createOrderRes = await fetch(`${API_BASE}/orders/authenticated`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${custToken}`,
      Cookie: `access_token=${custToken}`
    },
    body: JSON.stringify(orderPayload),
  });
  const createdOrderPayload = await createOrderRes.json();
  const createdOrder = createdOrderPayload.data || createdOrderPayload;
  assert(!!createdOrder._id, 'Order Placement', 'Order should be created successfully', { code: createdOrder.orderCode, total: createdOrder.total });

  // Wait 1200ms for async notifications to process
  await new Promise((r) => setTimeout(r, 1200));

  // Check customer notifications for Order & Loyalty points
  const afterOrderNotifRes = await fetch(`${API_BASE}/notifications/my-notifications`, {
    headers: { 
      Authorization: `Bearer ${custToken}`,
      Cookie: `access_token=${custToken}`
    },
  });
  const afterOrderNotifsPayload = await afterOrderNotifRes.json();
  const afterNotifs = afterOrderNotifsPayload.data?.data || afterOrderNotifsPayload.data || afterOrderNotifsPayload;

  const orderReceivedNotif = afterNotifs.find((n) => n.meta?.orderId === createdOrder._id && n.type === 'order');
  assert(!!orderReceivedNotif, 'Order Notification', 'Customer should receive "Đặt hàng thành công" notification', orderReceivedNotif?.title);

  const loyaltyNotif = afterNotifs.find((n) => n.type === 'loyalty' && n.meta?.orderCode === createdOrder.orderCode);
  assert(!!loyaltyNotif, 'Loyalty Notification', 'Customer should receive "🪙 Tích điểm thành công" notification', loyaltyNotif?.title);

  // 5. ORDER STATUS WORKFLOW TO COMPLETED -> REVIEW INVITATION
  console.log('\n📌 Test Suite 4: Status Transition to COMPLETED & Review Invite');
  
  // Step A: PENDING -> CONFIRMED
  const confirmRes = await fetch(`${API_BASE}/orders/${createdOrder._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
      Cookie: `access_token=${adminToken}`
    },
    body: JSON.stringify({ orderStatus: 'CONFIRMED' }),
  });
  assert(confirmRes.status === 200, 'Order Status', 'Admin should confirm order (CONFIRMED)');

  // Step B: CONFIRMED -> SHIPPING
  const shipRes = await fetch(`${API_BASE}/orders/${createdOrder._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
      Cookie: `access_token=${adminToken}`
    },
    body: JSON.stringify({ orderStatus: 'SHIPPING' }),
  });
  assert(shipRes.status === 200, 'Order Status', 'Admin should set order to SHIPPING');

  // Step C: SHIPPING -> COMPLETED
  const completeRes = await fetch(`${API_BASE}/orders/${createdOrder._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
      Cookie: `access_token=${adminToken}`
    },
    body: JSON.stringify({ orderStatus: 'COMPLETED' }),
  });
  assert(completeRes.status === 200, 'Order Status', 'Admin should set order to COMPLETED');

  // Wait 1200ms for review invite notification
  await new Promise((r) => setTimeout(r, 1200));

  const afterCompleteNotifRes = await fetch(`${API_BASE}/notifications/my-notifications`, {
    headers: { 
      Authorization: `Bearer ${custToken}`,
      Cookie: `access_token=${custToken}`
    },
  });
  const afterCompleteData = await afterCompleteNotifRes.json();
  const completedNotifs = afterCompleteData.data?.data || afterCompleteData.data || afterCompleteData;

  const reviewInvite = completedNotifs.find((n) => n.type === 'review' && n.meta?.orderCode === createdOrder.orderCode);
  assert(!!reviewInvite, 'Review Invite Notification', 'Customer should receive "⭐ Đánh giá sản phẩm" review invitation', reviewInvite?.title);

  // 6. HIGH-VALUE COD ORDER TEST FOR ADMIN
  const targetQty = Math.max(12, Math.ceil(1100000 / (product.price || 100000)));
  const highValOrderPayload = {
    customerName: 'VIP Customer',
    phone: '0999888777',
    shippingAddress: '999 Luxury Blvd, Q.1, TP.HCM',
    paymentMethod: 'COD',
    note: 'QA High Value COD Order',
    items: [
      {
        product: product._id,
        name: product.name,
        quantity: targetQty,
        price: product.price,
      }
    ],
  };

  const highValOrderRes = await fetch(`${API_BASE}/orders/authenticated`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${custToken}`,
      Cookie: `access_token=${custToken}`
    },
    body: JSON.stringify(highValOrderPayload),
  });
  const highValOrderData = await highValOrderRes.json();
  const highValOrder = highValOrderData.data || highValOrderData;
  assert(highValOrder.total >= 1000000, 'High-Value Order', `Order total (${highValOrder.total?.toLocaleString('vi-VN')}đ) should be >= 1,000,000đ`);

  // Check admin notifications for High-Value COD Alert
  const finalAdminNotifRes = await fetch(`${API_BASE}/reports/notifications`, {
    headers: { 
      Authorization: `Bearer ${adminToken}`,
      Cookie: `access_token=${adminToken}`
    },
  });
  const finalAdminNotifsPayload = await finalAdminNotifRes.json();
  const finalAdminNotifs = finalAdminNotifsPayload.data || finalAdminNotifsPayload;
  const highValAlert = Array.isArray(finalAdminNotifs) && finalAdminNotifs.find((n) => n.type === 'high_value_order' && n.meta?.orderCode === highValOrder.orderCode);
  assert(!!highValAlert, 'Admin COD Alert', 'Admin should receive "🚨 Đơn hàng COD giá trị cao" notification', highValAlert?.title);

  console.log('\n====================================================');
  console.log('   📊 QA/QC TEST SUMMARY REPORT');
  console.log('====================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`Total Test Cases: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ${failed > 0 ? '❌' : '🎉'}`);
  console.log('====================================================\n');
}

runQA().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
});
