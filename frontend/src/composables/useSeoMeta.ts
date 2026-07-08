import { watch, onMounted } from 'vue'

interface SeoMetaOptions {
  title: string
  description?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogUrl?: string
  ogType?: string
  twitterCard?: string
  canonical?: string
}

const SITE_NAME = 'Trường Thành Stationery'
const DEFAULT_DESCRIPTION = 'Chuyên cung cấp dụng cụ học tập, viết bi, tập vở học sinh và thiết bị văn phòng chất lượng cao tại Việt Nam. Cam kết chính hãng 100%, đổi trả linh hoạt.'
const DEFAULT_OG_IMAGE = '/favicon.svg'

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

function setCanonical(url: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

/**
 * SEO composable for setting dynamic meta tags per page.
 * Automatically sets document.title, meta description, Open Graph, Twitter Card, and canonical URL.
 *
 * @example
 * useSeoMeta({
 *   title: 'Danh sách sản phẩm',
 *   description: 'Khám phá hơn 1000+ sản phẩm văn phòng phẩm chính hãng'
 * })
 */
export function useSeoMeta(options: SeoMetaOptions | (() => SeoMetaOptions)) {
  function apply() {
    const opts = typeof options === 'function' ? options() : options

    // Title
    const fullTitle = opts.title === SITE_NAME
      ? SITE_NAME
      : `${opts.title} | ${SITE_NAME}`
    document.title = fullTitle

    // Standard meta
    setMeta('description', opts.description || DEFAULT_DESCRIPTION)
    setMeta('title', fullTitle)

    // Open Graph
    setMeta('og:title', opts.ogTitle || fullTitle, true)
    setMeta('og:description', opts.ogDescription || opts.description || DEFAULT_DESCRIPTION, true)
    setMeta('og:image', opts.ogImage || DEFAULT_OG_IMAGE, true)
    setMeta('og:url', opts.ogUrl || opts.canonical || window.location.href, true)
    setMeta('og:type', opts.ogType || 'website', true)
    setMeta('og:site_name', SITE_NAME, true)
    setMeta('og:locale', 'vi_VN', true)

    // Twitter Card
    setMeta('twitter:card', opts.twitterCard || 'summary_large_image')
    setMeta('twitter:title', opts.ogTitle || fullTitle)
    setMeta('twitter:description', opts.ogDescription || opts.description || DEFAULT_DESCRIPTION)
    setMeta('twitter:image', opts.ogImage || DEFAULT_OG_IMAGE)

    // Canonical
    if (opts.canonical) {
      setCanonical(opts.canonical)
    } else {
      setCanonical(window.location.origin + window.location.pathname)
    }
  }

  onMounted(apply)

  // If reactive (function), watch for changes
  if (typeof options === 'function') {
    watch(options, apply, { deep: true })
  }
}
