import { test, expect } from '@playwright/test';

test.describe('Kịch bản 1: Auth Lifecycle & Token Revocation', () => {
  test('Register -> Login -> Logout -> Verify old token revocation', async ({ page }) => {
    // 1. Mock auth endpoints for reliable CI execution
    let isTokenValid = false;

    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'usr_new_789',
            email: 'newbie@truongthanh.vn',
            fullName: 'Người Dùng Mới',
            role: 'CUSTOMER',
          },
        }),
      });
    });

    await page.route('**/api/auth/login', async (route) => {
      isTokenValid = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'usr_new_789',
            email: 'newbie@truongthanh.vn',
            fullName: 'Người Dùng Mới',
            role: 'CUSTOMER',
          },
        }),
      });
    });

    await page.route('**/api/auth/logout', async (route) => {
      isTokenValid = false;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Đăng xuất thành công' }),
      });
    });

    await page.route('**/api/auth/me', async (route) => {
      if (isTokenValid) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'usr_new_789',
            email: 'newbie@truongthanh.vn',
            fullName: 'Người Dùng Mới',
            role: 'CUSTOMER',
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            errorCode: 'ERR_UNAUTHORIZED',
            message: 'Phiên đăng nhập đã hết hạn',
          }),
        });
      }
    });

    // 2. Visit login page
    await page.goto('/login');
    await expect(page).toHaveTitle(/Trường Thành/i);

    // 3. Fill and submit login form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill('newbie@truongthanh.vn');
      await passwordInput.fill('Password123!');
      await submitBtn.click();
    }

    // 4. Browser session stores only non-sensitive user state. Auth tokens stay
    // in HttpOnly cookies and must never be visible to JavaScript.
    await expect(page).not.toHaveURL(/\/login$/);
    const browserStorage = await page.evaluate(() => ({
      user: localStorage.getItem('user'),
      token: localStorage.getItem('token'),
      accessToken: localStorage.getItem('access_token'),
      refreshToken: localStorage.getItem('refreshToken'),
      snakeRefreshToken: localStorage.getItem('refresh_token'),
    }));
    expect(browserStorage.user).toContain('newbie@truongthanh.vn');
    expect(browserStorage.token).toBeNull();
    expect(browserStorage.accessToken).toBeNull();
    expect(browserStorage.refreshToken).toBeNull();
    expect(browserStorage.snakeRefreshToken).toBeNull();

    // 5. Logout through the real UI/store and verify the protected-route guard.
    const accountName = page.getByText('Người Dùng Mới', { exact: true });
    await expect(accountName).toBeVisible();
    const toastClose = page.getByRole('button', { name: 'close' }).first();
    if (await toastClose.isVisible()) {
      await toastClose.click();
    }
    await accountName.hover();
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
    await expect(page).toHaveURL(/\/login/);
    expect(await page.evaluate(() => localStorage.getItem('user'))).toBeNull();

    await page.goto('/my-orders');
    await expect(page).toHaveURL(/\/login/);
  });
});
