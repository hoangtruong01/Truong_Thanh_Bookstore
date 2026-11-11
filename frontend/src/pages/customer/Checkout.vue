<template>
  <div class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-extrabold text-slate-900 mb-8">Thanh toán đơn hàng</h1>

    <!-- 1. Trạng Thái: Đặt Hàng & Thanh Toán Thành Công -->
    <OrderSuccess
      v-if="orderSuccess"
      :order-code="orderCode"
      :order-id="createdOrderId"
      :recipient="shippingInfo"
      :payment-method="submittedPaymentMethod"
      :total="lastSubmittedTotal"
      :bank-transfer-config="bankTransferConfig"
      :is-authenticated="authStore.isAuthenticated"
    />

    <!-- 2. Trạng Thái: Đặt Hàng Thất Bại -->
    <div v-else-if="orderFailed" class="bg-white border border-red-200 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-6 shadow-xs">
      <div class="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-10 h-10"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
      </div>
      <div class="space-y-2">
        <h2 class="text-2xl font-extrabold text-slate-800">Đặt hàng chưa thành công</h2>
        <p class="text-red-600 font-medium text-sm max-w-md mx-auto">
          {{ orderFailReason || 'Hệ thống không thể xử lý đơn hàng lúc này. Vui lòng kiểm tra lại tồn kho hoặc chọn phương thức thanh toán khác.' }}
        </p>
      </div>
      <div class="flex flex-col sm:flex-row justify-center gap-3">
        <button
          type="button"
          class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-3 px-8 rounded-xl transition-colors text-sm cursor-pointer shadow-md shadow-red-500/20"
          @click="resetOrderError"
        >
          Thử lại thanh toán
        </button>
        <router-link to="/cart" class="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-8 rounded-xl transition-colors text-sm">
          Kiểm tra lại giỏ hàng
        </router-link>
      </div>
    </div>

    <!-- 3. Form Đặt Hàng & Checkout UX Minh Bạch -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Checkout Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Shipping details -->
        <AddressSection
          v-model:selected-address-id="selectedAddressId"
          v-model:full-name="shippingInfo.fullName"
          v-model:phone="shippingInfo.phone"
          v-model:email="shippingInfo.email"
          v-model:address="shippingInfo.address"
          v-model:note="shippingInfo.note"
          :addresses="addresses"
          :is-authenticated="authStore.isAuthenticated"
          :phone-valid="isPhoneValid"
          @address-change="onAddressSelectChange"
        />

        <!-- Payment Method -->
        <PaymentMethodSelector v-model="paymentMethod" :methods="paymentMethods" />
      </div>

      <!-- Order Review & Transparent Pricing Summary (FE-06) -->
      <div class="space-y-6">
        <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <div class="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Chi tiết sản phẩm</h3>
            <span class="text-xs font-bold text-slate-500">{{ checkoutItems.length }} món</span>
          </div>

          <!-- Realtime Stock Warning Banner (FE-06) -->
          <div v-if="hasStockIssues" class="bg-red-50 border border-red-200 rounded-xl p-3.5 space-y-1">
            <p class="text-xs font-bold text-red-700 flex items-center gap-1.5">
              <span>⚠️</span> Có sản phẩm không đủ tồn kho
            </p>
            <p class="text-[11px] text-red-600 leading-relaxed">
              Một số sách trong giỏ hàng đã hết hoặc không đủ số lượng. Vui lòng bấm điều chỉnh hoặc chọn sản phẩm khác để tiếp tục đặt hàng.
            </p>
          </div>

          <!-- Product Item List with Stock Indicators (FE-06) -->
          <div class="max-h-72 overflow-y-auto space-y-3 divide-y divide-slate-100 pr-1">
            <div
              v-for="item in checkoutItems"
              :key="item.product._id"
              class="pt-3 first:pt-0 space-y-1.5 rounded-xl p-2 transition-colors"
              :class="{
                'bg-red-50/40 border border-red-200': getItemStock(item.product._id) !== null && getItemStock(item.product._id)! <= 0,
                'bg-amber-50/30 border border-amber-200': getItemStock(item.product._id) !== null && getItemStock(item.product._id)! > 0 && getItemStock(item.product._id)! < item.quantity
              }"
            >
              <div class="flex gap-3">
                <div class="w-12 h-12 rounded-lg bg-slate-50 overflow-hidden border border-slate-100 flex-shrink-0">
                  <img :src="item.product.images[0] || 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'" class="w-full h-full object-cover" />
                </div>
                <div class="flex-grow min-w-0">
                  <p class="text-xs font-bold text-slate-800 truncate">{{ item.product.name }}</p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[10.5px] text-slate-500 font-semibold">SL: {{ item.quantity }}</span>

                    <!-- Stock Status Badges -->
                    <span
                      v-if="getUnavailableReason(item.product._id) === 'UNAVAILABLE'"
                      class="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-red-100 text-red-700"
                    >
                      Ngừng kinh doanh
                    </span>
                    <span
                      v-else-if="getItemStock(item.product._id) !== null && getItemStock(item.product._id)! <= 0"
                      class="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-red-100 text-red-700"
                    >
                      Hết hàng
                    </span>
                    <span
                      v-else-if="getItemStock(item.product._id) !== null && getItemStock(item.product._id)! < item.quantity"
                      class="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800"
                    >
                      Còn {{ getItemStock(item.product._id) }} quyển
                    </span>
                    <span
                      v-else
                      class="text-[10px] font-medium text-green-700 flex items-center gap-1"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> Còn hàng
                    </span>
                  </div>
                </div>
                <!-- Line total from the server preview (never price x quantity on the client) -->
                <span v-if="cartStore.getPreviewItem(item.product._id)" class="text-xs font-bold text-slate-800 whitespace-nowrap" data-testid="checkout-line-subtotal">
                  {{ formatCurrency(cartStore.getPreviewItem(item.product._id)!.subtotal) }}
                </span>
                <span v-else-if="getUnavailableReason(item.product._id)" class="text-xs font-bold text-slate-400 whitespace-nowrap">—</span>
                <span v-else class="h-3.5 w-14 bg-slate-100 rounded animate-pulse inline-block" aria-label="Đang tải giá"></span>
              </div>

              <!-- Quick Auto-Adjust button for insufficient stock -->
              <div
                v-if="getItemStock(item.product._id) !== null && getItemStock(item.product._id)! > 0 && getItemStock(item.product._id)! < item.quantity"
                class="flex justify-between items-center bg-white border border-amber-200 rounded-lg px-2.5 py-1 text-[10.5px]"
              >
                <span class="text-amber-800">Bạn chọn {{ item.quantity }}, kho chỉ còn {{ getItemStock(item.product._id) }}</span>
                <button
                  type="button"
                  class="text-[#dc2626] font-bold hover:underline cursor-pointer"
                  @click="adjustItemQty(item.product._id, getItemStock(item.product._id)!)"
                >
                  Điều chỉnh về {{ getItemStock(item.product._id) }}
                </button>
              </div>

              <p
                v-if="getUnavailableReason(item.product._id) === 'UNAVAILABLE'"
                class="text-[10px] text-red-600 font-medium"
              >
                Sản phẩm này hiện không còn kinh doanh. Vui lòng bỏ chọn trong giỏ hàng.
              </p>
              <p
                v-else-if="getItemStock(item.product._id) !== null && getItemStock(item.product._id)! <= 0"
                class="text-[10px] text-red-600 font-medium"
              >
                Sản phẩm này tạm thời hết hàng. Vui lòng bỏ chọn trong giỏ hàng.
              </p>
            </div>
          </div>

          <!-- Free Shipping Progress Bar (FE-06 Transparency) -->
          <div v-if="cartStore.pricing" class="border-t border-slate-100 pt-4 space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-slate-700">Ưu đãi Freeship toàn quốc:</span>
              <span v-if="cartStore.isFreeShipping" class="font-extrabold text-green-600">Đã đạt Freeship! 🎉</span>
              <span v-else-if="cartStore.freeShippingThreshold" class="font-bold text-slate-500">Đơn từ {{ formatCurrency(cartStore.freeShippingThreshold) }}</span>
            </div>

            <!-- Progress Bar Line (percentage computed by the server) -->
            <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="cartStore.isFreeShipping ? 'bg-green-500' : 'bg-gradient-to-r from-red-500 to-amber-500'"
                :style="{ width: `${cartStore.freeShippingProgress}%` }"
              ></div>
            </div>

            <p v-if="cartStore.isFreeShipping" class="text-[10.5px] text-green-700 font-medium">
              Đơn hàng đủ điều kiện miễn phí vận chuyển<template v-if="cartStore.standardShippingFee"> tiết kiệm {{ formatCurrency(cartStore.standardShippingFee) }}</template>.
            </p>
            <p v-else class="text-[10.5px] text-slate-500 font-medium">
              Mua thêm <strong class="text-[#dc2626]">{{ formatCurrency(cartStore.amountNeededForFreeShipping) }}</strong> để được miễn phí vận chuyển!
            </p>
          </div>

          <!-- Coupon Block on Checkout -->
          <VoucherSection
            v-model:code="couponCode"
            v-model:expanded="showVoucherList"
            :promotions="activePromotions"
            :applying="isApplyingCoupon"
            @apply="handleApplyCoupon"
            @apply-suggested="applySuggestedCoupon"
          />

          <!-- Loyalty Points Redemption Block -->
          <LoyaltySection
            v-if="authStore.isAuthenticated && loyalty && loyalty.availablePoints > 0"
            v-model:points="loyaltyPointsInput"
            :loyalty="loyalty"
            :error="loyaltyError"
          />

          <PricingSummary @retry="retryPricing" />

          <!-- Button Đặt Hàng kèm Submit-Lock Guard (FE-05 + FE-06) -->
          <button
            type="button"
            :disabled="submitting || isPlacingOrder || checkoutItems.length === 0 || hasStockIssues || !isPricingReady || (!!shippingInfo.phone && !isPhoneValid)"
            data-testid="checkout-submit"
            class="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-lg shadow-red-500/20 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
            @click="placeOrder"
          >
            <svg v-if="submitting || isPlacingOrder" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span v-if="hasStockIssues">Vui lòng xử lý tồn kho</span>
            <span v-else-if="submitting || isPlacingOrder">Đang xử lý đặt hàng...</span>
            <span v-else-if="cartStore.pricingError">Không thể cập nhật giá</span>
            <span v-else-if="checkoutItems.length > 0 && !isPricingReady">Đang cập nhật giá...</span>
            <span v-else>Xác nhận đặt hàng</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useCartStore, type PricingContext } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { orderService } from '@/services/order.service'
import { paymentService, type BankTransferConfig } from '@/services/payment.service'
import { addressService } from '@/services/address.service'
import { PAYMENT_METHOD_LABELS, formatCurrency } from '@/utils/helpers'
import { promotionService } from '@/services/promotion.service'
import type { Promotion, Address } from '@/types'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { useDoubleSubmit } from '@/composables/useDoubleSubmit'
import { useCoupon } from '@/composables/useCoupon'
import OrderSuccess from '@/components/customer/checkout/OrderSuccess.vue'
import AddressSection from '@/components/customer/checkout/AddressSection.vue'
import PaymentMethodSelector from '@/components/customer/checkout/PaymentMethodSelector.vue'
import VoucherSection from '@/components/customer/checkout/VoucherSection.vue'
import LoyaltySection from '@/components/customer/checkout/LoyaltySection.vue'
import PricingSummary from '@/components/customer/checkout/PricingSummary.vue'
import type { CheckoutPaymentMethod, PaymentMethodOption } from '@/components/customer/checkout/types'

useSeoMeta({
  title: 'Thanh toán đơn hàng',
  description: 'Hoàn tất thanh toán đơn hàng tại Trường Thành Stationery.',
})

const cartStore = useCartStore()
const authStore = useAuthStore()
const toast = useToast()
const { isSubmitting: isPlacingOrder } = useDoubleSubmit({ cooldownMs: 1000 })
const { couponCode, isApplyingCoupon, handleApplyCoupon, applySuggestedCoupon } = useCoupon()

const checkoutItems = computed(() => cartStore.items.filter(item => item.selected !== false))

const submitting = ref(false)
const orderSuccess = ref(false)
const orderFailed = ref(false)
const orderFailReason = ref('')
const orderCode = ref('')
const activePromotions = ref<Promotion[]>([])
const showVoucherList = ref(false)
const createdOrderId = ref('')
const lastSubmittedTotal = ref(0)
const submittedPaymentMethod = ref<CheckoutPaymentMethod>('COD')

const enabledPaymentMethods = ref<string[]>(['COD'])
const bankTransferConfig = ref<BankTransferConfig | null>(null)
// FE-06: Realtime inventory status from the server preview (lines it priced + lines it dropped)
function getUnavailableReason(productId: string): 'UNAVAILABLE' | 'OUT_OF_STOCK' | null {
  return cartStore.unavailableItems.find(item => item.product === productId)?.reason ?? null
}

function getItemStock(productId: string): number | null {
  const line = cartStore.getPreviewItem(productId)
  if (line) return typeof line.stock === 'number' ? line.stock : null
  const unavailable = cartStore.unavailableItems.find(item => item.product === productId)
  if (unavailable) return unavailable.reason === 'OUT_OF_STOCK' ? (unavailable.stock ?? 0) : 0
  return null
}

const hasStockIssues = computed(() => {
  return checkoutItems.value.some((item) => {
    if (getUnavailableReason(item.product._id)) return true
    const stock = getItemStock(item.product._id)
    if (stock === null) return false
    return stock <= 0 || stock < item.quantity
  })
})

function adjustItemQty(productId: string, maxAvailable: number) {
  if (maxAvailable <= 0) {
    cartStore.removeFromCart(productId)
    toast.info('Đã xóa sản phẩm hết hàng khỏi giỏ hàng.')
  } else {
    cartStore.updateQuantity(productId, maxAvailable)
    toast.info(`Đã điều chỉnh số lượng về ${maxAvailable} theo tồn kho khả dụng.`)
  }
}

// PRODUCT-01: Loyalty Point Spending. Balance, minimum, cap and errors all come from
// preview.loyalty; the client only checks that the input is a positive integer.
const loyalty = computed(() => cartStore.loyalty)
const loyaltyPointsInput = ref<number | null>(null)

const loyaltyInputInvalid = computed(() => {
  const raw = loyaltyPointsInput.value
  if (raw === null || (raw as unknown) === '') return false
  const val = Number(raw)
  return !Number.isSafeInteger(val) || val < 0
})

// Points sent to the preview/order. Nothing is sent while the server says redeeming is impossible.
const loyaltyPointsRequested = computed(() => {
  if (!authStore.isAuthenticated || loyaltyInputInvalid.value) return 0
  if (loyalty.value && !loyalty.value.canRedeem) return 0
  return Number(loyaltyPointsInput.value) || 0
})

const loyaltyError = computed(() => {
  if (loyaltyInputInvalid.value) return 'Số điểm phải là số nguyên dương'
  if (!loyaltyPointsRequested.value) return ''
  return loyalty.value?.error || ''
})

// Ordering requires a fresh, successful server preview of exactly what is on screen.
const isPricingReady = computed(() => !!cartStore.pricing && !cartStore.pricingLoading && !cartStore.pricingError)

const shippingInfo = reactive({
  fullName: '',
  phone: '',
  email: '',
  address: '',
  note: '',
})

const addresses = ref<Address[]>([])
const selectedAddressId = ref('')

async function fetchUserAddresses() {
  if (!authStore.isAuthenticated) return
  try {
    addresses.value = await addressService.getAll()
    const def = addresses.value.find(a => a.isDefault)
    if (def) {
      selectedAddressId.value = def._id
      applyAddress(def)
    }
  } catch {
    // optional
  }
}

function applyAddress(addr: Address) {
  shippingInfo.fullName = addr.recipientName
  shippingInfo.phone = addr.phone
  shippingInfo.address = `${addr.detail}, ${addr.ward}, ${addr.district}, ${addr.province}`
}

function onAddressSelectChange() {
  const addr = addresses.value.find(a => a._id === selectedAddressId.value)
  if (addr) {
    applyAddress(addr)
  }
}

const paymentMethod = ref<CheckoutPaymentMethod>('COD')

const allPaymentMethods: PaymentMethodOption[] = [
  {
    value: 'COD',
    label: PAYMENT_METHOD_LABELS.COD,
    description: 'Thanh toán bằng tiền mặt khi shipper giao hàng tận nơi.',
    tag: 'Phổ biến',
  },
  {
    value: 'BANK_TRANSFER',
    label: PAYMENT_METHOD_LABELS.BANK_TRANSFER,
    description: 'Chuyển khoản theo số tài khoản hoặc quét QR, đối soát và xác nhận nhanh.',
    tag: 'Khuyên dùng',
  },
  {
    value: 'VNPAY',
    label: PAYMENT_METHOD_LABELS.VNPAY,
    description: 'Thanh toán an toàn qua VNPAY-QR, thẻ ATM nội địa hoặc thẻ quốc tế.',
  },
  {
    value: 'MOMO',
    label: PAYMENT_METHOD_LABELS.MOMO,
    description: 'Quét mã qua ứng dụng MoMo chỉ với 1 chạm.',
  },
]

const paymentMethods = computed(() => {
  return allPaymentMethods.filter(method => {
    // Backend security invariant: Guest checkout only supports COD
    if (!authStore.isAuthenticated && method.value !== 'COD') {
      return false
    }
    return enabledPaymentMethods.value.includes(method.value)
  })
})

async function fetchEnabledPaymentMethods() {
  try {
    const res = await paymentService.getEnabledMethods()
    const data = (res.data as any)?.data || res.data
    if (data?.methods && Array.isArray(data.methods)) {
      enabledPaymentMethods.value = data.methods
    }
    if (data?.bankTransfer) {
      bankTransferConfig.value = data.bankTransfer
    }
    if (!paymentMethods.value.some(m => m.value === paymentMethod.value)) {
      paymentMethod.value = paymentMethods.value[0]?.value || 'COD'
    }
  } catch (_err) {
    enabledPaymentMethods.value = ['COD']
    paymentMethod.value = 'COD'
  }
}

const checkoutIdempotencyKey = ref<string>(
  sessionStorage.getItem('checkout-idempotency-key') || crypto.randomUUID()
)
sessionStorage.setItem('checkout-idempotency-key', checkoutIdempotencyKey.value)

function refreshIdempotencyKey(): string {
  const newKey = crypto.randomUUID()
  checkoutIdempotencyKey.value = newKey
  sessionStorage.setItem('checkout-idempotency-key', newKey)
  return newKey
}

function resetOrderError() {
  orderFailed.value = false
  orderFailReason.value = ''
  refreshIdempotencyKey()
}

// UX-06: Phone validation
const isPhoneValid = computed(() => {
  if (!shippingInfo.phone) return true
  return /^0\d{9}$/.test(shippingInfo.phone)
})

const EMAIL_LOOKS_COMPLETE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Inputs for checkout-preview. No placeholders: phone/email are sent only once they are complete
// (the guest voucher per-customer limit keys on them), and a half-typed phone never causes a 400.
const previewPhone = computed(() => (shippingInfo.phone && isPhoneValid.value ? shippingInfo.phone : ''))
const previewEmail = computed(() => {
  const email = shippingInfo.email.trim()
  return EMAIL_LOOKS_COMPLETE.test(email) ? email : ''
})

function buildPricingContext(): PricingContext {
  return {
    loyaltyPointsUsed: loyaltyPointsRequested.value > 0 ? loyaltyPointsRequested.value : undefined,
    phone: previewPhone.value || undefined,
    customerEmail: previewEmail.value || undefined,
    shippingAddress: shippingInfo.address.trim() || undefined,
    paymentMethod: paymentMethod.value,
  }
}

function retryPricing() {
  cartStore.refreshPricing(buildPricingContext(), { immediate: true })
}

// Declared after every ref/computed it reads (paymentMethod, loyaltyPointsRequested, shippingInfo, ...):
// with immediate: true the getters and buildPricingContext run during setup, so an earlier
// position hits the temporal dead zone and throws a ReferenceError.
// The first run prices the page at once; later changes are debounced by the store (400 ms),
// so typing an address does not fire one request per keystroke (and trip the 429 throttle).
let initialPreviewRequested = false
watch(
  [
    () => checkoutItems.value.map(i => `${i.product._id}:${i.quantity}`).join(','),
    () => paymentMethod.value,
    () => loyaltyPointsRequested.value,
    () => shippingInfo.address,
    () => previewPhone.value,
    () => previewEmail.value,
  ],
  () => {
    cartStore.refreshPricing(buildPricingContext(), { immediate: !initialPreviewRequested })
    initialPreviewRequested = true
  },
  { immediate: true }
)

onMounted(async () => {
  await fetchEnabledPaymentMethods()

  if (authStore.isAuthenticated && authStore.user) {
    shippingInfo.fullName = authStore.user.fullName || ''
    shippingInfo.phone = authStore.user.phone || ''
    shippingInfo.email = authStore.user.email || ''
    await fetchUserAddresses()
  }

  try {
    const res = await promotionService.getActive()
    activePromotions.value = res.data || []
  } catch {
    // optional
  }
})

async function placeOrder() {
  if (submitting.value || isPlacingOrder.value) return
  if (hasStockIssues.value) {
    toast.error('Vui lòng điều chỉnh số lượng hoặc bỏ chọn sản phẩm hết hàng trước khi đặt.')
    return
  }
  if (loyaltyError.value) {
    toast.warning(loyaltyError.value)
    return
  }
  if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.email || !shippingInfo.address) {
    toast.warning('Vui lòng điền đầy đủ thông tin giao hàng')
    return
  }

  submitting.value = true
  orderFailed.value = false
  orderFailReason.value = ''

  try {
    // Only product + quantity: the backend prices every line from the database.
    const items = checkoutItems.value.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
    }))

    const orderData: any = {
      items,
      shippingAddress: shippingInfo.address,
      phone: shippingInfo.phone,
      note: shippingInfo.note || undefined,
      paymentMethod: paymentMethod.value,
      promotionCode: cartStore.appliedPromotion?.code || undefined,
      loyaltyPointsUsed: loyaltyPointsRequested.value > 0 ? loyaltyPointsRequested.value : undefined,
      customerName: shippingInfo.fullName,
      customerEmail: shippingInfo.email,
      idempotencyKey: checkoutIdempotencyKey.value,
    }

    // Pre-checkout safe validation: re-price right now and stop if anything changed or is invalid
    const totalShown = cartStore.total
    const previewData = await cartStore.refreshPricing(buildPricingContext(), { immediate: true })
    if (!previewData) {
      toast.error(cartStore.pricingError || 'Không thể cập nhật giá. Vui lòng thử lại.')
      return
    }
    if (!previewData.isValidForCheckout) {
      toast.warning(previewData.warnings?.length ? previewData.warnings.join(' | ') : 'Đơn hàng chưa hợp lệ, vui lòng kiểm tra lại.')
      return
    }
    if (previewData.total !== totalShown) {
      toast.info('Tổng thanh toán vừa được cập nhật. Vui lòng kiểm tra lại trước khi đặt hàng.')
      return
    }

    let response: any
    if (authStore.isAuthenticated) {
      response = await orderService.createAuthenticated(orderData)
    } else {
      response = await orderService.create(orderData)
    }

    const orderResponseData = (response.data as any)?.data || response.data
    orderCode.value = orderResponseData.orderCode
    const orderId = orderResponseData._id
    createdOrderId.value = orderId
    lastSubmittedTotal.value = orderResponseData.total ?? previewData.total
    submittedPaymentMethod.value = paymentMethod.value

    const guestToken = orderResponseData.guestAccessToken
    if (!authStore.isAuthenticated && guestToken) {
      localStorage.setItem(`guest-order-token:${orderId}`, guestToken)
    }

    // Process Gateway Redirect if online payment
    if (authStore.isAuthenticated && (paymentMethod.value === 'VNPAY' || paymentMethod.value === 'MOMO')) {
      const paymentRes: any = await paymentService.create(
        orderId,
        paymentMethod.value,
        `${window.location.origin}/my-orders/${orderId}`,
      )
      const action = paymentRes.data?.data?.action || paymentRes.data?.action
      if (action?.instructions) toast.info(action.instructions, { timeout: 12000 })
      if (action?.redirectUrl) {
        window.location.assign(action.redirectUrl)
        return
      }
    }

    sessionStorage.removeItem('checkout-idempotency-key')
    refreshIdempotencyKey()
    orderSuccess.value = true
    cartStore.clearCheckedOutItems()
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || err.message || 'Đặt hàng thất bại. Vui lòng kiểm tra lại tồn kho sản phẩm.'
    orderFailed.value = true
    orderFailReason.value = errorMsg
    toast.error(errorMsg)
  } finally {
    submitting.value = false
  }
}
</script>
