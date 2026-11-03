import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import OrderDetail from '../OrderDetail.vue'
import { orderService } from '@/services/order.service'

const routeState = vi.hoisted(() => ({
  params: { id: 'order_01' } as Record<string, string>,
  name: 'OrderDetail',
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
}))

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('@/services/order.service', () => ({
  orderService: {
    getById: vi.fn(),
    getGuestById: vi.fn(),
    cancel: vi.fn(),
    cancelGuest: vi.fn(),
    requestReturn: vi.fn(),
  },
}))

vi.mock('@/services/payment.service', () => ({
  paymentService: {
    getEnabledMethods: vi.fn(),
    create: vi.fn(),
  },
}))

function buildOrder(id: string, orderStatus: string, paymentStatus = 'PAID') {
  return {
    _id: id,
    orderCode: 'TT261103RET',
    orderStatus,
    paymentStatus,
    paymentMethod: 'COD',
    items: [],
    subtotal: 100000,
    shippingFee: 0,
    discount: 0,
    total: 100000,
    shippingAddress: '123 Nguyễn Trãi',
    phone: '0901234567',
    createdAt: '2026-11-01T00:00:00.000Z',
    deliveredAt: new Date().toISOString(),
  }
}

async function mountDetail() {
  const wrapper = mount(OrderDetail, {
    global: { stubs: ['router-link', 'SkeletonLoader'] },
  })
  await flushPromises()
  return wrapper
}

describe('OrderDetail.vue return request visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('hides the return button for a delivered guest order and shows a login/support hint', async () => {
    routeState.name = 'GuestOrderDetail'
    routeState.params = { id: 'guest_order_01' }
    localStorage.setItem('guest-order-token:guest_order_01', 'guest-token-abc')
    vi.mocked(orderService.getGuestById).mockResolvedValue({ data: buildOrder('guest_order_01', 'DELIVERED') } as any)

    const wrapper = await mountDetail()

    expect(wrapper.find('[data-testid="request-return-btn"]').exists()).toBe(false)
    const hint = wrapper.find('[data-testid="guest-return-hint"]')
    expect(hint.exists()).toBe(true)
    expect(hint.text()).toContain('0982938316')
    expect(orderService.requestReturn).not.toHaveBeenCalled()
  })

  it('shows the return button for a delivered order of a signed-in customer', async () => {
    routeState.name = 'OrderDetail'
    routeState.params = { id: 'user_order_01' }
    vi.mocked(orderService.getById).mockResolvedValue({ data: buildOrder('user_order_01', 'DELIVERED') } as any)

    const wrapper = await mountDetail()

    const btn = wrapper.find('[data-testid="request-return-btn"]')
    expect(btn.exists()).toBe(true)
    expect(wrapper.find('[data-testid="guest-return-hint"]').exists()).toBe(false)
    await btn.trigger('click')
    expect(wrapper.text()).toContain('Gửi yêu cầu trả hàng')
  })

  it('shows neither button nor hint for a guest order that is not delivered', async () => {
    routeState.name = 'GuestOrderDetail'
    routeState.params = { id: 'guest_order_02' }
    localStorage.setItem('guest-order-token:guest_order_02', 'guest-token-xyz')
    vi.mocked(orderService.getGuestById).mockResolvedValue({ data: buildOrder('guest_order_02', 'SHIPPING') } as any)

    const wrapper = await mountDetail()

    expect(wrapper.find('[data-testid="request-return-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="guest-return-hint"]').exists()).toBe(false)
  })

  it('renders order and payment badges from the canonical table', async () => {
    routeState.name = 'OrderDetail'
    routeState.params = { id: 'user_order_02' }
    vi.mocked(orderService.getById).mockResolvedValue({ data: buildOrder('user_order_02', 'PROCESSING', 'PENDING') } as any)

    const wrapper = await mountDetail()

    expect(wrapper.text()).toContain('Đang chuẩn bị hàng')
    // Payment PENDING is "waiting for payment", not "unpaid"
    expect(wrapper.text()).toContain('Đang chờ thanh toán')
  })
})
