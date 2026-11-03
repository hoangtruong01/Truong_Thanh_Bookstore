import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import OrderDetail from '../OrderDetail.vue'
import { orderService } from '@/services/order.service'

const routeState = vi.hoisted(() => ({
  params: { id: 'guest_order_01' } as Record<string, string>,
  name: 'GuestOrderDetail',
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

function buildPendingOrder(id: string) {
  return {
    _id: id,
    orderCode: 'TT261103CXL',
    orderStatus: 'PENDING',
    paymentStatus: 'UNPAID',
    paymentMethod: 'COD',
    items: [],
    subtotal: 100000,
    shippingFee: 0,
    discount: 0,
    total: 100000,
    shippingAddress: '123 Nguyễn Trãi',
    phone: '0901234567',
    createdAt: '2026-11-01T00:00:00.000Z',
  }
}

async function clickCancel() {
  const wrapper = mount(OrderDetail, {
    global: { stubs: ['router-link', 'SkeletonLoader'] },
  })
  await flushPromises()
  const cancelBtn = wrapper.findAll('button').find((b) => b.text().includes('Hủy đơn'))
  expect(cancelBtn).toBeDefined()
  await cancelBtn!.trigger('click')
  await flushPromises()
  return wrapper
}

describe('OrderDetail.vue cancel order (guest vs authenticated)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('cancels a guest order via cancelGuest with the stored access token', async () => {
    routeState.name = 'GuestOrderDetail'
    routeState.params = { id: 'guest_order_01' }
    localStorage.setItem('guest-order-token:guest_order_01', 'guest-token-abc')
    vi.mocked(orderService.getGuestById).mockResolvedValue({ data: buildPendingOrder('guest_order_01') } as any)
    vi.mocked(orderService.cancelGuest).mockResolvedValue({ data: {} } as any)

    const wrapper = await clickCancel()

    expect(orderService.getGuestById).toHaveBeenCalledWith('guest_order_01', 'guest-token-abc')
    expect(orderService.cancelGuest).toHaveBeenCalledWith('guest_order_01', 'guest-token-abc')
    expect(orderService.cancel).not.toHaveBeenCalled()
    expect(wrapper.text()).not.toContain('Hủy đơn')
  })

  it('cancels an authenticated order via cancel', async () => {
    routeState.name = 'OrderDetail'
    routeState.params = { id: 'user_order_01' }
    vi.mocked(orderService.getById).mockResolvedValue({ data: buildPendingOrder('user_order_01') } as any)
    vi.mocked(orderService.cancel).mockResolvedValue({ data: {} } as any)

    await clickCancel()

    expect(orderService.cancel).toHaveBeenCalledWith('user_order_01')
    expect(orderService.cancelGuest).not.toHaveBeenCalled()
  })
})
