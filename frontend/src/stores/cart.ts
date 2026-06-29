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
      // FIX-M03: Use explicit check — discountPrice=0 means no discount
      const price = (item.product.discountPrice != null && item.product.discountPrice > 0)
        ? item.product.discountPrice
        : item.product.price
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
      const newQty = existing.quantity + quantity
      existing.quantity = Math.min(newQty, product.stock)
      existing.selected = true
    } else {
      items.value.push({ product, quantity: Math.min(quantity, product.stock), selected: true })
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
      const payload = res.data
      appliedPromotion.value = payload.promotion
      discountAmount.value = payload.discount
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
    // FIX-M06: Save only minimal fields to prevent localStorage quota issues
    const minimal = items.value.map((item: CartItem) => ({
      product: {
        _id: item.product._id,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        discountPrice: item.product.discountPrice,
        stock: item.product.stock,
        images: item.product.images?.slice(0, 1) || [],
        rating: item.product.rating,
        sold: item.product.sold,
        sku: item.product.sku || '',
        status: item.product.status,
        isFeatured: item.product.isFeatured,
        isDeleted: item.product.isDeleted,
        category: typeof item.product.category === 'string' ? item.product.category : (item.product.category as any)?._id || '',
        createdAt: item.product.createdAt,
        updatedAt: item.product.updatedAt,
      },
      quantity: item.quantity,
      selected: item.selected,
    }))
    try {
      localStorage.setItem('cart', JSON.stringify(minimal))
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e)
    }
  }

  function recalculateDiscount() {
    if (appliedPromotion.value) {
      const promo = appliedPromotion.value
      if (subtotal.value < promo.minOrderValue) {
        removeCoupon()
        promoError.value = `Đơn hàng tối thiểu ${promo.minOrderValue.toLocaleString('vi-VN')}đ để sử dụng mã này`
      } else {
        if (promo.discountType === 'PERCENT') {
          let calculated = Math.floor(subtotal.value * promo.discountValue / 100)
          if (promo.maxDiscount && promo.maxDiscount > 0) {
            calculated = Math.min(calculated, promo.maxDiscount)
          }
          discountAmount.value = calculated
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
