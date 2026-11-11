import type { Category } from '@/types'
import { homeBackgrounds } from './homeBackgrounds'

/**
 * Single source for the home page category shortcuts: the top nav pills and the
 * "Danh mục nổi bật" cards both resolve their links from these entries.
 */
export type HomeCategoryKey = 'sgk' | 'stk' | 'vpp' | 'doChoi' | 'truyenTranh' | 'luuNiem' | 'combo'

interface HomeCategoryEntry {
  /** Parent category slug the link points to. */
  slug: string
  /** Extra query appended after the category id (e.g. a keyword filter). */
  extraQuery?: string
  nav: { name: string; icon: string }
  featured: { name: string; desc: string; bgImage: string; gradient: string }
}

export const HOME_CATEGORIES: Readonly<Record<HomeCategoryKey, HomeCategoryEntry>> = {
  sgk: {
    slug: 'sach-giao-khoa',
    nav: { name: 'Sách giáo khoa', icon: '📚' },
    featured: {
      name: 'Sách giáo khoa',
      desc: 'Đầy đủ cấp 1, 2, 3',
      bgImage: homeBackgrounds.sgk,
      gradient: 'bg-white border-orange-100 hover:border-orange-300 text-orange-950',
    },
  },
  stk: {
    slug: 'sach-tham-khao',
    nav: { name: 'Sách tham khảo', icon: '📖' },
    featured: {
      name: 'Sách tham khảo',
      desc: 'Ôn luyện thi nâng cao',
      bgImage: homeBackgrounds.sachThamKhao,
      gradient: 'bg-white border-pink-100 hover:border-pink-300 text-pink-950',
    },
  },
  vpp: {
    slug: 'do-luu-niem',
    extraQuery: 'q=bút',
    nav: { name: 'Văn phòng phẩm', icon: '✏️' },
    featured: {
      name: 'Văn phòng phẩm',
      desc: 'Bút, sổ tay, file hồ sơ',
      bgImage: homeBackgrounds.doLuuNiem,
      gradient: 'bg-white border-blue-100 hover:border-blue-300 text-blue-950',
    },
  },
  doChoi: {
    slug: 'do-choi',
    nav: { name: 'Đồ chơi', icon: '🧸' },
    featured: {
      name: 'Đồ chơi',
      desc: 'Lego, Rubik trí tuệ',
      bgImage: homeBackgrounds.doChoi,
      gradient: 'bg-white border-indigo-100 hover:border-indigo-300 text-indigo-950',
    },
  },
  truyenTranh: {
    slug: 'truyen-tranh',
    nav: { name: 'Truyện tranh', icon: '📕' },
    featured: {
      name: 'Truyện tranh',
      desc: 'Manga, anime nổi bật',
      bgImage: homeBackgrounds.truyenTranh,
      gradient: 'bg-white border-rose-100 hover:border-rose-300 text-rose-950',
    },
  },
  luuNiem: {
    slug: 'do-luu-niem',
    nav: { name: 'Lưu niệm', icon: '🎁' },
    featured: {
      name: 'Đồ lưu niệm',
      desc: 'Quà tặng, phụ kiện xinh xắn',
      bgImage: homeBackgrounds.doLuuNiem,
      gradient: 'bg-white border-purple-100 hover:border-purple-300 text-purple-950',
    },
  },
  combo: {
    slug: 'combo',
    nav: { name: 'Combo ưu đãi', icon: '🔥' },
    featured: {
      name: 'Combo ưu đãi',
      desc: 'Trọn bộ học tập giá sốc',
      bgImage: homeBackgrounds.combo,
      gradient: 'bg-white border-teal-100 hover:border-teal-300 text-emerald-950',
    },
  },
}

/** Display order of the top nav pills. */
export const NAV_ORDER: readonly HomeCategoryKey[] = ['sgk', 'stk', 'vpp', 'doChoi', 'truyenTranh', 'luuNiem', 'combo']
/** Display order of the featured category cards. */
export const FEATURED_ORDER: readonly HomeCategoryKey[] = ['sgk', 'stk', 'truyenTranh', 'vpp', 'doChoi', 'luuNiem', 'combo']

export interface HomeNavItem {
  name: string
  to: string
  icon: string
}

export interface HomeFeaturedCategory {
  name: string
  desc: string
  bgImage: string
  gradient: string
  to: string
}

/** Id of the parent category with `slug`, or '' when it is not loaded. */
export function getCategoryIdBySlug(categories: readonly Category[], slug: string): string {
  return categories.find((c) => c.slug === slug)?._id ?? ''
}

/** Product-list link for a home category; falls back to `/products` when its parent category is missing. */
export function resolveHomeCategoryLink(categories: readonly Category[], key: HomeCategoryKey): string {
  const entry = HOME_CATEGORIES[key]
  const id = getCategoryIdBySlug(categories, entry.slug)
  if (!id) return '/products'
  return `/products?category=${id}${entry.extraQuery ? `&${entry.extraQuery}` : ''}`
}

export function buildHomeNavItems(categories: readonly Category[]): HomeNavItem[] {
  if (!categories.length) return []
  return NAV_ORDER.map((key) => ({
    ...HOME_CATEGORIES[key].nav,
    to: resolveHomeCategoryLink(categories, key),
  }))
}

export function buildFeaturedCategories(categories: readonly Category[]): HomeFeaturedCategory[] {
  if (!categories.length) return []
  return FEATURED_ORDER.map((key) => ({
    ...HOME_CATEGORIES[key].featured,
    to: resolveHomeCategoryLink(categories, key),
  }))
}
