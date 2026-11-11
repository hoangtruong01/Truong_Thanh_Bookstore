import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Category } from '../categories/schemas/category.schema';
import { LandingPage } from '../landing-pages/schemas/landing-page.schema';
import { ProductStatus } from '../../common/enums';

const FALLBACK_SITE_URL = 'https://truong-thanh-bookstore.vercel.app';
/** Giới hạn của giao thức sitemap: tối đa 50.000 URL / file. */
export const SITEMAP_MAX_URLS = 50000;

export interface SitemapEntry {
  /** Path bắt đầu bằng "/" (vd. /products/but-bi) */
  path: string;
  lastmod?: Date | string | null;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toIsoDate(value?: Date | string | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Dựng XML sitemap (thuần, không I/O) — chỉ chứa URL canonical hợp lệ. */
export function buildSitemapXml(
  siteUrl: string,
  entries: SitemapEntry[],
): string {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const entry of entries) {
    if (!entry.path || !entry.path.startsWith('/')) continue;
    const loc = `${siteUrl}${entry.path}`;
    if (seen.has(loc)) continue;
    seen.add(loc);
    const lastmod = toIsoDate(entry.lastmod);
    urls.push(
      `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`,
    );
    if (urls.length >= SITEMAP_MAX_URLS) break;
  }
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

/** Chuẩn hóa origin công khai: chỉ http(s), bỏ "/" cuối, lấy giá trị đầu nếu là danh sách CORS. */
export function resolveSiteUrl(
  ...candidates: Array<string | undefined>
): string {
  for (const raw of candidates) {
    const first = (raw || '').split(',')[0].trim();
    if (
      /^https?:\/\/[^\s/]+/i.test(first) &&
      !/localhost|127\.0\.0\.1/i.test(first)
    ) {
      return first.replace(/\/+$/, '');
    }
  }
  return FALLBACK_SITE_URL;
}

/**
 * SEO-TASK-011: sitemap động. Chỉ gồm trang công khai được phép index:
 * trang chủ, danh sách SP, deal-hot, trang thông tin, danh mục đang bật,
 * sản phẩm ACTIVE/OUT_OF_STOCK chưa xóa (URL slug = canonical), landing page đang bật.
 * KHÔNG gồm admin, tài khoản, giỏ hàng, tìm kiếm, sản phẩm INACTIVE/đã xóa.
 */
@Injectable()
export class SeoService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @InjectModel(LandingPage.name)
    private readonly landingPageModel: Model<LandingPage>,
    private readonly configService: ConfigService,
  ) {}

  getSiteUrl(): string {
    return resolveSiteUrl(
      this.configService.get<string>('SITE_URL'),
      this.configService.get<string>('cors.frontendUrl'),
    );
  }

  async buildSitemap(): Promise<string> {
    const [products, categories, landingPages] = await Promise.all([
      this.productModel
        .find(
          {
            isDeleted: { $ne: true },
            status: { $in: [ProductStatus.ACTIVE, ProductStatus.OUT_OF_STOCK] },
            slug: { $exists: true, $ne: '' },
          },
          { slug: 1, updatedAt: 1 },
        )
        .sort({ updatedAt: -1 })
        .limit(SITEMAP_MAX_URLS)
        .lean()
        .exec(),
      this.categoryModel
        .find({ status: true }, { _id: 1, updatedAt: 1 })
        .lean()
        .exec(),
      this.landingPageModel
        .find(
          { status: true, slug: { $exists: true, $ne: '' } },
          { slug: 1, updatedAt: 1 },
        )
        .lean()
        .exec(),
    ]);

    const entries: SitemapEntry[] = [
      { path: '/' },
      { path: '/products' },
      { path: '/deal-hot' },
      { path: '/info' },
      // Canonical danh mục hiện tại: /products?category=<id> (khớp useSeoMeta canonicalQuery)
      ...categories.map((c: any) => ({
        path: `/products?category=${encodeURIComponent(String(c._id))}`,
        lastmod: c.updatedAt,
      })),
      ...products.map((p: any) => ({
        path: `/products/${encodeURIComponent(p.slug)}`,
        lastmod: p.updatedAt,
      })),
      ...landingPages.map((l: any) => ({
        path: `/t/${encodeURIComponent(l.slug)}`,
        lastmod: l.updatedAt,
      })),
    ];

    return buildSitemapXml(this.getSiteUrl(), entries);
  }
}
