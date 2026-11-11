import { describe, it, expect, beforeEach } from 'vitest'
import { applySeoMeta, resetSeoForRoute, formatTitle, NOINDEX_ROBOTS } from '../useSeoMeta'
import { SITE_URL, SITE_NAME } from '@/utils/seo'

const meta = (sel: string) => document.head.querySelector(sel)?.getAttribute('content') ?? null
const canonical = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null

describe('useSeoMeta / applySeoMeta (SEO-TASK-001/003)', () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="robots" content="index, follow">'
    window.history.replaceState({}, '', '/products?category=abc&sort=price&q=')
  })

  it('formats titles with the site name once', () => {
    expect(formatTitle('Bút bi')).toBe(`Bút bi | ${SITE_NAME}`)
    expect(formatTitle(SITE_NAME)).toBe(SITE_NAME)
    expect(formatTitle(`Giỏ hàng — ${SITE_NAME}`)).toBe(`Giỏ hàng — ${SITE_NAME}`)
  })

  it('canonical strips query params unless whitelisted', () => {
    applySeoMeta({ title: 'Sản phẩm' })
    expect(canonical()).toBe(`${SITE_URL}/products`)

    applySeoMeta({ title: 'Danh mục', canonicalQuery: ['category'] })
    expect(canonical()).toBe(`${SITE_URL}/products?category=abc`)
    expect(meta('meta[property="og:url"]')).toBe(`${SITE_URL}/products?category=abc`)
  })

  it('explicit canonical wins', () => {
    applySeoMeta({ title: 'SP', canonical: `${SITE_URL}/products/but-bi` })
    expect(canonical()).toBe(`${SITE_URL}/products/but-bi`)
  })

  it('noindex pages get robots noindex and NO canonical / og:url', () => {
    applySeoMeta({ title: 'SP', canonical: `${SITE_URL}/products/x` })
    applySeoMeta({ title: 'Tìm kiếm', robots: NOINDEX_ROBOTS })
    expect(meta('meta[name="robots"]')).toBe(NOINDEX_ROBOTS)
    expect(canonical()).toBeNull()
    expect(meta('meta[property="og:url"]')).toBeNull()
  })

  it('og:image is always absolute and falls back to a raster image (not SVG)', () => {
    applySeoMeta({ title: 'A' })
    expect(meta('meta[property="og:image"]')).toBe(`${SITE_URL}/logo.jpg`)
    applySeoMeta({ title: 'B', ogImage: '/uploads/p.jpg' })
    expect(meta('meta[property="og:image"]')).toBe(`${SITE_URL}/uploads/p.jpg`)
    applySeoMeta({ title: 'C', ogImage: 'data:image/png;base64,AAA' })
    expect(meta('meta[property="og:image"]')).toBe(`${SITE_URL}/logo.jpg`)
  })

  it('does not emit the obsolete meta title tag', () => {
    applySeoMeta({ title: 'A', description: 'mô tả' })
    expect(document.head.querySelector('meta[name="title"]')).toBeNull()
    expect(meta('meta[name="description"]')).toBe('mô tả')
  })

  it('resetSeoForRoute clears stale canonical/description from the previous page', () => {
    applySeoMeta({ title: 'SP cũ', description: 'mô tả cũ', canonical: `${SITE_URL}/products/cu` })
    window.history.replaceState({}, '', '/wishlist')
    resetSeoForRoute('Danh Sách Yêu Thích', true)
    expect(meta('meta[name="robots"]')).toBe('noindex, nofollow')
    expect(canonical()).toBeNull()
    expect(meta('meta[name="description"]')).not.toBe('mô tả cũ')

    window.history.replaceState({}, '', '/deal-hot')
    resetSeoForRoute('Deal', false)
    expect(meta('meta[name="robots"]')).toBe('index, follow')
    expect(canonical()).toBe(`${SITE_URL}/deal-hot`)
  })
})
