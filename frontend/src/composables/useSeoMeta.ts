import { watch, onMounted } from 'vue'
import {
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE_PATH,
  absoluteUrl,
  buildCanonicalUrl,
  isNoIndex,
} from '@/utils/seo'

export interface SeoMetaOptions {
  title: string
  description?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogUrl?: string
  ogType?: string
  twitterCard?: string
  /** Canonical tuyệt đối. Bỏ trống => SITE_URL + pathname (+ canonicalQuery). */
  canonical?: string
  /** Các query param được giữ trong canonical (vd. ['category', 'page']). */
  canonicalQuery?: string[]
  /** Giá trị meta robots. Bỏ trống => giữ giá trị router đã đặt theo route.meta.noIndex. */
  robots?: string
}

export const INDEX_ROBOTS = 'index, follow'
export const NOINDEX_ROBOTS = 'noindex, follow'

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name'
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function removeMeta(name: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name'
  document.querySelector(`meta[${attr}="${name}"]`)?.remove()
}

function setCanonical(url: string | null) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!url) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

function currentQuery(): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(window.location.search).entries())
}

export function formatTitle(title: string): string {
  if (!title || title === SITE_NAME) return SITE_NAME
  return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
}

/**
 * Áp dụng toàn bộ thẻ head SEO cho trang hiện tại.
 * Tách riêng để router (trang không gọi useSeoMeta) và unit test dùng lại.
 */
export function applySeoMeta(opts: SeoMetaOptions) {
  const fullTitle = formatTitle(opts.title)
  const description = opts.description || DEFAULT_DESCRIPTION
  const ogImage = absoluteUrl(opts.ogImage) || absoluteUrl(DEFAULT_OG_IMAGE_PATH)

  document.title = fullTitle
  setMeta('description', description)

  if (opts.robots) setMeta('robots', opts.robots)
  const robotsEl = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null
  const noIndex = isNoIndex(opts.robots ?? robotsEl?.content)

  const canonical = noIndex
    ? null
    : opts.canonical || buildCanonicalUrl(window.location.pathname, currentQuery(), opts.canonicalQuery)
  setCanonical(canonical)

  // Open Graph
  setMeta('og:title', opts.ogTitle || fullTitle, true)
  setMeta('og:description', opts.ogDescription || description, true)
  setMeta('og:image', ogImage, true)
  setMeta('og:type', opts.ogType || 'website', true)
  setMeta('og:site_name', SITE_NAME, true)
  setMeta('og:locale', 'vi_VN', true)
  const ogUrl = opts.ogUrl || canonical
  if (ogUrl) setMeta('og:url', ogUrl, true)
  else removeMeta('og:url', true)

  // Twitter Card
  setMeta('twitter:card', opts.twitterCard || 'summary_large_image')
  setMeta('twitter:title', opts.ogTitle || fullTitle)
  setMeta('twitter:description', opts.ogDescription || description)
  setMeta('twitter:image', ogImage)
}

/**
 * Đặt lại head về mặc định khi đổi route (chống "kẹt" canonical/og/description của trang trước
 * trong SPA). Trang nào gọi useSeoMeta sẽ ghi đè lại ngay sau khi mount.
 */
export function resetSeoForRoute(title: string, noIndex: boolean) {
  setMeta('robots', noIndex ? 'noindex, nofollow' : INDEX_ROBOTS)
  applySeoMeta({ title })
}

/**
 * SEO composable cho từng trang: title, description, robots, Open Graph, Twitter Card, canonical.
 *
 * @example
 * useSeoMeta(() => ({
 *   title: category.value?.name || 'Sản phẩm',
 *   description: '...',
 *   canonicalQuery: ['category', 'page'],
 *   robots: hasSearch.value ? NOINDEX_ROBOTS : INDEX_ROBOTS,
 * }))
 */
export function useSeoMeta(options: SeoMetaOptions | (() => SeoMetaOptions)) {
  function apply() {
    applySeoMeta(typeof options === 'function' ? options() : options)
  }

  onMounted(apply)

  if (typeof options === 'function') {
    watch(options, apply, { deep: true })
  }
}
