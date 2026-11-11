import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reactive } from 'vue'
import { mount } from '@vue/test-utils'
import AddressSection from '../AddressSection.vue'
import PaymentMethodSelector from '../PaymentMethodSelector.vue'
import VoucherSection from '../VoucherSection.vue'
import LoyaltySection from '../LoyaltySection.vue'
import PricingSummary from '../PricingSummary.vue'
import { formatCurrency } from '@/utils/helpers'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }))
const cartState = reactive<any>({})

vi.mock('vue-toastification', () => ({ useToast: () => toast }))
vi.mock('@/stores/cart', () => ({ useCartStore: () => cartState }))

function resetCart(overrides: Record<string, unknown> = {}) {
  for (const key of Object.keys(cartState)) delete cartState[key]
  Object.assign(cartState, {
    pricing: { total: 150000 },
    pricingLoading: false,
    pricingError: '',
    warnings: [],
    subtotal: 120000,
    shippingFee: 30000,
    standardShippingFee: 30000,
    discountAmount: 0,
    loyaltyDiscount: 0,
    loyalty: null,
    total: 150000,
    appliedPromotion: null,
    promoError: '',
    removeCoupon: vi.fn(),
    ...overrides,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  resetCart()
})

describe('AddressSection', () => {
  const addresses = [
    { _id: 'a1', label: 'Nhà', recipientName: 'A', phone: '0901234567', detail: '12 Lê Lợi', ward: 'P1', district: 'Q1', province: 'HCM', isDefault: true },
  ]

  function mountAddress(props: Record<string, unknown> = {}) {
    return mount(AddressSection, {
      props: { addresses, isAuthenticated: true, phoneValid: true, ...props },
    })
  }

  it('shows the address-book picker only for signed-in users with saved addresses', () => {
    expect(mountAddress().find('select').exists()).toBe(true)
    expect(mountAddress({ isAuthenticated: false }).find('select').exists()).toBe(false)
    expect(mountAddress({ addresses: [] }).find('select').exists()).toBe(false)
  })

  it('updates the picked id before telling the page to apply it', async () => {
    const log: unknown[] = []
    const wrapper = mountAddress({
      'onUpdate:selectedAddressId': (v: unknown) => log.push(['id', v]),
      'onAddress-change': () => log.push('change'),
    })
    await wrapper.find('select').setValue('a1')
    expect(log).toEqual([['id', 'a1'], 'change'])
  })

  it('keeps only digits in the phone field', async () => {
    const wrapper = mountAddress()
    const phone = wrapper.find('input[type="tel"]')
    ;(phone.element as HTMLInputElement).value = '09a0-12'
    await phone.trigger('input')
    expect((phone.element as HTMLInputElement).value).toBe('09012')
    expect(wrapper.emitted('update:phone')!.at(-1)).toEqual(['09012'])
  })

  it('shows the phone hint only when the page marks a typed phone invalid', () => {
    expect(mountAddress({ phone: '123', phoneValid: false }).text()).toContain('Số điện thoại phải gồm 10 chữ số')
    expect(mountAddress({ phone: '', phoneValid: false }).text()).not.toContain('Số điện thoại phải gồm 10 chữ số')
  })

  it('binds every text field through v-model', async () => {
    const wrapper = mountAddress()
    await wrapper.find('input[placeholder="Nguyễn Văn A"]').setValue('Trần B')
    await wrapper.find('input[type="email"]').setValue('b@example.com')
    await wrapper.find('textarea').setValue('Gọi trước')
    expect(wrapper.emitted('update:fullName')).toEqual([['Trần B']])
    expect(wrapper.emitted('update:email')).toEqual([['b@example.com']])
    expect(wrapper.emitted('update:note')).toEqual([['Gọi trước']])
  })
})

describe('PaymentMethodSelector', () => {
  const methods = [
    { value: 'COD' as const, label: 'Thanh toán khi nhận hàng (COD)', description: 'Tiền mặt', tag: 'Phổ biến' },
    { value: 'BANK_TRANSFER' as const, label: 'Chuyển khoản ngân hàng', description: 'QR' },
  ]

  it('renders the given methods, highlights the selected one and emits a change', async () => {
    const wrapper = mount(PaymentMethodSelector, { props: { methods, modelValue: 'COD' } })
    const labels = wrapper.findAll('label')
    expect(labels).toHaveLength(2)
    expect(labels[0].classes()).toContain('border-[#dc2626]')
    expect(labels[0].text()).toContain('Phổ biến')

    await wrapper.find('input[value="BANK_TRANSFER"]').setValue(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([['BANK_TRANSFER']])
  })
})

describe('VoucherSection', () => {
  const promotions = [
    { _id: 'p1', code: 'SALE10', discountType: 'PERCENT', discountValue: 10, minOrderValue: 100000, description: '10%' },
    { _id: 'p2', code: 'BIG50', discountType: 'FIXED', discountValue: 50000, minOrderValue: 500000, description: '50k' },
  ] as any[]

  function mountVoucher(props: Record<string, unknown> = {}) {
    return mount(VoucherSection, { props: { promotions, applying: false, code: '', expanded: false, ...props } })
  }

  it('shows the applied code with the server discount and removes it', async () => {
    resetCart({ appliedPromotion: { code: 'SALE10', discount: 12000 }, discountAmount: 12000 })
    const wrapper = mountVoucher()
    expect(wrapper.text()).toContain('Đã áp dụng: SALE10')
    expect(wrapper.text()).toContain(`Giảm ${formatCurrency(12000)}`)
    await wrapper.findAll('button').find((b) => b.text() === 'Gỡ')!.trigger('click')
    expect(cartState.removeCoupon).toHaveBeenCalled()
  })

  it('disables "Áp dụng" without a code or while applying, otherwise emits apply', async () => {
    const applyBtn = (w: ReturnType<typeof mountVoucher>) => w.findAll('button').find((b) => /Áp dụng|Đang áp dụng/.test(b.text()))!
    expect(applyBtn(mountVoucher()).attributes('disabled')).toBeDefined()
    expect(applyBtn(mountVoucher({ code: 'X', applying: true })).text()).toContain('Đang áp dụng...')

    const wrapper = mountVoucher({ code: 'SALE10' })
    await applyBtn(wrapper).trigger('click')
    expect(wrapper.emitted('apply')).toHaveLength(1)

    await wrapper.find('input[type="text"]').setValue('vip')
    expect(wrapper.emitted('update:code')).toEqual([['vip']])
  })

  it('shows the store promo error', () => {
    resetCart({ promoError: 'Mã không hợp lệ' })
    expect(mountVoucher().text()).toContain('Mã không hợp lệ')
  })

  it('toggles the suggestion list and only enables vouchers the subtotal qualifies for', async () => {
    const collapsed = mountVoucher()
    await collapsed.findAll('button').find((b) => b.text().includes('Xem Voucher khả dụng'))!.trigger('click')
    expect(collapsed.emitted('update:expanded')).toEqual([[true]])

    const wrapper = mountVoucher({ expanded: true })
    const useButtons = wrapper.findAll('button').filter((b) => b.text() === 'Dùng')
    expect(useButtons).toHaveLength(2)
    expect(useButtons[0].attributes('disabled')).toBeUndefined()
    expect(useButtons[1].attributes('disabled')).toBeDefined() // subtotal 120k < 500k
    expect(wrapper.text()).toContain(`Giảm ${formatCurrency(50000)}`)
    await useButtons[0].trigger('click')
    expect(wrapper.emitted('apply-suggested')).toEqual([['SALE10']])
  })
})

describe('LoyaltySection', () => {
  const base = {
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

  it('explains the minimum balance when the user has too few points', () => {
    const wrapper = mount(LoyaltySection, { props: { loyalty: { ...base, availablePoints: 500 }, error: '' } })
    expect(wrapper.text()).toContain('Bạn cần tối thiểu')
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('explains the minimum order when the server says points cannot be redeemed', () => {
    const wrapper = mount(LoyaltySection, { props: { loyalty: { ...base, canRedeem: false }, error: '' } })
    expect(wrapper.text()).toContain(`Đơn hàng từ ${formatCurrency(100000)}`)
  })

  it('"Tối đa" fills the server cap; the error comes from the page', async () => {
    const wrapper = mount(LoyaltySection, { props: { loyalty: base, error: 'Số điểm phải là số nguyên dương', points: null } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:points')).toEqual([[3000]])
    expect(wrapper.text()).toContain('Số điểm phải là số nguyên dương')

    await wrapper.find('input').setValue('1500')
    expect(wrapper.emitted('update:points')!.at(-1)).toEqual([1500])
  })

  it('"Tối đa" only informs the user when there is nothing to redeem', async () => {
    const wrapper = mount(LoyaltySection, { props: { loyalty: { ...base, maxRedeemablePoints: 0 }, error: '' } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:points')).toBeUndefined()
    expect(toast.info).toHaveBeenCalled()
  })
})

describe('PricingSummary', () => {
  const mountSummary = () => mount(PricingSummary, { global: { stubs: ['SkeletonLoader'] } })

  it('shows the skeleton while the first preview is loading', () => {
    resetCart({ pricing: null, pricingLoading: true })
    const wrapper = mountSummary()
    expect(wrapper.find('[data-testid="checkout-pricing-skeleton"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="checkout-total"]').exists()).toBe(false)
  })

  it('displays the server numbers as-is (no client-side re-adding)', () => {
    // total deliberately differs from subtotal + shipping: the server total must win
    resetCart({ subtotal: 100000, shippingFee: 30000, total: 99999 })
    const wrapper = mountSummary()
    expect(wrapper.find('[data-testid="checkout-subtotal"]').text()).toBe(formatCurrency(100000))
    expect(wrapper.find('[data-testid="checkout-shipping-fee"]').text()).toBe(formatCurrency(30000))
    expect(wrapper.find('[data-testid="checkout-total"]').text()).toBe(formatCurrency(99999))
    expect(wrapper.text()).toContain('Đã bao gồm VAT, không phí ẩn')
  })

  it('shows free shipping, voucher and loyalty lines from the preview', () => {
    resetCart({
      shippingFee: 0,
      standardShippingFee: 30000,
      discountAmount: 20000,
      appliedPromotion: { code: 'SALE10', discount: 20000 },
      loyaltyDiscount: 5000,
      loyalty: { appliedPoints: 500 },
    })
    const wrapper = mountSummary()
    expect(wrapper.text()).toContain('Miễn phí')
    expect(wrapper.find('.line-through').text()).toBe(formatCurrency(30000))
    expect(wrapper.text()).toContain('SALE10')
    expect(wrapper.text()).toContain(`-${formatCurrency(20000)}`)
    expect(wrapper.text()).toContain(`Điểm thưởng (${(500).toLocaleString()} điểm)`)
    expect(wrapper.text()).toContain(`-${formatCurrency(5000)}`)
  })

  it('shows warnings, the pricing error and asks the page to retry', async () => {
    resetCart({ warnings: ['Giá đã thay đổi'], pricingError: 'Không thể cập nhật giá', pricingLoading: true })
    const wrapper = mountSummary()
    expect(wrapper.text()).toContain('• Giá đã thay đổi')
    expect(wrapper.text()).toContain('Đang cập nhật giá...')
    expect(wrapper.find('[data-testid="checkout-total"]').classes()).toContain('opacity-50')
    await wrapper.find('[data-testid="checkout-pricing-error"] button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})
