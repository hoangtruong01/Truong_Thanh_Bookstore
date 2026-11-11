import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import OrderSuccess from '../OrderSuccess.vue'
import { formatCurrency } from '@/utils/helpers'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }))
vi.mock('vue-toastification', () => ({ useToast: () => toast }))

const RouterLinkStub = { props: ['to'], template: '<a :href="to"><slot /></a>' }

const bank = { bankName: 'MB', accountNumber: '0123456789', accountHolder: 'TRUONG THANH' }

function mountSuccess(props: Record<string, unknown> = {}) {
  return mount(OrderSuccess, {
    props: {
      orderCode: 'TTB-001',
      orderId: 'order_1',
      recipient: { fullName: 'Nguyễn Văn A', phone: '0901234567', address: '12 Nguyễn Trãi' },
      paymentMethod: 'COD',
      total: 150000,
      bankTransferConfig: null,
      isAuthenticated: true,
      ...props,
    },
    global: { stubs: { 'router-link': RouterLinkStub } },
  })
}

describe('OrderSuccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })

  it('shows the order summary with the server total and the shared payment-method label', () => {
    const wrapper = mountSuccess()
    expect(wrapper.text()).toContain('#TTB-001')
    expect(wrapper.text()).toContain('Nguyễn Văn A (0901234567)')
    expect(wrapper.text()).toContain('12 Nguyễn Trãi')
    expect(wrapper.text()).toContain('Thanh toán khi nhận hàng (COD)')
    expect(wrapper.text()).toContain(formatCurrency(150000))
    // COD notice
    expect(wrapper.text()).toContain('Đơn hàng sẽ được đóng gói')
  })

  it('links members to /my-orders and guests to /guest-orders', () => {
    expect(mountSuccess().find('a[href="/my-orders/order_1"]').exists()).toBe(true)
    expect(mountSuccess({ isAuthenticated: false }).find('a[href="/guest-orders/order_1"]').exists()).toBe(true)
    expect(mountSuccess({ orderId: '' }).findAll('a')).toHaveLength(1)
  })

  it('renders the VietQR transfer instructions for BANK_TRANSFER', () => {
    const wrapper = mountSuccess({ paymentMethod: 'BANK_TRANSFER', bankTransferConfig: bank })
    expect(wrapper.text()).toContain('Chuyển khoản ngân hàng')
    expect(wrapper.find('img').attributes('src')).toBe(
      'https://img.vietqr.io/image/MB-0123456789-compact2.png?amount=150000&addInfo=TTB-001&accountName=TRUONG%20THANH',
    )
    expect(wrapper.text()).toContain('0123456789')
    expect(wrapper.text()).not.toContain('Đơn hàng sẽ được đóng gói')
  })

  it('falls back to the hotline when no bank account is configured', () => {
    const wrapper = mountSuccess({ paymentMethod: 'BANK_TRANSFER', bankTransferConfig: null })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('0982938316')
  })

  it('copies the order code and confirms with a toast', async () => {
    const wrapper = mountSuccess()
    await wrapper.findAll('button').find((b) => b.text() === 'Sao chép')!.trigger('click')
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TTB-001')
    expect(toast.success).toHaveBeenCalledWith('Đã sao chép Mã đơn hàng!')
  })
})
