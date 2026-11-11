import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { reactive } from 'vue'
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'
import Checkout from '../Checkout.vue'
import { orderService } from '@/services/order.service'
import { paymentService } from '@/services/payment.service'
import { addressService } from '@/services/address.service'
import { promotionService } from '@/services/promotion.service'

// Page <-> extracted section wiring: every input that feeds checkout-preview still reaches the
// (single) preview watcher, and coupon handling goes through useCoupon -> cartStore.applyCoupon.

const cartState = reactive<any>({})
const authState = reactive<any>({})

vi.mock('vue-toastification', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}))
vi.mock('@/composables/useSeoMeta', () => ({ useSeoMeta: vi.fn() }))
vi.mock('@/stores/cart', () => ({ useCartStore: () => cartState }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => authState }))
vi.mock('@/services/order.service', () => ({
  orderService: { checkoutPreview: vi.fn(), create: vi.fn(), createAuthenticated: vi.fn() },
}))
vi.mock('@/services/payment.service', () => ({
  paymentService: { getEnabledMethods: vi.fn(), create: vi.fn() },
}))
vi.mock('@/services/address.service', () => ({ addressService: { getAll: vi.fn() } }))
vi.mock('@/services/promotion.service', () => ({ promotionService: { getActive: vi.fn() } }))

enableAutoUnmount(afterEach)

const loyalty = {
  availablePoints: 5000,
  minRedeemPoints: 1000,
  pointValue: 10,
  maxRedeemPercent: 50,
  maxRedeemablePoints: 3000,
  minSubtotalToRedeem: 100000,
  canRedeem: true,
  requestedPoints: 0,
  appliedPoints: 0,
  error: null,
}

function lastPreviewPayload(): any {
  const calls = vi.mocked(orderService.checkoutPreview).mock.calls
  return calls[calls.length - 1]?.[0]
}

function mountCheckout() {
  return mount(Checkout, { global: { stubs: ['router-link', 'SkeletonLoader'] } })
}

describe('Checkout.vue section wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    for (const key of Object.keys(cartState)) delete cartState[key]
    Object.assign(cartState, {
      items: [{ product: { _id: 'prod_1', name: 'Sách A', price: 120000, images: [] }, quantity: 1, selected: true }],
      pricing: { total: 150000 },
      subtotal: 120000,
      shippingFee: 30000,
      discountAmount: 0,
      loyaltyDiscount: 0,
      loyalty,
      total: 150000,
      appliedPromotion: null,
      promoError: '',
      applyCoupon: vi.fn().mockResolvedValue(true),
      removeCoupon: vi.fn(),
      removeFromCart: vi.fn(),
      refreshPricing: vi.fn((ctx: any) => orderService.checkoutPreview(ctx)),
      getPreviewItem: vi.fn(),
      unavailableItems: [],
      warnings: [],
      pricingLoading: false,
      pricingError: '',
      updateQuantity: vi.fn(),
      clearCheckedOutItems: vi.fn(),
    })
    Object.assign(authState, {
      isAuthenticated: true,
      user: { fullName: 'Nguyễn Văn A', phone: '0901234567', email: 'a@example.com' },
    })
    vi.mocked(orderService.checkoutPreview).mockResolvedValue({ data: {} } as any)
    vi.mocked(paymentService.getEnabledMethods).mockResolvedValue({ data: { methods: ['COD', 'BANK_TRANSFER'] } } as any)
    vi.mocked(addressService.getAll).mockResolvedValue([] as any)
    vi.mocked(promotionService.getActive).mockResolvedValue({
      data: [{ _id: 'p1', code: 'SALE10', discountType: 'PERCENT', discountValue: 10, minOrderValue: 0 }],
    } as any)
  })

  it('profile phone/email from onMounted reach the preview through the address section', async () => {
    const wrapper = mountCheckout()
    await flushPromises()
    expect(lastPreviewPayload()).toMatchObject({ phone: '0901234567', customerEmail: 'a@example.com' })
    expect((wrapper.find('input[type="tel"]').element as HTMLInputElement).value).toBe('0901234567')
  })

  it('typing the shipping address re-prices once with the new address', async () => {
    const wrapper = mountCheckout()
    await flushPromises()
    const before = vi.mocked(orderService.checkoutPreview).mock.calls.length

    await wrapper.find('input[maxlength="200"]').setValue('1 Hai Bà Trưng')
    await flushPromises()
    expect(vi.mocked(orderService.checkoutPreview).mock.calls.length).toBe(before + 1)
    expect(lastPreviewPayload()).toMatchObject({ shippingAddress: '1 Hai Bà Trưng' })
  })

  it('loyalty points typed in the loyalty section are sent to the preview', async () => {
    const wrapper = mountCheckout()
    await flushPromises()
    expect(wrapper.find('[data-testid="checkout-loyalty"]').exists()).toBe(true)

    await wrapper.find('[data-testid="checkout-loyalty"] input').setValue('1500')
    await flushPromises()
    expect(lastPreviewPayload()).toMatchObject({ loyaltyPointsUsed: 1500 })

    await wrapper.findAll('button').find((b) => b.text() === 'Tối đa')!.trigger('click')
    await flushPromises()
    expect(lastPreviewPayload()).toMatchObject({ loyaltyPointsUsed: 3000 })
  })

  it('applies a typed voucher (upper-cased) and a suggested one through the cart store', async () => {
    const wrapper = mountCheckout()
    await flushPromises()

    await wrapper.find('input[placeholder="Nhập mã giảm giá..."]').setValue(' sale10 ')
    await wrapper.findAll('button').find((b) => b.text() === 'Áp dụng')!.trigger('click')
    await flushPromises()
    expect(cartState.applyCoupon).toHaveBeenCalledWith('SALE10')
    expect((wrapper.find('input[placeholder="Nhập mã giảm giá..."]').element as HTMLInputElement).value).toBe('')

    await wrapper.findAll('button').find((b) => b.text().includes('Xem Voucher khả dụng'))!.trigger('click')
    await wrapper.findAll('button').find((b) => b.text() === 'Dùng')!.trigger('click')
    await flushPromises()
    expect(cartState.applyCoupon).toHaveBeenLastCalledWith('SALE10')
  })

  it('guests only see COD even when the backend enables more methods', async () => {
    authState.isAuthenticated = false
    authState.user = null
    const wrapper = mountCheckout()
    await flushPromises()
    expect(wrapper.findAll('input[type="radio"]').map((r) => (r.element as HTMLInputElement).value)).toEqual(['COD'])
    expect(wrapper.find('[data-testid="checkout-loyalty"]').exists()).toBe(false)
  })
})
