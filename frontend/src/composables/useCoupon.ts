import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { useCartStore } from '@/stores/cart'

/**
 * Voucher input shared by Cart and Checkout. The cart store re-prices the order with the
 * code (server checkout-preview); the discount shown is always the server's, never computed here.
 */
export function useCoupon() {
  const cartStore = useCartStore()
  const toast = useToast()

  const couponCode = ref('')
  const isApplyingCoupon = ref(false)

  async function applyCode(code: string): Promise<boolean> {
    isApplyingCoupon.value = true
    try {
      const success = await cartStore.applyCoupon(code)
      if (success) {
        toast.success('Áp dụng mã giảm giá thành công!')
      } else {
        toast.error(cartStore.promoError || 'Mã giảm giá không hợp lệ')
      }
      return success
    } finally {
      isApplyingCoupon.value = false
    }
  }

  /** Applies the typed code (trimmed, upper-cased) and clears the input on success. */
  async function handleApplyCoupon() {
    if (isApplyingCoupon.value || !couponCode.value.trim()) return
    const success = await applyCode(couponCode.value.trim().toUpperCase())
    if (success) couponCode.value = ''
  }

  /** Applies a code picked from the suggested voucher list, as-is. */
  async function applySuggestedCoupon(code: string) {
    if (isApplyingCoupon.value) return
    await applyCode(code)
  }

  return { couponCode, isApplyingCoupon, handleApplyCoupon, applySuggestedCoupon }
}
