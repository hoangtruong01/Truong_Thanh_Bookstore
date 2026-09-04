import { test, expect } from '@playwright/test';

test.describe('Landing-page checkout', () => {
  test('submits a bound package with an idempotency key through the real form', async ({ page }) => {
    let remainingStock = 20;
    let submittedBody: Record<string, unknown> | undefined;

    await page.route('**/api/landing-pages/public/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '507f1f77bcf86cd799439011',
          title: 'Combo Sách Ôn Thi Đại Học 2026',
          slug: 'combo-sach-on-thi',
          productId: '507f1f77bcf86cd799439012',
          price: 299000,
          originalPrice: 349000,
          images: [],
          benefits: [],
          testimonials: [],
          packages: [
            {
              name: 'Gói Thủ Khoa',
              productId: '507f1f77bcf86cd799439012',
              price: 299000,
              isBestSeller: true,
            },
          ],
          primaryColor: '#dc2626',
          backgroundColor: '#ffffff',
          textColor: '#1e293b',
          status: true,
        }),
      });
    });

    await page.route('**/api/landing-pages/submit-order', async (route) => {
      submittedBody = route.request().postDataJSON() as Record<string, unknown>;
      remainingStock -= 1;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            _id: 'ord_landing_888',
            orderCode: 'TT260904LP01',
            orderSource: 'LANDING_PAGE',
            total: 299000,
            orderStatus: 'PENDING',
          },
        }),
      });
    });

    await page.goto('/t/combo-sach-on-thi');
    await expect(page.getByText('Combo Sách Ôn Thi Đại Học 2026')).toBeVisible();
    await page.getByPlaceholder('Nhập họ và tên...').fill('Nguyễn Văn Thi');
    await page.getByPlaceholder('Nhập số điện thoại...').fill('0912345678');
    await page
      .getByPlaceholder('Số nhà, tên đường, thôn/xóm, phường/xã, quận/huyện, tỉnh...')
      .fill('123 Cầu Giấy, Hà Nội');
    await page.getByRole('button', { name: 'Xác nhận đặt hàng ngay' }).click();

    await expect(page.getByText('TT260904LP01')).toBeVisible();
    expect(submittedBody?.packageName).toBe('Gói Thủ Khoa');
    expect(submittedBody?.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/i);
    expect(remainingStock).toBe(19);
  });
});
