import { describe, it, expect } from 'vitest'
import {
  buildFeaturedCategories,
  buildHomeNavItems,
  getCategoryIdBySlug,
  resolveHomeCategoryLink,
} from '../homeCategories'
import { buildDealPages, getSoldProgress } from '../flashSale'
import { homeBackgrounds, optimizedBackground } from '../homeBackgrounds'

const parents = [
  { _id: 'c-sgk', slug: 'sach-giao-khoa', name: 'Sách giáo khoa' },
  { _id: 'c-stk', slug: 'sach-tham-khao', name: 'Sách tham khảo' },
  { _id: 'c-toy', slug: 'do-choi', name: 'Đồ chơi' },
  { _id: 'c-comic', slug: 'truyen-tranh', name: 'Truyện tranh' },
  { _id: 'c-combo', slug: 'combo', name: 'Combo' },
  { _id: 'c-gift', slug: 'do-luu-niem', name: 'Đồ lưu niệm' },
] as any[]

describe('homeCategories', () => {
  it('returns no items before the parent categories are loaded', () => {
    expect(buildHomeNavItems([])).toEqual([])
    expect(buildFeaturedCategories([])).toEqual([])
  })

  it('builds the nav pills in their legacy order and links', () => {
    expect(buildHomeNavItems(parents)).toEqual([
      { name: 'Sách giáo khoa', icon: '📚', to: '/products?category=c-sgk' },
      { name: 'Sách tham khảo', icon: '📖', to: '/products?category=c-stk' },
      { name: 'Văn phòng phẩm', icon: '✏️', to: '/products?category=c-gift&q=bút' },
      { name: 'Đồ chơi', icon: '🧸', to: '/products?category=c-toy' },
      { name: 'Truyện tranh', icon: '📕', to: '/products?category=c-comic' },
      { name: 'Lưu niệm', icon: '🎁', to: '/products?category=c-gift' },
      { name: 'Combo ưu đãi', icon: '🔥', to: '/products?category=c-combo' },
    ])
  })

  it('builds the featured cards in their legacy order with the same links as the nav', () => {
    const featured = buildFeaturedCategories(parents)
    expect(featured.map((c) => [c.name, c.desc, c.to])).toEqual([
      ['Sách giáo khoa', 'Đầy đủ cấp 1, 2, 3', '/products?category=c-sgk'],
      ['Sách tham khảo', 'Ôn luyện thi nâng cao', '/products?category=c-stk'],
      ['Truyện tranh', 'Manga, anime nổi bật', '/products?category=c-comic'],
      ['Văn phòng phẩm', 'Bút, sổ tay, file hồ sơ', '/products?category=c-gift&q=bút'],
      ['Đồ chơi', 'Lego, Rubik trí tuệ', '/products?category=c-toy'],
      ['Đồ lưu niệm', 'Quà tặng, phụ kiện xinh xắn', '/products?category=c-gift'],
      ['Combo ưu đãi', 'Trọn bộ học tập giá sốc', '/products?category=c-combo'],
    ])
    expect(featured[0].bgImage).toBe(homeBackgrounds.sgk)
    expect(featured[0].gradient).toContain('border-orange-100')
    expect(featured[3].bgImage).toBe(homeBackgrounds.doLuuNiem)
  })

  it('falls back to /products when a parent category is missing', () => {
    const onlyTextbook = parents.slice(0, 1)
    expect(resolveHomeCategoryLink(onlyTextbook, 'sgk')).toBe('/products?category=c-sgk')
    expect(resolveHomeCategoryLink(onlyTextbook, 'vpp')).toBe('/products')
    expect(buildHomeNavItems(onlyTextbook).filter((i) => i.to === '/products')).toHaveLength(6)
  })

  it('looks up a category id by slug, or "" when absent', () => {
    expect(getCategoryIdBySlug(parents, 'combo')).toBe('c-combo')
    expect(getCategoryIdBySlug(parents, 'khong-co')).toBe('')
    expect(getCategoryIdBySlug([], 'combo')).toBe('')
  })
})

describe('homeBackgrounds.optimizedBackground', () => {
  it('prefers the AVIF twin with a WebP fallback', () => {
    const value = optimizedBackground(homeBackgrounds.inspiration)
    expect(value.startsWith('image-set(')).toBe(true)
    expect(value).toContain('type("image/avif")')
    expect(value).toContain(`url("${homeBackgrounds.inspiration}") type("image/webp")`)
  })

  it('uses a plain url() for images without an AVIF twin', () => {
    expect(optimizedBackground('/x.webp')).toBe('url("/x.webp")')
  })
})

describe('flashSale.buildDealPages', () => {
  it('returns no pages for an empty list', () => {
    expect(buildDealPages([])).toEqual([])
  })

  it('pads the last page by wrapping around to the start', () => {
    expect(buildDealPages([1, 2, 3, 4, 5, 6, 7])).toEqual([
      [1, 2, 3, 4, 5],
      [6, 7, 1, 2, 3],
    ])
  })

  it('repeats items to fill a single page when there are fewer than the page size', () => {
    expect(buildDealPages(['a', 'b'])).toEqual([['a', 'b', 'a', 'b', 'a']])
  })

  it('keeps exact multiples of the page size unchanged', () => {
    expect(buildDealPages([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ])
  })
})

describe('flashSale.getSoldProgress', () => {
  it('computes the sold share from real sold and stock counts', () => {
    expect(getSoldProgress({ sold: 30, stock: 70 })).toBe(30)
    expect(getSoldProgress({ sold: 1, stock: 2 })).toBe(33)
    expect(getSoldProgress({ sold: 0, stock: 10 })).toBe(0)
  })

  it('reports a sold-out product as 100% instead of a capped value', () => {
    expect(getSoldProgress({ sold: 12, stock: 0 })).toBe(100)
  })

  it('returns null (bar hidden) instead of a made-up 30% when data is missing or invalid', () => {
    expect(getSoldProgress({})).toBeNull()
    expect(getSoldProgress({ sold: 5 })).toBeNull()
    expect(getSoldProgress({ stock: 5 })).toBeNull()
    expect(getSoldProgress({ sold: 0, stock: 0 })).toBeNull()
    expect(getSoldProgress({ sold: -1, stock: 5 })).toBeNull()
    expect(getSoldProgress({ sold: Number.NaN, stock: 5 })).toBeNull()
    expect(getSoldProgress({ sold: '10', stock: 5 })).toBeNull()
  })
})
