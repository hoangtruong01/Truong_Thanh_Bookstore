import { test, expect, type Page } from '@playwright/test';

/**
 * SEO regression tests (SEO-TEST-002/003/004/005/007/008/012/013/016/017).
 * API được giả lập => chạy được không cần backend. SITE_URL = VITE_SITE_URL hoặc domain production mặc định.
 */
const SITE_URL = (process.env.VITE_SITE_URL || 'https://truong-thanh-bookstore.vercel.app').replace(/\/+$/, '');

const CATEGORY = { _id: '665f0000000000000000c001', name: 'Sách thiếu nhi', slug: 'sach-thieu-nhi', description: 'Sách thiếu nhi chọn lọc cho bé từ 3 đến 12 tuổi.', parentId: null, status: true };
const PRODUCT = {
  _id: '665f00000000000000000001',
  name: 'Kính Vạn Hoa - Tập 1',
  slug: 'kinh-van-hoa-tap-1',
  sku: 'KVH-01',
  description: '**Kính Vạn Hoa** là bộ truyện nổi tiếng của _Nguyễn Nhật Ánh_.',
  category: CATEGORY,
  brand: '',
  author: 'Nguyễn Nhật Ánh',
  publisher: 'NXB Trẻ',
  isbn: '9786041123456',
  productType: 'BOOK',
  pages: 250,
  language: 'Tiếng Việt',
  price: 50000,
  discountPrice: 40000,
  stock: 12,
  unit: 'cuốn',
  images: ['https://images.example.com/kvh-1.jpg', 'https://images.example.com/kvh-1b.jpg'],
  rating: 5,
  sold: 3,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};
const REVIEWS = [
  { _id: 'r1', rating: 4, content: 'Hay', user: { _id: 'u1', fullName: 'A' }, createdAt: '2026-01-03T00:00:00.000Z' },
  { _id: 'r2', rating: 5, content: 'Rất hay', user: { _id: 'u2', fullName: 'B' }, createdAt: '2026-01-04T00:00:00.000Z' },
];

type ProductOverride = Partial<typeof PRODUCT> | 'notfound';

async function mockApi(page: Page, opts: { product?: ProductOverride } = {}) {
  const reviewRequests: string[] = [];
  // Ảnh sản phẩm giả lập (1x1 PNG) để component không chuyển sang placeholder do lỗi tải ảnh
  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  await page.route('https://images.example.com/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: pixel }));
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^.*\/api/, '');
    const json = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ success: status < 400, data }) });

    if (path.startsWith('/auth/')) return json({ message: 'Unauthorized' }, 401);
    if (/^\/products\/[^/]+\/reviews$/.test(path)) {
      reviewRequests.push(path);
      return json(REVIEWS);
    }
    if (/^\/products\/[^/]+\/related$/.test(path)) return json([]);
    if (path === `/products/${PRODUCT.slug}` || path === `/products/${PRODUCT._id}`) {
      if (opts.product === 'notfound') return json({ message: 'Không tìm thấy' }, 404);
      return json({ ...PRODUCT, ...(opts.product || {}) });
    }
    if (/^\/products\/[^/]+$/.test(path) && !['featured', 'best-selling', 'discounted', 'new', 'search', 'suggestions'].includes(path.split('/')[2])) {
      return json({ message: 'Không tìm thấy' }, 404);
    }
    if (path === '/categories' || path === '/categories/tree') return json([CATEGORY]);
    if (path === `/categories/${CATEGORY._id}`) return json(CATEGORY);
    if (path === '/products') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [PRODUCT], meta: { total: 1, totalPages: 1 } }),
      });
    }
    return json([]);
  });
  return { reviewRequests };
}

const robots = (page: Page) => page.locator('head meta[name="robots"]').getAttribute('content');
const canonicalCount = (page: Page) => page.locator('head link[rel="canonical"]').count();
const canonical = (page: Page) => page.locator('head link[rel="canonical"]').getAttribute('href');

async function jsonLd(page: Page, id: string) {
  const el = page.locator(`head script#structured-data-${id}`);
  if ((await el.count()) === 0) return null;
  return JSON.parse((await el.textContent()) || 'null');
}

test.describe('SEO', () => {
  test('SEO-TEST-017: initial HTML has no hardcoded homepage canonical/og:url', async ({ request }) => {
    const res = await request.get('/products/kinh-van-hoa-tap-1');
    const html = await res.text();
    expect(html).not.toMatch(/rel="canonical"/);
    expect(html).not.toMatch(/property="og:url"/);
    expect(html).not.toMatch(/og:image" content="[^"]*\.svg"/);
    expect(html).toMatch(/<html lang="vi">/);
  });

  test('SEO-TEST-002/004/007/008/012/013: product page metadata, canonical, JSON-LD, breadcrumb, alt, H1', async ({ page }) => {
    const { reviewRequests } = await mockApi(page);
    await page.goto(`/products/${PRODUCT.slug}`);
    await expect(page.locator('h1')).toHaveText(PRODUCT.name);

    await expect(page).toHaveTitle(`${PRODUCT.name} | Trường Thành Stationery`);
    expect(await robots(page)).toBe('index, follow');
    expect(await canonical(page)).toBe(`${SITE_URL}/products/${PRODUCT.slug}`);
    const description = await page.locator('head meta[name="description"]').getAttribute('content');
    expect(description).toBe('Kính Vạn Hoa là bộ truyện nổi tiếng của Nguyễn Nhật Ánh.');
    expect(await page.locator('head meta[property="og:image"]').getAttribute('content')).toBe(PRODUCT.images[0]);

    // Reviews dùng _id kể cả khi URL là slug (ECOM-04)
    await expect.poll(() => reviewRequests.length).toBeGreaterThan(0);
    expect(reviewRequests.every((p) => p.includes(PRODUCT._id))).toBe(true);

    await expect.poll(async () => (await jsonLd(page, 'product'))?.aggregateRating?.reviewCount).toBe(2);
    const product = await jsonLd(page, 'product');
    expect(product['@type']).toEqual(['Product', 'Book']);
    expect(product.offers).toMatchObject({ price: 40000, priceCurrency: 'VND', availability: 'https://schema.org/InStock', url: `${SITE_URL}/products/${PRODUCT.slug}` });
    expect(product.aggregateRating.ratingValue).toBe(4.5); // trung bình review hiển thị, không dùng product.rating = 5
    expect(product.brand).toBeUndefined(); // không bịa brand
    expect(product).toMatchObject({ isbn: PRODUCT.isbn, gtin13: PRODUCT.isbn, author: { name: PRODUCT.author } });
    expect(product.image).toEqual(PRODUCT.images);

    await expect.poll(async () => (await jsonLd(page, 'breadcrumb'))?.itemListElement?.length ?? 0).toBeGreaterThanOrEqual(3);
    const crumbs = await jsonLd(page, 'breadcrumb');
    expect(crumbs.itemListElement.at(-1)).toMatchObject({ name: PRODUCT.name, item: `${SITE_URL}/products/${PRODUCT.slug}` });

    const mainImgAlts = await page.locator('img[fetchpriority="high"]').evaluateAll((els) => els.map((e) => e.getAttribute('alt')));
    expect(mainImgAlts[0]).toContain(PRODUCT.name);
    expect(await page.locator('h1').count()).toBe(1);
  });

  test('SEO-TEST-010: missing product is noindex with no canonical and no product JSON-LD (soft-404)', async ({ page }) => {
    await mockApi(page, { product: 'notfound' });
    await page.goto(`/products/${PRODUCT.slug}`);
    await expect(page.getByText('Không tìm thấy sản phẩm').first()).toBeVisible();
    await expect.poll(() => robots(page)).toBe('noindex, follow');
    expect(await canonicalCount(page)).toBe(0);
    expect(await jsonLd(page, 'product')).toBeNull();
  });

  test('SEO-TEST-010: discontinued (INACTIVE) product is noindex without Product schema', async ({ page }) => {
    await mockApi(page, { product: { status: 'INACTIVE' } });
    await page.goto(`/products/${PRODUCT.slug}`);
    await expect(page.locator('h1')).toHaveText(PRODUCT.name);
    await expect.poll(() => robots(page)).toBe('noindex, follow');
    expect(await canonicalCount(page)).toBe(0);
    expect(await jsonLd(page, 'product')).toBeNull();
  });

  test('SEO-TEST-016: unknown URL renders 404 with noindex', async ({ page }) => {
    await mockApi(page);
    await page.goto('/trang-khong-ton-tai');
    await expect.poll(() => robots(page)).toMatch(/noindex/);
    expect(await canonicalCount(page)).toBe(0);
  });

  test('SEO-TEST-003/018: category page has own title/H1/canonical; search is noindex', async ({ page }) => {
    await mockApi(page);
    await page.goto(`/products?category=${CATEGORY._id}&sort=price_asc&utm_source=fb`);
    await expect(page.locator('h1')).toHaveText(CATEGORY.name);
    await expect(page).toHaveTitle(`${CATEGORY.name} | Trường Thành Stationery`);
    expect(await canonical(page)).toBe(`${SITE_URL}/products?category=${CATEGORY._id}`);
    expect(await robots(page)).toBe('index, follow');
    expect(await page.locator('head meta[name="description"]').getAttribute('content')).toBe(CATEGORY.description);

    await page.goto('/products?q=bút');
    await expect(page.locator('h1')).toHaveText('Kết quả tìm kiếm "bút"');
    await expect.poll(() => robots(page)).toBe('noindex, follow');
    expect(await canonicalCount(page)).toBe(0);
  });

  test('SEO-TEST-001: homepage title, canonical, Organization + WebSite JSON-LD', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await expect(page).toHaveTitle('Sách & Văn Phòng Phẩm Chính Hãng | Trường Thành Stationery');
    expect(await canonical(page)).toBe(`${SITE_URL}/`);
    await expect.poll(async () => (await jsonLd(page, 'organization'))?.['@type']).toBe('Organization');
    expect((await jsonLd(page, 'website'))?.url).toBe(`${SITE_URL}/`);
  });

  test('SEO-TEST-004: client-side navigation does not leak product canonical/JSON-LD to the next page', async ({ page }) => {
    await mockApi(page);
    await page.goto(`/products/${PRODUCT.slug}`);
    await expect(page.locator('h1')).toHaveText(PRODUCT.name);
    await expect.poll(async () => (await jsonLd(page, 'product')) !== null).toBe(true);

    // Điều hướng SPA thật qua history API của vue-router
    await page.evaluate(() => (document.querySelector('#app') as any).__vue_app__.config.globalProperties.$router.push('/deal-hot'));
    await expect.poll(() => canonical(page)).toBe(`${SITE_URL}/deal-hot`);
    expect(await jsonLd(page, 'product')).toBeNull();
    expect(await jsonLd(page, 'breadcrumb')).toBeNull();
  });
});
