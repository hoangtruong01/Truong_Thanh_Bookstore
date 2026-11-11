import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatNumber,
  getDiscountPercent,
  getEffectivePrice,
  getProductPlaceholder,
  getStatusLabel,
  optimizeCloudinaryUrl,
} from '../helpers'

describe('helpers.ts', () => {
  describe('optimizeCloudinaryUrl (IMP-003)', () => {
    it('should inject f_auto,q_auto into a standard Cloudinary URL', () => {
      const original = 'https://res.cloudinary.com/truongthanh/image/upload/sample.jpg'
      const optimized = optimizeCloudinaryUrl(original)
      expect(optimized).toBe('https://res.cloudinary.com/truongthanh/image/upload/f_auto,q_auto/sample.jpg')
    })

    it('should include custom width and quality options', () => {
      const original = 'https://res.cloudinary.com/truongthanh/image/upload/v12345/sample.jpg'
      const optimized = optimizeCloudinaryUrl(original, { width: 800, quality: '80' })
      expect(optimized).toBe('https://res.cloudinary.com/truongthanh/image/upload/f_auto,q_80,w_800,c_limit/v12345/sample.jpg')
    })

    it('should leave non-cloudinary URLs untouched', () => {
      const original = 'https://example.com/images/book.png'
      expect(optimizeCloudinaryUrl(original)).toBe(original)
    })

    it('should not double-transform already transformed Cloudinary URLs', () => {
      const transformed = 'https://res.cloudinary.com/truongthanh/image/upload/f_auto,q_auto/sample.jpg'
      expect(optimizeCloudinaryUrl(transformed)).toBe(transformed)
    })

    it('should handle null/empty strings gracefully', () => {
      expect(optimizeCloudinaryUrl('')).toBe('')
      expect(optimizeCloudinaryUrl(null as any)).toBe(null)
    })
  })

  describe('pricing and formatting', () => {
    it('should calculate effective price correctly', () => {
      expect(getEffectivePrice(100000, 80000)).toBe(80000)
      expect(getEffectivePrice(100000, null)).toBe(100000)
      expect(getEffectivePrice(100000, 0)).toBe(100000)
    })

    it('should calculate discount percent accurately', () => {
      expect(getDiscountPercent(100000, 80000)).toBe(20)
      expect(getDiscountPercent(100000, 100000)).toBe(0)
      expect(getDiscountPercent(100000, 0)).toBe(0)
    })

    it('should format numbers and labels properly', () => {
      expect(formatNumber(125000)).toBe('125.000')
      // Canonical label shared with StatusBadge (see statusMeta.spec.ts)
      expect(getStatusLabel('DELIVERED')).toBe('Đã giao thành công')
      expect(getStatusLabel('CANCELLED')).toBe('Đã hủy')
      expect(formatCurrency(50000)).toContain('50.000')
    })
  })

  describe('getProductPlaceholder', () => {
    it.each([
      ['Bút bi Thiên Long', 'pencil', 'bg-gradient-to-br from-red-400 to-rose-500'],
      ['Vở kẻ ngang 200 trang', 'document', 'bg-gradient-to-br from-emerald-400 to-teal-500'],
      ['Máy tính Casio FX-580', 'calculator', 'bg-gradient-to-br from-indigo-400 to-purple-500'],
      ['Bìa hồ sơ A4', 'folder', 'bg-gradient-to-br from-blue-400 to-sky-500'],
      ['Combo văn phòng', 'briefcase', 'bg-gradient-to-br from-blue-500 to-indigo-600'],
      ['Bộ dụng cụ học sinh tiểu học', 'academic', 'bg-gradient-to-br from-amber-400 to-orange-500'],
      ['Balo du lịch', 'tag', 'bg-gradient-to-br from-pink-400 to-rose-500'],
    ])('maps "%s" to the %s placeholder', (name, icon, gradient) => {
      expect(getProductPlaceholder(name)).toEqual({ icon, gradient })
    })

    it('matches case-insensitively and keeps the first matching rule', () => {
      // "BÚT" (pencil) wins over "SỔ" (document) because the pencil rule comes first.
      expect(getProductPlaceholder('BÚT VÀ SỔ').icon).toBe('pencil')
    })

    it('falls back to the tag placeholder for empty input', () => {
      expect(getProductPlaceholder('').icon).toBe('tag')
      expect(getProductPlaceholder(undefined).icon).toBe('tag')
      expect(getProductPlaceholder(null).icon).toBe('tag')
    })

    it('returns a fresh object on every call', () => {
      const first = getProductPlaceholder('Bút')
      first.gradient = 'mutated'
      expect(getProductPlaceholder('Bút').gradient).toBe('bg-gradient-to-br from-red-400 to-rose-500')
    })
  })
})

