import { test, expect } from '@playwright/test';
import { setupMockAuth, mockAdminUser, mockCustomerUser } from './helpers/test-helpers';

test.describe('TT-024: Multi-Device Responsive Viewports & POS Barcode Scanner E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock background global endpoints
    await page.route('**/api/banners/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });
    await page.route('**/api/categories/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });
    await page.route('**/api/notifications/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });
  });

  test('Mobile viewport (390x844): Home & products layout does not horizontally overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupMockAuth(page, mockCustomerUser);

    await page.route('**/api/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              _id: 'prod_001',
              name: 'Bút Bi Thiên Long TL-027',
              price: 5000,
              discountPrice: 4500,
              stock: 100,
              unit: 'cây',
              images: ['https://placehold.co/300x300'],
              slug: 'but-bi-thien-long-tl-027',
            },
          ],
          total: 1,
        }),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify header exists and page content fits screen without horizontal scroll
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    expect(hasHorizontalOverflow).toBeFalsy();
  });

  test('Tablet viewport (820x1180): POS screen renders multi-cart tabs and quick cash buttons', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    const staffUser = {
      ...mockAdminUser,
      permissions: ['POS_ACCESS', 'MANAGE_ORDERS'],
    };
    await setupMockAuth(page, staffUser);

    await page.route('**/api/pos/products/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              _id: 'prod_001',
              name: 'Vở Kẻ Ngang Campus 200 trang',
              barcode: '8935001234567',
              price: 18000,
              stock: 50,
              unit: 'cuốn',
              images: ['https://placehold.co/100x100'],
            },
          ],
        }),
      });
    });

    await page.goto('/admin/pos');
    await page.waitForLoadState('networkidle');

    // Multi-cart tabs check (POS-09)
    await expect(page.locator('text=Đơn 1')).toBeVisible();

    // Quick cash buttons check
    await expect(page.locator('button:has-text("Đủ tiền")')).toBeVisible();
    await expect(page.locator('button:has-text("50k")')).toBeVisible();
    await expect(page.locator('button:has-text("100k")')).toBeVisible();
  });

  test('POS Barcode Scanner: Simulates keyboard barcode scan with Enter keypress to auto-add product', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const staffUser = {
      ...mockAdminUser,
      permissions: ['POS_ACCESS', 'MANAGE_ORDERS'],
    };
    await setupMockAuth(page, staffUser);

    const scannedProduct = {
      _id: 'prod_scan_001',
      name: 'Bút Gel M&G G-5 0.5mm',
      barcode: '8936009988776',
      price: 12000,
      stock: 40,
      unit: 'cây',
      images: ['https://placehold.co/100x100'],
    };

    await page.route('**/api/pos/products/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [scannedProduct],
        }),
      });
    });

    await page.goto('/admin/pos');
    await page.waitForLoadState('networkidle');

    // Type barcode into the scanner input and press Enter
    const scannerInput = page.locator('input[placeholder*="Quét mã vạch hoặc gõ SKU"]');
    await expect(scannerInput).toBeVisible();
    await scannerInput.fill('8936009988776');
    await scannerInput.press('Enter');

    // Item should appear in cart items list
    await expect(page.locator('text=Bút Gel M&G G-5 0.5mm')).toBeVisible();
    await expect(page.locator('text=12.000₫')).toBeVisible();
  });
});
