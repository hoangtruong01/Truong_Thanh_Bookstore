import { describe, it, expect } from 'vitest'
import {
  SITE_URL,
  absoluteUrl,
  buildCanonicalUrl,
  normalizePath,
  toMetaDescription,
  isNoIndex,
} from '../seo'

describe('utils/seo (SEO-TASK-002)', () => {
  it('SITE_URL is an absolute origin without trailing slash', () => {
    expect(SITE_URL).toMatch(/^https?:\/\/[^/]+$/)
  })

  describe('absoluteUrl', () => {
    it('prefixes relative paths with SITE_URL', () => {
      expect(absoluteUrl('/logo.jpg')).toBe(`${SITE_URL}/logo.jpg`)
      expect(absoluteUrl('logo.jpg')).toBe(`${SITE_URL}/logo.jpg`)
    })

    it('keeps absolute http(s) URLs and upgrades protocol-relative ones', () => {
      expect(absoluteUrl('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg')
      expect(absoluteUrl('//cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg')
    })

    it('rejects data:/blob: URIs and empty input (not valid for og:image / JSON-LD)', () => {
      expect(absoluteUrl('data:image/png;base64,AAAA')).toBe('')
      expect(absoluteUrl('blob:https://x/123')).toBe('')
      expect(absoluteUrl('')).toBe('')
      expect(absoluteUrl(undefined)).toBe('')
    })
  })

  describe('buildCanonicalUrl', () => {
    it('drops every query param by default', () => {
      expect(buildCanonicalUrl('/products', { q: 'bút', sort: 'price' })).toBe(`${SITE_URL}/products`)
    })

    it('keeps only whitelisted params, in whitelist order', () => {
      expect(
        buildCanonicalUrl('/products', { sort: 'x', productType: 'BOOK', category: 'abc' }, ['category', 'productType']),
      ).toBe(`${SITE_URL}/products?category=abc&productType=BOOK`)
    })

    it('omits empty values and page=1 / non-numeric page', () => {
      expect(buildCanonicalUrl('/products', { category: '', page: '1' }, ['category', 'page'])).toBe(`${SITE_URL}/products`)
      expect(buildCanonicalUrl('/products', { page: 'abc' }, ['page'])).toBe(`${SITE_URL}/products`)
      expect(buildCanonicalUrl('/products', { page: '3' }, ['page'])).toBe(`${SITE_URL}/products?page=3`)
    })

    it('normalizes trailing slashes but keeps the homepage slash', () => {
      expect(buildCanonicalUrl('/products/')).toBe(`${SITE_URL}/products`)
      expect(buildCanonicalUrl('/')).toBe(`${SITE_URL}/`)
      expect(normalizePath('')).toBe('/')
    })

    it('encodes Vietnamese values safely', () => {
      expect(buildCanonicalUrl('/info', { tab: 'liên hệ' }, ['tab'])).toBe(`${SITE_URL}/info?tab=li%C3%AAn+h%E1%BB%87`)
    })
  })

  describe('toMetaDescription', () => {
    it('strips markdown, HTML and collapses whitespace', () => {
      const md = '## Giới thiệu\n\n**Bút bi** _Thiên Long_ <b>chính hãng</b> [xem](https://x.y) ![img](a.png)\n- Mực đều'
      expect(toMetaDescription(md)).toBe('Giới thiệu Bút bi Thiên Long chính hãng xem Mực đều')
    })

    it('truncates on a word boundary with an ellipsis', () => {
      const long = 'sách '.repeat(60)
      const out = toMetaDescription(long, 50)
      expect(out.length).toBeLessThanOrEqual(50)
      expect(out.endsWith('…')).toBe(true)
      expect(out).not.toMatch(/\s…$/)
    })

    it('returns empty string for empty input', () => {
      expect(toMetaDescription(undefined)).toBe('')
      expect(toMetaDescription('   ')).toBe('')
    })
  })

  it('isNoIndex detects noindex directives', () => {
    expect(isNoIndex('noindex, follow')).toBe(true)
    expect(isNoIndex('index, follow')).toBe(false)
    expect(isNoIndex(undefined)).toBe(false)
  })
})
