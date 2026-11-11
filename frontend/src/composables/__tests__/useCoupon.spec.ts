import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reactive } from 'vue'
import { useCoupon } from '../useCoupon'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }))
const cartState = reactive<{ promoError: string; applyCoupon: ReturnType<typeof vi.fn> }>({
  promoError: '',
  applyCoupon: vi.fn(),
})

vi.mock('vue-toastification', () => ({ useToast: () => toast }))
vi.mock('@/stores/cart', () => ({ useCartStore: () => cartState }))

describe('useCoupon', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cartState.promoError = ''
    cartState.applyCoupon = vi.fn().mockResolvedValue(true)
  })

  it('does nothing for an empty / blank code', async () => {
    const { couponCode, handleApplyCoupon } = useCoupon()
    couponCode.value = '   '
    await handleApplyCoupon()
    expect(cartState.applyCoupon).not.toHaveBeenCalled()
  })

  it('trims + upper-cases the typed code and clears the input on success', async () => {
    const { couponCode, isApplyingCoupon, handleApplyCoupon } = useCoupon()
    couponCode.value = '  sale10 '
    const pending = handleApplyCoupon()
    expect(isApplyingCoupon.value).toBe(true)
    await pending

    expect(cartState.applyCoupon).toHaveBeenCalledWith('SALE10')
    expect(toast.success).toHaveBeenCalledWith('Áp dụng mã giảm giá thành công!')
    expect(couponCode.value).toBe('')
    expect(isApplyingCoupon.value).toBe(false)
  })

  it('keeps the input and shows the server error when the code is rejected', async () => {
    cartState.applyCoupon = vi.fn().mockImplementation(async () => {
      cartState.promoError = 'Mã đã hết lượt sử dụng'
      return false
    })
    const { couponCode, handleApplyCoupon } = useCoupon()
    couponCode.value = 'SALE10'
    await handleApplyCoupon()

    expect(toast.error).toHaveBeenCalledWith('Mã đã hết lượt sử dụng')
    expect(couponCode.value).toBe('SALE10')
  })

  it('falls back to a generic message when the store gives no error', async () => {
    cartState.applyCoupon = vi.fn().mockResolvedValue(false)
    const { applySuggestedCoupon } = useCoupon()
    await applySuggestedCoupon('VIP')
    expect(toast.error).toHaveBeenCalledWith('Mã giảm giá không hợp lệ')
  })

  it('applies a suggested code as-is and leaves the typed input alone', async () => {
    const { couponCode, applySuggestedCoupon } = useCoupon()
    couponCode.value = 'typed'
    await applySuggestedCoupon('freeShip')
    expect(cartState.applyCoupon).toHaveBeenCalledWith('freeShip')
    expect(couponCode.value).toBe('typed')
  })

  it('ignores clicks while a code is being applied (no duplicate preview requests)', async () => {
    let resolve!: (v: boolean) => void
    cartState.applyCoupon = vi.fn(() => new Promise<boolean>((r) => (resolve = r)))
    const { couponCode, handleApplyCoupon, applySuggestedCoupon } = useCoupon()
    couponCode.value = 'A'

    const first = handleApplyCoupon()
    await handleApplyCoupon()
    await applySuggestedCoupon('B')
    expect(cartState.applyCoupon).toHaveBeenCalledTimes(1)

    resolve(true)
    await first
  })

  it('releases the lock when the store throws', async () => {
    cartState.applyCoupon = vi.fn().mockRejectedValue(new Error('network'))
    const { isApplyingCoupon, applySuggestedCoupon } = useCoupon()
    await expect(applySuggestedCoupon('A')).rejects.toThrow('network')
    expect(isApplyingCoupon.value).toBe(false)
  })

  it('gives each caller its own input state', () => {
    const cart = useCoupon()
    const checkout = useCoupon()
    cart.couponCode.value = 'X'
    expect(checkout.couponCode.value).toBe('')
  })
})
