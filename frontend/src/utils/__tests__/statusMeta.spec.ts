import { describe, it, expect } from 'vitest'
import {
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  REFUND_STATUS_META,
  PAYMENT_METHOD_LABELS,
  STATUS_TONE_CLASSES,
  UNKNOWN_STATUS_CLASSES,
  formatDateTime,
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getRefundStatusLabel,
  getStatusColor,
  getStatusLabel,
  getStatusMeta,
  getStatusToneClasses,
} from '../helpers'

// Copied from backend/src/common/enums/index.ts (OrderStatus, PaymentStatus,
// RefundStatus, PaymentMethod). Vite refuses to load files outside the frontend
// root, so update these lists whenever a backend enum value is added.
const BACKEND_ORDER_STATUS = [
  'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED',
  'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURNED', 'COMPLETED', 'CANCELLED',
]
const BACKEND_PAYMENT_STATUS = ['UNPAID', 'PENDING', 'PAID', 'PARTIALLY_PAID', 'FAILED', 'REFUNDED', 'CANCELLED']
const BACKEND_REFUND_STATUS = ['NONE', 'REQUESTED', 'PROCESSING', 'REFUNDED', 'FAILED', 'MANUAL_REQUIRED']
const BACKEND_PAYMENT_METHOD = ['COD', 'BANK_TRANSFER', 'EWALLET', 'VNPAY', 'MOMO', 'CASH', 'CREDIT']

describe('canonical status table', () => {
  it('has no stale keys beyond the backend enums', () => {
    expect(Object.keys(ORDER_STATUS_META).sort()).toEqual([...BACKEND_ORDER_STATUS].sort())
    expect(Object.keys(PAYMENT_STATUS_META).sort()).toEqual([...BACKEND_PAYMENT_STATUS].sort())
    expect(Object.keys(REFUND_STATUS_META).sort()).toEqual([...BACKEND_REFUND_STATUS].sort())
    expect(Object.keys(PAYMENT_METHOD_LABELS).sort()).toEqual([...BACKEND_PAYMENT_METHOD].sort())
  })

  it.each(BACKEND_ORDER_STATUS)('order status %s has a label and a known tone', (status) => {
    const meta = ORDER_STATUS_META[status]
    expect(meta?.label).toBeTruthy()
    expect(STATUS_TONE_CLASSES[meta!.tone]).toBeDefined()
  })

  it.each(BACKEND_PAYMENT_STATUS)('payment status %s has a label and a known tone', (status) => {
    const meta = PAYMENT_STATUS_META[status]
    expect(meta?.label).toBeTruthy()
    expect(STATUS_TONE_CLASSES[meta!.tone]).toBeDefined()
  })

  it.each(BACKEND_REFUND_STATUS.filter((s) => s !== 'NONE'))('refund status %s has a label', (status) => {
    expect(REFUND_STATUS_META[status]?.label).toBeTruthy()
  })

  it.each(BACKEND_PAYMENT_METHOD)('payment method %s has a label', (method) => {
    expect(PAYMENT_METHOD_LABELS[method]).toBeTruthy()
  })

  it('keeps order and payment PENDING / CANCELLED apart', () => {
    expect(getOrderStatusLabel('PENDING')).toBe('Chờ xác nhận')
    expect(getPaymentStatusLabel('PENDING')).toBe('Đang chờ thanh toán')
    expect(getOrderStatusLabel('CANCELLED')).toBe('Đã hủy')
    expect(getPaymentStatusLabel('CANCELLED')).toBe('Đã hủy thanh toán')
    expect(getStatusMeta('PENDING', 'order')?.tone).toBe('amber')
    expect(getStatusMeta('PENDING', 'payment')?.tone).toBe('sky')
    expect(getRefundStatusLabel('PROCESSING')).toBe('Đang hoàn tiền')
    expect(getOrderStatusLabel('PROCESSING')).toBe('Đang chuẩn bị hàng')
  })

  it('maps tones to the agreed Tailwind classes (light + dark)', () => {
    const amber = getStatusToneClasses('PENDING', 'order')
    expect(amber.badge).toContain('bg-amber-50')
    expect(amber.badge).toContain('text-amber-700')
    expect(amber.badge).toContain('border-amber-200/70')
    expect(amber.badge).toContain('dark:bg-amber-950/40')
    expect(amber.dot).toBe('bg-amber-500')
    expect(getStatusToneClasses('RETURNED', 'order').badge).toContain('bg-slate-100')
    expect(getStatusToneClasses('PAID', 'payment').hex).toBe('#10B981')
  })

  it('falls back safely for unknown or empty statuses', () => {
    expect(getStatusMeta('', 'order')).toBeNull()
    expect(getStatusMeta('WHATEVER')).toBeNull()
    expect(getStatusToneClasses('WHATEVER', 'order')).toBe(UNKNOWN_STATUS_CLASSES)
    expect(getOrderStatusLabel('WHATEVER')).toBe('WHATEVER')
    expect(getPaymentStatusLabel(undefined)).toBe('Chưa thanh toán')
    expect(getPaymentMethodLabel('')).toBe('Chưa xác định')
    expect(getPaymentMethodLabel('cod')).toBe('Thanh toán khi nhận hàng (COD)')
  })

  it('legacy getStatusLabel / getStatusColor delegate to the canonical table', () => {
    expect(getStatusLabel('DELIVERED')).toBe(ORDER_STATUS_META.DELIVERED.label)
    expect(getStatusLabel('PARTIALLY_PAID')).toBe('Thanh toán một phần')
    expect(getStatusLabel('BANK_TRANSFER')).toBe('Chuyển khoản ngân hàng')
    expect(getStatusLabel('IN_STOCK')).toBe('Còn hàng')
    expect(getStatusLabel('UNKNOWN_X')).toBe('UNKNOWN_X')
    expect(getStatusColor('SHIPPING')).toBe(STATUS_TONE_CLASSES.purple.badge)
    expect(getStatusColor('UNKNOWN_X')).toBe(UNKNOWN_STATUS_CLASSES.badge)
  })
})

describe('formatDateTime', () => {
  it('formats as dd/MM/yyyy HH:mm in Vietnam time', () => {
    // 2026-11-01T07:05:00Z = 14:05 in Asia/Ho_Chi_Minh (UTC+7)
    expect(formatDateTime('2026-11-01T07:05:00.000Z')).toBe('01/11/2026 14:05')
    expect(formatDateTime(new Date('2026-01-09T17:30:00.000Z'))).toBe('10/01/2026 00:30')
  })

  it('returns an empty string for empty or invalid input', () => {
    expect(formatDateTime(null)).toBe('')
    expect(formatDateTime(undefined)).toBe('')
    expect(formatDateTime('')).toBe('')
    expect(formatDateTime('not-a-date')).toBe('')
  })
})
