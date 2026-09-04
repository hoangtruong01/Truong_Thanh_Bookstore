import { test, expect } from '@playwright/test';
import {
  browserRequest,
  setupMockAuth,
  mockCustomerUser,
} from './helpers/test-helpers';

test.describe('Kịch bản 2: Add Cart -> COD Checkout -> My Orders -> PDF Invoice', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page, mockCustomerUser);
  });

  test('Customer adds item to cart, places COD order, and downloads invoice', async ({ page }) => {
    // 1. Mock cart and products
    await page.route('**/api/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              _id: 'prod_book_001',
              title: 'Đắc Nhân Tâm (Khổ Lớn)',
              price: 120000,
              discountPrice: 96000,
              stock: 50,
              images: ['https://placehold.co/300x400'],
              slug: 'dac-nhan-tam',
            },
          ],
          total: 1,
        }),
      });
    });

    await page.route('**/api/cart*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              product: {
                _id: 'prod_book_001',
                title: 'Đắc Nhân Tâm (Khổ Lớn)',
                price: 96000,
                stock: 50,
                images: ['https://placehold.co/300x400'],
              },
              quantity: 1,
              price: 96000,
            },
          ],
          totalPrice: 96000,
        }),
      });
    });

    // 2. Mock order placement
    let createdOrderId = 'ord_test_cod_001';
    await page.route('**/api/orders*', async (route) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();
        expect(postData.paymentMethod).toBe('COD');
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            _id: createdOrderId,
            orderCode: 'TTB-20260904-COD1',
            status: 'PENDING',
            paymentMethod: 'COD',
            paymentStatus: 'UNPAID',
            totalAmount: 96000,
            source: 'WEB',
            createdAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                _id: createdOrderId,
                orderCode: 'TTB-20260904-COD1',
                status: 'PENDING',
                paymentMethod: 'COD',
                paymentStatus: 'UNPAID',
                totalAmount: 96000,
                source: 'WEB',
                createdAt: new Date().toISOString(),
              },
            ],
            total: 1,
          }),
        });
      }
    });

    // 3. Mock invoice PDF download endpoint
    let invoiceDownloaded = false;
    await page.route(`**/api/orders/${createdOrderId}/invoice`, async (route) => {
      invoiceDownloaded = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-1.4 Mock PDF Invoice Content for Trường Thành Bookstore'),
      });
    });

    // 4. Visit cart page
    await page.goto('/cart');
    await page.waitForTimeout(500);

    // 5. Navigate to checkout
    await page.goto('/checkout');
    await page.waitForTimeout(500);

    const createResponse = await browserRequest<{
      orderSource: string;
      paymentMethod: string;
    }>(page, '/api/orders', {
      method: 'POST',
      data: {
        items: [{ product: 'prod_book_001', quantity: 1 }],
        shippingAddress: 'Hà Nội',
        phone: '0912345678',
        paymentMethod: 'COD',
      },
    });
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.paymentMethod).toBe('COD');

    // 6. Navigate to My Orders page
    await page.goto('/my-orders');
    await page.waitForTimeout(500);

    // 7. Verify invoice PDF download request succeeds
    const response = await browserRequest<string>(
      page,
      `/api/orders/${createdOrderId}/invoice`,
    );
    expect(response.status).toBe(200);
    expect(response.contentType).toContain('application/pdf');
    expect(invoiceDownloaded).toBe(true);
  });
});
