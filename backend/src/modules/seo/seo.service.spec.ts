import { buildSitemapXml, resolveSiteUrl, SeoService } from './seo.service';
import { ProductStatus } from '../../common/enums';

function chain(result: unknown[]) {
  const q: any = {};
  q.sort = jest.fn(() => q);
  q.limit = jest.fn(() => q);
  q.lean = jest.fn(() => q);
  q.exec = jest.fn(async () => result);
  return q;
}

describe('SEO sitemap (SEO-TASK-011)', () => {
  describe('resolveSiteUrl', () => {
    it('prefers SITE_URL, strips trailing slash, takes first CORS origin', () => {
      expect(resolveSiteUrl('https://shop.vn/', 'https://other.vn')).toBe(
        'https://shop.vn',
      );
      expect(resolveSiteUrl(undefined, 'https://a.vn, https://b.vn')).toBe(
        'https://a.vn',
      );
    });

    it('ignores localhost/invalid values and falls back to production domain', () => {
      expect(resolveSiteUrl(undefined, 'http://localhost:5173')).toBe(
        'https://truong-thanh-bookstore.vercel.app',
      );
      expect(resolveSiteUrl('javascript:alert(1)')).toBe(
        'https://truong-thanh-bookstore.vercel.app',
      );
    });
  });

  describe('buildSitemapXml', () => {
    it('builds valid urlset with escaped loc, ISO lastmod and de-duplication', () => {
      const xml = buildSitemapXml('https://shop.vn', [
        { path: '/' },
        {
          path: '/products?category=1&x=2',
          lastmod: new Date('2026-01-02T00:00:00Z'),
        },
        { path: '/' },
        { path: 'relative-not-allowed' },
        { path: '/products/a', lastmod: 'not-a-date' },
      ]);
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain(
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      );
      expect(xml.match(/<url>/g)).toHaveLength(3);
      expect(xml).toContain(
        '<loc>https://shop.vn/products?category=1&amp;x=2</loc><lastmod>2026-01-02T00:00:00.000Z</lastmod>',
      );
      expect(xml).toContain('<url><loc>https://shop.vn/products/a</loc></url>');
      expect(xml).not.toContain('relative-not-allowed');
    });
  });

  describe('SeoService.buildSitemap', () => {
    it('queries only public indexable data and maps to canonical URLs', async () => {
      const productModel = {
        find: jest.fn(() =>
          chain([
            { slug: 'but-bi', updatedAt: new Date('2026-02-01T00:00:00Z') },
          ]),
        ),
      };
      const categoryModel = {
        find: jest.fn(() => chain([{ _id: 'c1', updatedAt: null }])),
      };
      const landingPageModel = {
        find: jest.fn(() => chain([{ slug: 'combo-hoc-sinh' }])),
      };
      const configService = {
        get: jest.fn((key: string) =>
          key === 'SITE_URL' ? 'https://shop.vn' : undefined,
        ),
      };
      const service = new SeoService(
        productModel as any,
        categoryModel as any,
        landingPageModel as any,
        configService as any,
      );

      const xml = await service.buildSitemap();

      expect(productModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isDeleted: { $ne: true },
          status: { $in: [ProductStatus.ACTIVE, ProductStatus.OUT_OF_STOCK] },
        }),
        { slug: 1, updatedAt: 1 },
      );
      expect(categoryModel.find).toHaveBeenCalledWith(
        { status: true },
        expect.any(Object),
      );
      expect(landingPageModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: true }),
        expect.any(Object),
      );
      expect(xml).toContain('<loc>https://shop.vn/</loc>');
      expect(xml).toContain(
        '<loc>https://shop.vn/products/but-bi</loc><lastmod>2026-02-01T00:00:00.000Z</lastmod>',
      );
      expect(xml).toContain('<loc>https://shop.vn/products?category=c1</loc>');
      expect(xml).toContain('<loc>https://shop.vn/t/combo-hoc-sinh</loc>');
      // Không lộ trang riêng tư
      expect(xml).not.toMatch(/admin|cart|checkout|login|my-orders/);
    });
  });
});
