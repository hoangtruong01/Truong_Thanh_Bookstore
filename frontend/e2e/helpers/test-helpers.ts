import { Page } from '@playwright/test';

export const mockCustomerUser = {
  id: 'usr_customer_123',
  email: 'customer@truongthanh.vn',
  fullName: 'Nguyễn Văn Mua',
  role: 'CUSTOMER',
  status: true,
  tokenVersion: 1,
};

export const mockAdminUser = {
  id: 'usr_admin_456',
  email: 'admin@truongthanh.vn',
  fullName: 'Quản Trị Viên',
  role: 'ADMIN',
  permissions: ['MANAGE_ORDERS', 'VIEW_REPORTS', 'MANAGE_PRODUCTS'],
  status: true,
  tokenVersion: 1,
};

export async function setupMockAuth(page: Page, user = mockCustomerUser) {
  await page.addInitScript((userData) => {
    window.localStorage.setItem('user', JSON.stringify(userData));
  }, user);
}

export async function browserRequest<T>(
  page: Page,
  url: string,
  options: { method?: string; data?: unknown } = {},
): Promise<{ status: number; contentType: string; body: T }> {
  return page.evaluate(
    async ({ requestUrl, method, data }) => {
      const response = await fetch(requestUrl, {
        method,
        credentials: 'include',
        headers: data ? { 'Content-Type': 'application/json' } : undefined,
        body: data ? JSON.stringify(data) : undefined,
      });
      const contentType = response.headers.get('content-type') || '';
      const body = contentType.includes('application/json')
        ? await response.json()
        : await response.text();
      return { status: response.status, contentType, body };
    },
    {
      requestUrl: url,
      method: options.method || 'GET',
      data: options.data,
    },
  );
}
