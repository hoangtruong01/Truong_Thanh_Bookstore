import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem, Product, Promotion } from '@/types'
import { promotionService } from '@/services/promotion.service'
import { cartService } from '@/services/cart.service'

export const FREE_SHIPPING_THRESHOLD = 299000
export const DEFAULT_SHIPPING_FEE = 30000

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
  const warnings = ref<string[]>([])

  const subtotal = computed(() => {
    return items.value.reduce((sum: number, item: CartItem) => {
      if (item.selected === false) return sum
      const price = (item.product.discountPrice != null && item.product.discountPrice > 0)
        ? item.product.discountPrice
        : item.product.price
      return sum + price * item.quantity
    }, 0)
  })

  const isFreeShipping = computed(() => {
    return subtotal.value >= FREE_SHIPPING_THRESHOLD
  })

  const amountNeededForFreeShipping = computed(() => {
    return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal.value)
  })

  const freeShippingProgress = computed(() => {
    if (subtotal.value <= 0) return 0
    return Math.min(100, Math.round((subtotal.value / FREE_SHIPPING_THRESHOLD) * 100))
  })

  const shippingFee = computed(() => {
    if (subtotal.value === 0) return 0
    return subtotal.value >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE
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
    warnings.value = []
    localStorage.removeItem('cart')
  }

  function clearCheckedOutItems() {
    items.value = items.value.filter((item: CartItem) => item.selected === false)
    saveCart()
    recalculateDiscount()
  }

  async function syncWithServer(isAuthenticated: boolean) {
    if (!isAuthenticated) return
    try {
      const syncPayload = items.value.map(i => ({
        productId: i.product._id,
        quantity: i.quantity,
      }))
      if (syncPayload.length > 0) {
        await cartService.syncCart(syncPayload)
      }
      const res = await cartService.getCart()
      if (res.data?.items && Array.isArray(res.data.items)) {
        items.value = res.data.items.map((ci: any) => ({
          product: ci.product,
          quantity: ci.quantity,
          selected: true,
        }))
        saveCart()
        recalculateDiscount()
      }
    } catch (err) {
      console.warn('Sync cart with server failed:', err)
    }
  }

  async function validateCartBeforeCheckout(isAuthenticated: boolean) {
    warnings.value = []
    if (isAuthenticated) {
      try {
        const res = await cartService.validateCart()
        if (res.data?.warnings?.length > 0) {
          warnings.value = res.data.warnings
        }
        return res.data
      } catch (err) {
        console.warn('Validate cart error:', err)
      }
    }
    return { isValidForCheckout: items.value.length > 0 }
  }

  function saveCart() {
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
    warnings,
    subtotal,
    shippingFee,
    total,
    itemsCount,
    isFreeShipping,
    amountNeededForFreeShipping,
    freeShippingProgress,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    addToCart,
    updateQuantity,
    removeFromCart,
    toggleItemSelection,
    toggleAllSelection,
    applyCoupon,
    removeCoupon,
    clearCart,
    clearCheckedOutItems,
    syncWithServer,
    validateCartBeforeCheckout,
  }
})

