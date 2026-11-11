/**
 * SEO helpers dùng chung cho storefront (SEO-TASK-002).
 *
 * - SITE_URL: domain chính thức, đọc từ VITE_SITE_URL (fallback domain production hiện tại).
 * - absoluteUrl(): chuẩn hóa URL tuyệt đối cho canonical / og:image / JSON-LD.
 * - buildCanonicalUrl(): canonical chỉ giữ các query param được phép (vd. category, page).
 * - toMetaDescription(): bỏ markdown/HTML và cắt gọn cho meta description.
 */

const FALLBACK_SITE_URL = 'https://truong-thanh-bookstore.vercel.app'

function normalizeOrigin(raw: unknown): string {
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (!/^https?:\/\//i.test(value)) return FALLBACK_SITE_URL
  return value.replace(/\/+$/, '')
}

export const SITE_URL = normalizeOrigin(import.meta.env.VITE_SITE_URL)
export const SITE_NAME = 'Trường Thành Stationery'
export const DEFAULT_DESCRIPTION =
  'Chuyên cung cấp sách, dụng cụ học tập, bút viết, tập vở và thiết bị văn phòng chính hãng tại Việt Nam. Giao hàng toàn quốc, đổi trả linh hoạt.'
/** Ảnh chia sẻ mặc định: JPG raster (Facebook/Zalo không hỗ trợ SVG cho og:image). */
export const DEFAULT_OG_IMAGE_PATH = '/logo.jpg'

/**
 * Trả về URL tuyệt đối dựa trên SITE_URL.
 * Bỏ qua (trả '') với data:/blob: URI vì không hợp lệ cho og:image và JSON-LD.
 */
export function absoluteUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return ''
  const value = String(pathOrUrl).trim()
  if (!value || /^(data|blob):/i.test(value)) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith('//')) return `https:${value}`
  return `${SITE_URL}${value.startsWith('/') ? '' : '/'}${value}`
}

/** Bỏ dấu "/" cuối path (trừ trang chủ) để tránh trùng /products và /products/. */
export function normalizePath(path: string): string {
  if (!path || path === '/') return '/'
  return path.replace(/\/+$/, '') || '/'
}

/**
 * Canonical = SITE_URL + path (+ các query param nằm trong whitelist, theo thứ tự whitelist).
 * Bỏ giá trị rỗng và page=1 (trang 1 trùng với URL không có page).
 */
export function buildCanonicalUrl(
  path: string,
  query: Record<string, unknown> = {},
  allowedKeys: string[] = [],
): string {
  const params = new URLSearchParams()
  for (const key of allowedKeys) {
    const raw = query[key]
    const value = Array.isArray(raw) ? raw[0] : raw
    if (value === undefined || value === null) continue
    const str = String(value).trim()
    if (!str) continue
    if (key === 'page' && (str === '1' || !/^\d+$/.test(str))) continue
    params.set(key, str)
  }
  const qs = params.toString()
  return `${SITE_URL}${normalizePath(path)}${qs ? `?${qs}` : ''}`
}

/** Bỏ markdown/HTML, gộp khoảng trắng và cắt theo ranh giới từ (mặc định 160 ký tự). */
export function toMetaDescription(text?: string | null, maxLength = 160): string {
  if (!text) return ''
  const plain = String(text)
    .replace(/<[^>]*>/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    // Bỏ ký hiệu nhấn mạnh markdown (**đậm**, _nghiêng_, `code`, ~~gạch~~) mà không chèn khoảng trắng thừa
    .replace(/[`*~]+|(^|\s)_+|_+(?=\s|[.,;:!?]|$)/gm, '$1')
    .replace(/[>#|]+/g, ' ')
    .replace(/^\s*[-+]\s+/gm, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= maxLength) return plain
  const cut = plain.slice(0, maxLength - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`
}

/** True nếu chuỗi robots chứa noindex. */
export function isNoIndex(robots?: string | null): boolean {
  return !!robots && /noindex/i.test(robots)
}
