import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem, Product, Promotion } from '@/types'
import { promotionService } from '@/services/promotion.service'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(
    (JSON.parse(localStorage.getItem('cart') || '[]') as any[]).map(item => ({
      ...item,
      selected: item.selected !== false
    }))
  )
  const appliedPromotion = ref<Promotion | null>(null)
  const discountAmount = ref(0)
  const promoError = ref('')

  const subtotal = computed(() => {
    return items.value.reduce((sum: number, item: CartItem) => {
      if (item.selected === false) return sum
      const price = item.product.discountPrice || item.product.price
      return sum + price * item.quantity
    }, 0)
  })

  const shippingFee = computed(() => {
    if (subtotal.value === 0) return 0
    return subtotal.value >= 299000 ? 0 : 30000
  })

  const total = computed(() => {
    const val = subtotal.value + shippingFee.value - discountAmount.value
    return val > 0 ? val : 0
  })

  const itemsCount = computed(() => {
    return items.value.reduce((sum: number, item: CartItem) => sum + item.quantity, 0)
  })

  function addToCart(product: Product, quantity = 1) {
    const existing = items.value.find((item: CartItem) => item.product._id === product._id)
    if (existing) {
      existing.quantity += quantity
      existing.selected = true
    } else {
      items.value.push({ product, quantity, selected: true })
    }
    saveCart()
    recalculateDiscount()
  }

  function updateQuantity(productId: string, quantity: number) {
    const item = items.value.find((item: CartItem) => item.product._id === productId)
    if (item) {
      item.quantity = quantity
      if (item.quantity <= 0) {
        removeFromCart(productId)
      }
    }
    saveCart()
    recalculateDiscount()
  }

  function removeFromCart(productId: string) {
    items.value = items.value.filter((item: CartItem) => item.product._id !== productId)
    saveCart()
    recalculateDiscount()
  }

  function toggleItemSelection(productId: string) {
    const item = items.value.find((item: CartItem) => item.product._id === productId)
    if (item) {
      item.selected = item.selected !== false ? false : true
      saveCart()
      recalculateDiscount()
    }
  }

  function toggleAllSelection(selected: boolean) {
    items.value.forEach((item: CartItem) => {
      item.selected = selected
    })
    saveCart()
    recalculateDiscount()
  }

  async function applyCoupon(code: string) {
    promoError.value = ''
    try {
      const res = await promotionService.apply(code, subtotal.value)
      appliedPromotion.value = res as any
      discountAmount.value = (res as any).discount
      return true
    } catch (err: any) {
      promoError.value = err.message || 'Mã giảm giá không hợp lệ'
      appliedPromotion.value = null
      discountAmount.value = 0
      return false
    }
  }

  function removeCoupon() {
    appliedPromotion.value = null
    discountAmount.value = 0
    promoError.value = ''
  }

  function clearCart() {
    items.value = []
    appliedPromotion.value = null
    discountAmount.value = 0
    promoError.value = ''
    localStorage.removeItem('cart')
  }

  function clearCheckedOutItems() {
    items.value = items.value.filter((item: CartItem) => item.selected === false)
    saveCart()
    recalculateDiscount()
  }

  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(items.value))
  }

  function recalculateDiscount() {
    if (appliedPromotion.value) {
      const promo = appliedPromotion.value
      if (subtotal.value < promo.minOrderValue) {
        removeCoupon()
        promoError.value = `Đơn hàng tối thiểu ${promo.minOrderValue.toLocaleString('vi-VN')}đ để sử dụng mã này`
      } else {
        if (promo.discountType === 'PERCENT') {
          discountAmount.value = Math.floor(subtotal.value * promo.discountValue / 100)
        } else {
          discountAmount.value = promo.discountValue
        }
      }
    }
  }

  return {
    items,
    appliedPromotion,
    discountAmount,
    promoError,
    subtotal,
    shippingFee,
    total,
    itemsCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    toggleItemSelection,
    toggleAllSelection,
    applyCoupon,
    removeCoupon,
    clearCart,
    clearCheckedOutItems
  }
})
