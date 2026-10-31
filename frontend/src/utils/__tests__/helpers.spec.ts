import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatNumber,
  getDiscountPercent,
  getEffectivePrice,
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
      expect(getStatusLabel('DELIVERED')).toBe('Đã giao hàng')
      expect(getStatusLabel('CANCELLED')).toBe('Đã hủy')
      expect(formatCurrency(50000)).toContain('50.000')
    })
  })
})

