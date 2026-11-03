import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reactive } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import Checkout from '../Checkout.vue'
import { orderService } from '@/services/order.service'
import { paymentService } from '@/services/payment.service'
import { addressService } from '@/services/address.service'
import { promotionService } from '@/services/promotion.service'

const cartState = reactive<any>({})
const authState = reactive<any>({})

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}))

vi.mock('@/composables/useSeoMeta', () => ({
  useSeoMeta: vi.fn(),
}))

vi.mock('@/stores/cart', () => ({
  useCartStore: () => cartState,
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authState,
}))

vi.mock('@/services/order.service', () => ({
  orderService: {
    checkoutPreview: vi.fn(),
    create: vi.fn(),
    createAuthenticated: vi.fn(),
  },
}))

vi.mock('@/services/payment.service', () => ({
  paymentService: {
    getEnabledMethods: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock('@/services/address.service', () => ({
  addressService: {
    getAll: vi.fn(),
  },
}))

vi.mock('@/services/promotion.service', () => ({
  promotionService: {
    getActive: vi.fn(),
  },
}))

const addresses = [
  {
    _id: 'addr_home',
    label: 'Nhà',
    recipientName: 'Nguyễn Văn A',
    phone: '0901234567',
    detail: '12 Nguyễn Trãi',
    ward: 'Phường 2',
    district: 'Quận 5',
    province: 'TP.HCM',
    isDefault: true,
  },
  {
    _id: 'addr_office',
    label: 'Công ty',
    recipientName: 'Nguyễn Văn A',
    phone: '0901234567',
    detail: '99 Lê Lợi',
    ward: 'Bến Nghé',
    district: 'Quận 1',
    province: 'TP.HCM',
    isDefault: false,
  },
]

function lastPreviewPayload(): any {
  const calls = vi.mocked(orderService.checkoutPreview).mock.calls
  return calls[calls.length - 1]?.[0]
}

function mountCheckout() {
  return mount(Checkout, {
    global: {
      stubs: ['router-link', 'SkeletonLoader'],
    },
  })
}

describe('Checkout.vue checkout-preview watcher (TDZ regression)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()

    Object.assign(cartState, {
      items: [
        {
          product: { _id: 'prod_1', name: 'Sách A', price: 120000, images: [] },
          quantity: 1,
          selected: true,
        },
      ],
      subtotal: 120000,
      shippingFee: 30000,
      discountAmount: 0,
      total: 150000,
      appliedPromotion: null,
      promoError: '',
      applyCoupon: vi.fn(),
      removeCoupon: vi.fn(),
      removeFromCart: vi.fn(),
      refreshPricing: vi.fn((ctx: any) => orderService.checkoutPreview(ctx)),
      getPreviewItem: vi.fn(),
      unavailableItems: [],
      warnings: [],
      pricingLoading: false,
      pricingError: '',
      pricingStale: false,
      updateQuantity: vi.fn(),
      clearCheckedOutItems: vi.fn(),
    })
    Object.assign(authState, {
      isAuthenticated: true,
      user: {
        fullName: 'Nguyễn Văn A',
        phone: '0901234567',
        email: 'a@example.com',
        loyaltyPoints: 0,
      },
    })

    vi.mocked(orderService.checkoutPreview).mockResolvedValue({
      data: { items: [{ product: 'prod_1', stock: 10 }], subtotal: 120000, shippingFee: 30000, total: 150000, warnings: [] },
    } as any)
    vi.mocked(paymentService.getEnabledMethods).mockResolvedValue({
      data: { methods: ['COD', 'BANK_TRANSFER'] },
    } as any)
    vi.mocked(addressService.getAll).mockResolvedValue(addresses as any)
    vi.mocked(promotionService.getActive).mockResolvedValue({ data: [] } as any)
  })

  it('mounts without a setup-time ReferenceError and requests checkout-preview immediately', async () => {
    let wrapper: ReturnType<typeof mountCheckout> | undefined
    expect(() => {
      wrapper = mountCheckout()
    }).not.toThrow()

    // The immediate watcher fires during setup, before onMounted resolves anything
    expect(orderService.checkoutPreview).toHaveBeenCalled()
    expect(lastPreviewPayload()).toMatchObject({ paymentMethod: 'COD' })

    await flushPromises()
    expect(wrapper!.text()).toContain('Thanh toán đơn hàng')
  })

  it('re-requests checkout-preview when the payment method changes', async () => {
    const wrapper = mountCheckout()
    await flushPromises()

    const callsBefore = vi.mocked(orderService.checkoutPreview).mock.calls.length
    await wrapper.find('input[type="radio"][value="BANK_TRANSFER"]').setValue(true)
    await flushPromises()

    // Exactly one extra request: a duplicated watcher would fire the preview twice
    expect(vi.mocked(orderService.checkoutPreview).mock.calls.length).toBe(callsBefore + 1)
    expect(lastPreviewPayload()).toMatchObject({ paymentMethod: 'BANK_TRANSFER' })
  })

  it('re-requests checkout-preview when the shipping address changes', async () => {
    const wrapper = mountCheckout()
    await flushPromises()

    // Default address from the address book is applied on mount
    expect(lastPreviewPayload()).toMatchObject({
      shippingAddress: '12 Nguyễn Trãi, Phường 2, Quận 5, TP.HCM',
    })

    const callsBefore = vi.mocked(orderService.checkoutPreview).mock.calls.length
    await wrapper.find('select').setValue('addr_office')
    await flushPromises()

    // Exactly one extra request: a duplicated watcher would fire the preview twice
    expect(vi.mocked(orderService.checkoutPreview).mock.calls.length).toBe(callsBefore + 1)
    expect(lastPreviewPayload()).toMatchObject({
      shippingAddress: '99 Lê Lợi, Bến Nghé, Quận 1, TP.HCM',
    })
  })
})
