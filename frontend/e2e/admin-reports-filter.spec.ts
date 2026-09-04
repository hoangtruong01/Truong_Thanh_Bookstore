import { test, expect } from '@playwright/test';
import { setupMockAuth, mockAdminUser } from './helpers/test-helpers';

test.describe('Admin revenue range filter', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAuth(page, mockAdminUser);
  });

  test('requests calculated reports for each range selected in the UI', async ({ page }) => {
    const interceptedRanges: string[] = [];

    await page.route('**/api/reports/**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/summary')) {
        const range = url.searchParams.get('range') || 'month';
        interceptedRanges.push(range);
        const multiplier = range === 'day' ? 1 : range === 'week' ? 7 : 30;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              kpis: {
                totalRevenue: 5000000 * multiplier,
                totalOrders: 20 * multiplier,
                totalProducts: 100,
                totalCustomers: 50,
                revenueGrowthRate: 15.4,
                ordersGrowthRate: 8.1,
              },
              categoryRevenue: [
                { category: 'Sách Văn Học', revenue: 2000000 * multiplier },
              ],
            },
          }),
        });
        return;
      }

      const data = url.pathname.endsWith('/category-revenue')
        ? [{ category: 'Sách Văn Học', revenue: 2000000 }]
        : [];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data }),
      });
    });

    await page.goto('/admin/reports');
    await expect(page.getByRole('button', { name: '7 ngày qua' })).toBeVisible();
    await page.getByRole('button', { name: '7 ngày qua' }).click();
    await expect.poll(() => interceptedRanges.includes('week')).toBe(true);
    await page.getByRole('button', { name: 'Hôm nay' }).click();
    await expect.poll(() => interceptedRanges.includes('day')).toBe(true);

    expect(interceptedRanges).toContain('month');
    expect(interceptedRanges).toContain('week');
    expect(interceptedRanges).toContain('day');
  });
});
