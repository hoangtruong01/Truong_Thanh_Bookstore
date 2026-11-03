import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from '../StatusBadge.vue'
import { STATUS_TONE_CLASSES } from '@/utils/helpers'

describe('StatusBadge.vue', () => {
  it('uses the payment map when type="payment" (PENDING is not order PENDING)', () => {
    const payment = mount(StatusBadge, { props: { status: 'PENDING', type: 'payment' } })
    expect(payment.text()).toBe('Đang chờ thanh toán')
    expect(payment.classes()).toContain('bg-sky-50')

    const order = mount(StatusBadge, { props: { status: 'PENDING', type: 'order' } })
    expect(order.text()).toBe('Chờ xác nhận')
    expect(order.classes()).toContain('bg-amber-50')
  })

  it('labels payment CANCELLED and PARTIALLY_PAID', () => {
    expect(mount(StatusBadge, { props: { status: 'CANCELLED', type: 'payment' } }).text()).toBe('Đã hủy thanh toán')
    expect(mount(StatusBadge, { props: { status: 'PARTIALLY_PAID', type: 'payment' } }).text()).toBe('Thanh toán một phần')
  })

  it('keeps the default (custom) lookup for existing admin usages', () => {
    const active = mount(StatusBadge, { props: { status: 'ACTIVE', label: 'Đang chạy' } })
    expect(active.text()).toBe('Đang chạy')
    expect(active.classes()).toContain('bg-emerald-50')

    const locked = mount(StatusBadge, { props: { status: false, type: 'boolean' } })
    expect(locked.text()).toBe('Đã khóa')

    const stock = mount(StatusBadge, { props: { status: 'LOW_STOCK', type: 'inventory' } })
    expect(stock.text()).toBe('Sắp hết hàng')
  })

  it('renders the dot with the tone colour and hides it when showDot=false', () => {
    const withDot = mount(StatusBadge, { props: { status: 'SHIPPING', type: 'order' } })
    expect(withDot.find('span > span').classes()).toContain(STATUS_TONE_CLASSES.purple.dot)

    const noDot = mount(StatusBadge, { props: { status: 'SHIPPING', type: 'order', showDot: false } })
    expect(noDot.find('span > span').exists()).toBe(false)
  })

  it('shows the raw value (or provided label) for unknown statuses', () => {
    expect(mount(StatusBadge, { props: { status: 'weird_state' } }).text()).toBe('WEIRD_STATE')
    expect(mount(StatusBadge, { props: { status: 'weird_state', label: 'Khác' } }).text()).toBe('Khác')
  })
})
