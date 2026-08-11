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

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    SHIPPING: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    PAID: 'bg-green-100 text-green-800',
    UNPAID: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    IN_STOCK: 'bg-green-100 text-green-800',
    LOW_STOCK: 'bg-yellow-100 text-yellow-800',
    OUT_OF_STOCK: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Chờ xử lý',
    CONFIRMED: 'Đã xác nhận',
    SHIPPING: 'Đang giao',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    PAID: 'Đã thanh toán',
    UNPAID: 'Chưa thanh toán',
    REFUNDED: 'Đã hoàn tiền',
    COD: 'Thanh toán khi nhận hàng',
    BANK_TRANSFER: 'Chuyển khoản',
    EWALLET: 'Ví điện tử',
    IN_STOCK: 'Còn hàng',
    LOW_STOCK: 'Sắp hết',
    OUT_OF_STOCK: 'Hết hàng',
    ACTIVE: 'Hoạt động',
    INACTIVE: 'Ngừng hoạt động',
  }
  return labels[status] || status
}

/**
 * Client-side token storage helper.
 * NOTE: Storing JWT tokens in localStorage is susceptible to XSS.
 * For maximum production security, set up HttpOnly, Secure, SameSite cookies on backend.
 */
const OBFUSCATION_KEY = 'TruongThanhStore2026'

export function encryptToken(value: string): string {
  if (!value) return ''
  try {
    const xored = value
      .split('')
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length)))
      .join('')
    return btoa(unescape(encodeURIComponent(xored)))
  } catch {
    return btoa(value.split('').reverse().join(''))
  }
}

export function decryptToken(value: string | null): string | null {
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
    // Validate: if result looks like a JWT token or JSON object, return it
    if (xored.includes('.') || xored.startsWith('{') || xored.startsWith('ey')) {
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


