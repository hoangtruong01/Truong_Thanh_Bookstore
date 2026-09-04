import { test, expect } from '@playwright/test';
import { setupMockAuth, mockAdminUser } from './helpers/test-helpers';

test.describe('Admin order approval', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page, mockAdminUser);
  });

  test('transitions a PENDING order to CONFIRMED through the admin UI', async ({ page }) => {
    let orderStatus = 'PENDING';
    const orderTimeline = [
      {
        status: 'PENDING',
        note: 'Đơn hàng được khởi tạo',
        createdAt: new Date().toISOString(),
      },
    ];

    await page.route(/\/api\/orders(?:\/.*)?(?:\?.*)?$/, async (route) => {
      if (route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON() as {
          orderStatus: string;
          note?: string;
        };
        orderStatus = body.orderStatus;
        orderTimeline.push({
          status: body.orderStatus,
          note: body.note || 'Quản trị viên đã duyệt đơn hàng',
          createdAt: new Date().toISOString(),
        });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              _id: 'ord_admin_001',
              orderCode: 'TT260904ADM1',
              orderStatus,
              timeline: orderTimeline,
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            data: [
              {
                _id: 'ord_admin_001',
                orderCode: 'TT260904ADM1',
                customerName: 'Trần Thị Khách',
                phone: '0988776655',
                customerEmail: 'customer@example.com',
                shippingAddress: 'Hà Nội',
                subtotal: 250000,
                shippingFee: 30000,
                discount: 0,
                total: 280000,
                orderStatus,
                paymentMethod: 'COD',
                paymentStatus: 'UNPAID',
                timeline: orderTimeline,
                items: [
                  {
                    product: 'prod_book_001',
                    name: 'Giáo Trình Cấu Trúc Dữ Liệu',
                    quantity: 2,
                    price: 125000,
                  },
                ],
                createdAt: new Date().toISOString(),
              },
            ],
            total: 1,
          },
        }),
      });
    });

    await page.goto('/admin/orders');
    await expect(page.getByText('TT260904ADM1').first()).toBeVisible();
    await page.locator('select').selectOption('CONFIRMED');
    await page.getByRole('button', { name: 'Lưu' }).click();

    await expect.poll(() => orderStatus).toBe('CONFIRMED');
    expect(orderTimeline).toHaveLength(2);
    expect(orderTimeline[1].status).toBe('CONFIRMED');
  });
});
