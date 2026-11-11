export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getDiscountPercent(price: number, discountPrice: number): number {
  if (discountPrice == null || discountPrice <= 0 || discountPrice >= price) return 0
  return Math.round(((price - discountPrice) / price) * 100)
}

/**
 * FIX-M03: Returns the effective price for a product.
 * If discountPrice is a positive number, use it; otherwise fall back to price.
 */
export function getEffectivePrice(price: number, discountPrice?: number | null): number {
  return (discountPrice != null && discountPrice > 0) ? discountPrice : price
}

/**
 * Formats a date as `dd/MM/yyyy HH:mm` (24h) in Vietnam time.
 * Returns '' for empty or invalid input so templates never show "Invalid Date".
 */
export function formatDateTime(date: string | number | Date | null | undefined): string {
  if (date === null || date === undefined || date === '') return ''
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`
}

// ─── Canonical status table ──────────────────────────────────────────────────
// Single source for status labels and badge colours used by StatusBadge, the
// customer order pages and admin pages. Order, payment and refund statuses live
// in separate maps because PENDING / CANCELLED / PROCESSING / REFUNDED exist in
// more than one backend enum with different meanings.
// Class strings are written out in full so Tailwind can detect them.

export type StatusTone = 'amber' | 'blue' | 'indigo' | 'purple' | 'emerald' | 'green' | 'rose' | 'sky' | 'slate'

export interface StatusToneClasses {
  /** Pill background + text + border colour (includes the `border` width). */
  badge: string
  /** Small dot inside the pill. */
  dot: string
  /** Inline coloured text, no background. */
  text: string
  /** -500 shade, for Flutter / charts. */
  hex: string
}

export const STATUS_TONE_CLASSES: Record<StatusTone, StatusToneClasses> = {
  amber: {
    badge: 'border bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    hex: '#F59E0B',
  },
  blue: {
    badge: 'border bg-blue-50 text-blue-700 border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
    dot: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    hex: '#3B82F6',
  },
  indigo: {
    badge: 'border bg-indigo-50 text-indigo-700 border-indigo-200/70 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
    dot: 'bg-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-400',
    hex: '#6366F1',
  },
  purple: {
    badge: 'border bg-purple-50 text-purple-700 border-purple-200/70 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
    dot: 'bg-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    hex: '#A855F7',
  },
  emerald: {
    badge: 'border bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    hex: '#10B981',
  },
  green: {
    badge: 'border bg-green-50 text-green-700 border-green-200/70 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800/60',
    dot: 'bg-green-500',
    text: 'text-green-600 dark:text-green-400',
    hex: '#22C55E',
  },
  rose: {
    badge: 'border bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    dot: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    hex: '#F43F5E',
  },
  sky: {
    badge: 'border bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
    dot: 'bg-sky-500',
    text: 'text-sky-600 dark:text-sky-400',
    hex: '#0EA5E9',
  },
  slate: {
    badge: 'border bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dot: 'bg-slate-500',
    text: 'text-slate-600 dark:text-slate-400',
    hex: '#64748B',
  },
}

/** Neutral style for statuses missing from every map. */
export const UNKNOWN_STATUS_CLASSES: StatusToneClasses = {
  badge: 'border bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700',
  dot: 'bg-slate-400',
  text: 'text-slate-500 dark:text-slate-400',
  hex: '#94A3B8',
}

export interface StatusMeta {
  label: string
  tone: StatusTone
}

/** Mirrors backend OrderStatus (backend/src/common/enums). */
export const ORDER_STATUS_META: Record<string, StatusMeta> = {
  PENDING: { label: 'Chờ xác nhận', tone: 'amber' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'blue' },
  PROCESSING: { label: 'Đang chuẩn bị hàng', tone: 'indigo' },
  SHIPPING: { label: 'Đang giao hàng', tone: 'purple' },
  DELIVERED: { label: 'Đã giao thành công', tone: 'emerald' },
  /** Deprecated in the backend; kept for historical orders. */
  COMPLETED: { label: 'Hoàn thành', tone: 'green' },
  RETURN_REQUESTED: { label: 'Yêu cầu trả hàng', tone: 'amber' },
  RETURN_APPROVED: { label: 'Đã duyệt trả hàng', tone: 'sky' },
  RETURNED: { label: 'Đã trả hàng', tone: 'slate' },
  CANCELLED: { label: 'Đã hủy', tone: 'rose' },
}

/** Mirrors backend PaymentStatus. */
export const PAYMENT_STATUS_META: Record<string, StatusMeta> = {
  UNPAID: { label: 'Chưa thanh toán', tone: 'amber' },
  PENDING: { label: 'Đang chờ thanh toán', tone: 'sky' },
  PARTIALLY_PAID: { label: 'Thanh toán một phần', tone: 'blue' },
  PAID: { label: 'Đã thanh toán', tone: 'emerald' },
  FAILED: { label: 'Thanh toán thất bại', tone: 'rose' },
  REFUNDED: { label: 'Đã hoàn tiền', tone: 'slate' },
  CANCELLED: { label: 'Đã hủy thanh toán', tone: 'slate' },
}

/** Mirrors backend RefundStatus. NONE has an empty label: it is not meant to be displayed. */
export const REFUND_STATUS_META: Record<string, StatusMeta> = {
  NONE: { label: '', tone: 'slate' },
  REQUESTED: { label: 'Chờ hoàn tiền', tone: 'amber' },
  PROCESSING: { label: 'Đang hoàn tiền', tone: 'blue' },
  REFUNDED: { label: 'Đã hoàn tiền', tone: 'emerald' },
  FAILED: { label: 'Hoàn tiền thất bại', tone: 'rose' },
  MANUAL_REQUIRED: { label: 'Cần xử lý thủ công', tone: 'purple' },
}

/** Mirrors backend PaymentMethod. */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  VNPAY: 'Cổng thanh toán VNPay',
  MOMO: 'Ví điện tử MoMo',
  EWALLET: 'Ví điện tử',
  CASH: 'Tiền mặt',
  CREDIT: 'Công nợ',
}

export const INVENTORY_STATUS_META: Record<string, StatusMeta> = {
  IN_STOCK: { label: 'Còn hàng', tone: 'emerald' },
  LOW_STOCK: { label: 'Sắp hết hàng', tone: 'amber' },
  OUT_OF_STOCK: { label: 'Hết hàng', tone: 'rose' },
}

export const BOOLEAN_STATUS_META: Record<string, StatusMeta> = {
  ACTIVE: { label: 'Hoạt động', tone: 'emerald' },
  TRUE: { label: 'Hoạt động', tone: 'emerald' },
  INACTIVE: { label: 'Đã khóa', tone: 'rose' },
  FALSE: { label: 'Đã khóa', tone: 'rose' },
  LOCKED: { label: 'Đã khóa', tone: 'rose' },
}

export type StatusDomain = 'order' | 'payment' | 'refund' | 'inventory' | 'boolean'

const STATUS_DOMAIN_MAPS: Record<StatusDomain, Record<string, StatusMeta>> = {
  order: ORDER_STATUS_META,
  payment: PAYMENT_STATUS_META,
  refund: REFUND_STATUS_META,
  inventory: INVENTORY_STATUS_META,
  boolean: BOOLEAN_STATUS_META,
}

/** Lookup order when the caller does not know the domain (legacy getStatusLabel/getStatusColor). */
const GENERIC_LOOKUP_ORDER: StatusDomain[] = ['order', 'payment', 'inventory', 'boolean']

function normalizeStatus(status: unknown): string {
  return String(status ?? '').toUpperCase().trim()
}

/**
 * Returns the canonical meta for a status. With a domain, only that map is used
 * (payment PENDING is not order PENDING); without one: order → payment → inventory → boolean.
 */
export function getStatusMeta(status: unknown, domain?: StatusDomain): StatusMeta | null {
  const key = normalizeStatus(status)
  if (!key) return null
  const domains = domain ? [domain] : GENERIC_LOOKUP_ORDER
  for (const d of domains) {
    const meta = STATUS_DOMAIN_MAPS[d][key]
    if (meta) return meta
  }
  return null
}

export function getStatusToneClasses(status: unknown, domain?: StatusDomain): StatusToneClasses {
  const meta = getStatusMeta(status, domain)
  return meta ? STATUS_TONE_CLASSES[meta.tone] : UNKNOWN_STATUS_CLASSES
}

export function getOrderStatusLabel(status: string | null | undefined): string {
  return getStatusMeta(status, 'order')?.label ?? (status || '')
}

export function getPaymentStatusLabel(status: string | null | undefined): string {
  if (!status) return PAYMENT_STATUS_META.UNPAID.label
  return getStatusMeta(status, 'payment')?.label ?? status
}

export function getRefundStatusLabel(status: string | null | undefined): string {
  return getStatusMeta(status, 'refund')?.label ?? (status || '')
}

export function getPaymentMethodLabel(method: string | null | undefined): string {
  if (!method) return 'Chưa xác định'
  return PAYMENT_METHOD_LABELS[normalizeStatus(method)] ?? method
}

/** Legacy: badge classes for a status of unknown domain. Prefer getStatusToneClasses(status, domain). */
export function getStatusColor(status: string): string {
  return getStatusToneClasses(status).badge
}

/** Legacy: label for a status or payment method of unknown domain. Prefer the domain-specific helpers. */
export function getStatusLabel(status: string): string {
  const meta = getStatusMeta(status)
  if (meta) return meta.label
  return PAYMENT_METHOD_LABELS[normalizeStatus(status)] ?? status
}

/** Decode user-profile values written by releases before HttpOnly cookies. */
const OBFUSCATION_KEY = 'TruongThanhStore2026'

export function decodeLegacyStorage(value: string | null): string | null {
  if (!value) return null
  try {
    // Skip if value is raw JSON or non-base64 format
    if (value.startsWith('{') || value.startsWith('[') || value.includes('"') || !/^[A-Za-z0-9+/=]+$/.test(value)) {
      return value
    }
    // Try XOR decrypt first
    const decoded = decodeURIComponent(escape(atob(value)))
    const xored = decoded
      .split('')
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length)))
      .join('')
    if (xored.startsWith('{') || xored.startsWith('[')) {
      return xored
    }
    // Fallback: try legacy base64-reverse decode
    return atob(value).split('').reverse().join('')
  } catch {
    try {
      return atob(value).split('').reverse().join('')
    } catch {
      return value
    }
  }
}

/**
 * Parses basic markdown syntax (bold **text** and bullet points - item) to safe HTML strings.
 */
export function parseMarkdown(text: string): string {
  if (!text) return ''
  // Basic XSS escape
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  // Bold: **text** -> <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  // Bullet points: lines starting with "- " or "* " -> list items
  const lines = html.split('\n')
  let inList = false
  const processedLines = lines.map(line => {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2)
      let prefix = ''
      if (!inList) {
        inList = true
        prefix = '<ul class="list-disc pl-5 my-2 space-y-1">'
      }
      return `${prefix}<li>${content}</li>`
    } else {
      let suffix = ''
      if (inList) {
        inList = false
        suffix = '</ul>'
      }
      return `${suffix}${line}`
    }
  })
  if (inList) {
    processedLines.push('</ul>')
  }

  return processedLines.join('<br />')
}

/**
 * IMP-003: Appends Cloudinary dynamic transformation parameters (f_auto, q_auto)
 * for automatic WebP/AVIF delivery and responsive sizing.
 */
export function optimizeCloudinaryUrl(
  url: string,
  options: { width?: number; quality?: string } = {},
): string {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
    return url
  }
  const parts = ['f_auto', options.quality ? `q_${options.quality}` : 'q_auto']
  if (options.width) {
    parts.push(`w_${options.width}`, 'c_limit')
  }
  const transform = parts.join(',')
  if (url.includes('/image/upload/') && !url.includes('/image/upload/f_auto')) {
    return url.replace('/image/upload/', `/image/upload/${transform}/`)
  }
  return url
}

// ─── Product image placeholder ───────────────────────────────────────────────

export type ProductPlaceholderIcon =
  | 'pencil'
  | 'document'
  | 'calculator'
  | 'folder'
  | 'briefcase'
  | 'academic'
  | 'tag'

export interface ProductPlaceholder {
  /** Tailwind gradient classes for the placeholder background. */
  gradient: string
  /** Icon key; templates draw the generic tag icon for 'tag' (their v-else branch). */
  icon: ProductPlaceholderIcon
}

// Order matters: the first rule whose keyword appears in the lower-cased name wins.
// Class strings are written out in full so Tailwind can detect them.
const PRODUCT_PLACEHOLDER_RULES: ReadonlyArray<{ keywords: readonly string[]; placeholder: ProductPlaceholder }> = [
  { keywords: ['bút', 'viết', 'chì'], placeholder: { gradient: 'bg-gradient-to-br from-red-400 to-rose-500', icon: 'pencil' } },
  {
    keywords: ['giấy', 'sổ', 'vở', 'tập', 'note'],
    placeholder: { gradient: 'bg-gradient-to-br from-emerald-400 to-teal-500', icon: 'document' },
  },
  { keywords: ['máy tính', 'casio'], placeholder: { gradient: 'bg-gradient-to-br from-indigo-400 to-purple-500', icon: 'calculator' } },
  {
    keywords: ['hồ sơ', 'bìa', 'kẹp', 'keo', 'thước'],
    placeholder: { gradient: 'bg-gradient-to-br from-blue-400 to-sky-500', icon: 'folder' },
  },
  { keywords: ['combo', 'văn phòng'], placeholder: { gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600', icon: 'briefcase' } },
  {
    keywords: ['học sinh', 'tiểu học', 'bộ dụng cụ'],
    placeholder: { gradient: 'bg-gradient-to-br from-amber-400 to-orange-500', icon: 'academic' },
  },
]

const DEFAULT_PRODUCT_PLACEHOLDER: ProductPlaceholder = {
  gradient: 'bg-gradient-to-br from-pink-400 to-rose-500',
  icon: 'tag',
}

/**
 * Gradient + icon shown when a product has no usable image, picked from keywords in its name.
 * Always returns a fresh object so callers may not mutate the shared table.
 */
export function getProductPlaceholder(name?: string | null): ProductPlaceholder {
  const lower = (name || '').toLowerCase()
  const rule = PRODUCT_PLACEHOLDER_RULES.find((r) => r.keywords.some((k) => lower.includes(k)))
  return { ...(rule ? rule.placeholder : DEFAULT_PRODUCT_PLACEHOLDER) }
}
