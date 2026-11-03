import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem, CheckoutPreviewRequest, CheckoutPreviewResponse, PricingPolicy, Product } from '@/types'
import { cartService } from '@/services/cart.service'
import { orderService } from '@/services/order.service'

// Money is never computed here: subtotal, shipping, discounts and total all come from
// POST /orders/checkout-preview. The store only keeps the item list (persistence) and the
// latest server pricing for the selected lines.
export const PRICING_DEBOUNCE_MS = 400

export const PRICING_ERROR_MESSAGE = 'Không thể cập nhật giá. Vui lòng thử lại sau giây lát.'

/** Checkout-only inputs that affect the preview (loyalty) or the guest voucher identity (phone/email). */
export interface PricingContext {
  loyaltyPointsUsed?: number
  phone?: string
  customerEmail?: string
  shippingAddress?: string
  paymentMethod?: string
}

function unwrapPayload<T>(res: any): T | null {
  return ((res?.data as any)?.data || res?.data || null) as T | null
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(
    (JSON.parse(localStorage.getItem('cart') || '[]') as any[]).map(item => ({
      ...item,
      selected: item.selected !== false
    }))
  )
  const promotionCode = ref('')
  const promoError = ref('')
  const warnings = ref<string[]>([])

  const pricing = ref<CheckoutPreviewResponse | null>(null)
  const pricingLoading = ref(false)
  const pricingError = ref('')
  const pricingContext = ref<PricingContext>({})
  const pricingPolicy = ref<PricingPolicy | null>(null)

  const selectedItems = computed(() => items.value.filter((item: CartItem) => item.selected !== false))

  // Public names kept for consumers; they are plain views over the server response.
  const subtotal = computed(() => pricing.value?.subtotal ?? 0)
  const shippingFee = computed(() => pricing.value?.shippingFee ?? 0)
  const discountAmount = computed(() => pricing.value?.discount ?? 0)
  const loyaltyDiscount = computed(() => pricing.value?.loyaltyDiscount ?? 0)
  const total = computed(() => pricing.value?.total ?? 0)
  const isFreeShipping = computed(() => pricing.value?.isEligibleForFreeShipping ?? false)
  const amountNeededForFreeShipping = computed(() => pricing.value?.amountNeededForFreeShipping ?? 0)
  const freeShippingProgress = computed(() => pricing.value?.freeShippingProgress ?? 0)
  const freeShippingThreshold = computed<number | null>(
    () => pricing.value?.freeShippingThreshold ?? pricingPolicy.value?.freeShippingThreshold ?? null,
  )
  const standardShippingFee = computed<number | null>(
    () => pricing.value?.standardShippingFee ?? pricingPolicy.value?.shippingFee ?? null,
  )
  const appliedPromotion = computed(() => pricing.value?.appliedPromotion ?? null)
  const loyalty = computed(() => pricing.value?.loyalty ?? null)
  const unavailableItems = computed(() => pricing.value?.unavailableItems ?? [])
  const isValidForCheckout = computed(
    () => !!pricing.value && pricing.value.isValidForCheckout === true && !pricingError.value,
  )

  const itemsCount = computed(() => {
    return items.value.reduce((sum: number, item: CartItem) => sum + item.quantity, 0)
  })

  function getPreviewItem(productId: string) {
    return pricing.value?.items?.find(item => item.product === productId) ?? null
  }

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
  }

  function removeFromCart(productId: string) {
    items.value = items.value.filter((item: CartItem) => item.product._id !== productId)
    saveCart()
  }

  function toggleItemSelection(productId: string) {
    const item = items.value.find((item: CartItem) => item.product._id === productId)
    if (item) {
      item.selected = item.selected !== false ? false : true
      saveCart()
    }
  }

  function toggleAllSelection(selected: boolean) {
    items.value.forEach((item: CartItem) => {
      item.selected = selected
    })
    saveCart()
  }

  // ---------------------------------------------------------------------------
  // Server pricing (checkout-preview): debounced, latest request wins
  // ---------------------------------------------------------------------------
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let requestSeq = 0
  let waiters: Array<(result: CheckoutPreviewResponse | null) => void> = []

  function settleWaiters(result: CheckoutPreviewResponse | null) {
    const pending = waiters
    waiters = []
    pending.forEach(resolve => resolve(result))
  }

  function buildPreviewRequest(): CheckoutPreviewRequest {
    const ctx = pricingContext.value
    return {
      // Only selected lines, and never a client price: the backend reads prices from the DB.
      items: selectedItems.value.map(item => ({ product: item.product._id, quantity: item.quantity })),
      promotionCode: promotionCode.value || undefined,
      loyaltyPointsUsed: ctx.loyaltyPointsUsed && ctx.loyaltyPointsUsed > 0 ? ctx.loyaltyPointsUsed : undefined,
      paymentMethod: ctx.paymentMethod || undefined,
      phone: ctx.phone || undefined,
      customerEmail: ctx.customerEmail || undefined,
      shippingAddress: ctx.shippingAddress || undefined,
    }
  }

  /** Refresh local snapshots so the cart list and stock limits follow the server (stale guest prices). */
  function syncSnapshotsFromPreview(data: CheckoutPreviewResponse) {
    let changed = false
    for (const line of data.items || []) {
      const local = items.value.find((item: CartItem) => item.product._id === line.product)
      if (!local) continue
      const originalPrice = typeof line.originalPrice === 'number' ? line.originalPrice : line.price
      const discountPrice = line.price < originalPrice ? line.price : 0
      if (
        local.product.price !== originalPrice ||
        local.product.discountPrice !== discountPrice ||
        local.product.stock !== line.stock
      ) {
        local.product = { ...local.product, price: originalPrice, discountPrice, stock: line.stock }
        changed = true
      }
    }
    for (const missing of data.unavailableItems || []) {
      const local = items.value.find((item: CartItem) => item.product._id === missing.product)
      if (local && typeof missing.stock === 'number' && local.product.stock !== missing.stock) {
        local.product = { ...local.product, stock: missing.stock }
        changed = true
      }
    }
    if (changed) saveCart()
  }

  async function runPricingRequest() {
    const seq = ++requestSeq
    const isLatest = () => seq === requestSeq && debounceTimer === null

    if (selectedItems.value.length === 0) {
      pricing.value = null
      pricingError.value = ''
      warnings.value = []
      pricingLoading.value = false
      settleWaiters(null)
      return
    }

    try {
      const res = await orderService.checkoutPreview(buildPreviewRequest())
      if (!isLatest()) return
      const data = unwrapPayload<CheckoutPreviewResponse>(res)
      if (!data || typeof data.total !== 'number') throw new Error('Invalid checkout-preview response')

      pricing.value = data
      pricingError.value = ''
      warnings.value = Array.isArray(data.warnings) ? data.warnings : []
      syncSnapshotsFromPreview(data)

      const rejectedCode = !!promotionCode.value && !data.appliedPromotion
      if (rejectedCode) {
        // The voucher no longer applies (invalid, min order, per-customer limit): drop it and
        // re-price without it so the summary and isValidForCheckout reflect the real order.
        promoError.value = data.promotionError || 'Mã giảm giá không hợp lệ hoặc không đủ điều kiện.'
        promotionCode.value = ''
      }
      settleWaiters(data)
      if (rejectedCode) void refreshPricing()
    } catch (err) {
      if (!isLatest()) return
      // Keep the last good response on screen, but flag it so checkout is blocked until it recovers.
      console.warn('Checkout preview failed:', err)
      pricingError.value = PRICING_ERROR_MESSAGE
      settleWaiters(null)
    } finally {
      if (seq === requestSeq && debounceTimer === null) {
        pricingLoading.value = false
      }
    }
  }

  /**
   * Ask the backend to price the selected lines. Calls are debounced (PRICING_DEBOUNCE_MS) and only
   * the latest response is applied. Passing a context replaces the stored checkout context; omitting
   * it reuses the previous one. Resolves with the applied response, or null on error / empty selection.
   */
  function refreshPricing(
    context?: PricingContext,
    options: { immediate?: boolean } = {},
  ): Promise<CheckoutPreviewResponse | null> {
    if (context) pricingContext.value = { ...context }
    pricingLoading.value = true
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    return new Promise(resolve => {
      waiters.push(resolve)
      if (options.immediate) {
        void runPricingRequest()
      } else {
        debounceTimer = setTimeout(() => {
          debounceTimer = null
          void runPricingRequest()
        }, PRICING_DEBOUNCE_MS)
      }
    })
  }

  async function loadPricingPolicy() {
    if (pricingPolicy.value) return pricingPolicy.value
    try {
      const res = await orderService.getPricingPolicy()
      const data = unwrapPayload<PricingPolicy>(res)
      if (data && typeof data.freeShippingThreshold === 'number') {
        pricingPolicy.value = data
      }
    } catch {
      // Optional display data: the threshold text is simply hidden without it.
    }
    return pricingPolicy.value
  }

  async function applyCoupon(code: string) {
    promoError.value = ''
    promotionCode.value = code.trim().toUpperCase()
    const result = await refreshPricing(undefined, { immediate: true })
    if (!result) {
      // Network/server error: the code could not be verified, so it is not kept.
      promotionCode.value = ''
      promoError.value = promoError.value || pricingError.value || 'Không thể kiểm tra mã giảm giá'
      return false
    }
    return !!result.appliedPromotion && !promoError.value
  }

  function removeCoupon() {
    promotionCode.value = ''
    promoError.value = ''
    return refreshPricing(undefined, { immediate: true })
  }

  function resetPricing() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    requestSeq++
    settleWaiters(null)
    pricing.value = null
    pricingLoading.value = false
    pricingError.value = ''
    warnings.value = []
  }

  function clearCart() {
    items.value = []
    promotionCode.value = ''
    promoError.value = ''
    resetPricing()
    localStorage.removeItem('cart')
  }

  function clearCheckedOutItems() {
    items.value = items.value.filter((item: CartItem) => item.selected === false)
    // The voucher was consumed by the order that was just placed.
    promotionCode.value = ''
    promoError.value = ''
    resetPricing()
    saveCart()
  }

  async function syncWithServer(isAuthenticated: boolean) {
    if (!isAuthenticated) return
    try {
      const syncPayload = items.value.map(i => ({
        productId: i.product._id,
        quantity: i.quantity,
      }))
      if (syncPayload.length > 0) {
        // 'replace': the local list is the user's intent; 'merge' would add quantities on every visit.
        await cartService.syncCart(syncPayload, 'replace')
      }
      const res = await cartService.getCart()
      // Item persistence only: the server cart's money fields are ignored.
      if (res.data?.items && Array.isArray(res.data.items)) {
        const previousSelection = new Map(items.value.map(i => [i.product._id, i.selected !== false]))
        items.value = res.data.items.map((ci: any) => ({
          product: ci.product,
          quantity: ci.quantity,
          selected: previousSelection.get(ci.product?._id) ?? true,
        }))
        saveCart()
      }
    } catch (err) {
      console.warn('Sync cart with server failed:', err)
    }
  }

  /** Gate checkout on a fresh server preview of the selected lines (works for guests too). */
  async function validateCartBeforeCheckout() {
    const result = await refreshPricing(undefined, { immediate: true })
    return {
      isValidForCheckout: !!result && result.isValidForCheckout === true && !pricingError.value,
      warnings: result?.warnings ?? [],
      error: pricingError.value,
    }
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

  return {
    items,
    selectedItems,
    promotionCode,
    appliedPromotion,
    discountAmount,
    loyaltyDiscount,
    loyalty,
    promoError,
    warnings,
    pricing,
    pricingLoading,
    pricingError,
    pricingPolicy,
    unavailableItems,
    isValidForCheckout,
    subtotal,
    shippingFee,
    standardShippingFee,
    total,
    itemsCount,
    isFreeShipping,
    amountNeededForFreeShipping,
    freeShippingProgress,
    freeShippingThreshold,
    getPreviewItem,
    addToCart,
    updateQuantity,
    removeFromCart,
    toggleItemSelection,
    toggleAllSelection,
    refreshPricing,
    loadPricingPolicy,
    applyCoupon,
    removeCoupon,
    clearCart,
    clearCheckedOutItems,
    syncWithServer,
    validateCartBeforeCheckout,
  }
})
