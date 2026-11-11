<template>
  <!-- Meta and Actions -->
  <div class="space-y-6">
    <div class="space-y-2">
      <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <span>Thương hiệu: {{ product.brand || 'Khác' }}</span>
        <span>•</span>
        <span>Mã SKU: {{ product.sku }}</span>
      </div>
      <div class="flex items-start justify-between gap-4">
        <h1 class="text-2xl md:text-3xl font-black text-slate-900 leading-tight flex-1">
          {{ product.name }}
        </h1>
        <button
          class="w-10 h-10 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-500 hover:text-red-500 hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer flex-shrink-0"
          :title="isWishlisted ? 'Xóa khỏi danh sách yêu thích' : 'Lưu sản phẩm yêu thích'"
          @click="onWishlistToggle"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            :fill="isWishlisted ? '#dc2626' : 'none'"
            viewBox="0 0 24 24"
            stroke-width="2"
            :stroke="isWishlisted ? '#dc2626' : 'currentColor'"
            class="w-5 h-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
            />
          </svg>
        </button>
      </div>
      <div class="flex items-center gap-4 text-sm mt-2">
        <div v-if="reviewCount > 0" class="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-lg">
          <span class="font-bold text-yellow-700">{{ averageRating }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-yellow-500">
            <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
          </svg>
        </div>
        <span class="text-slate-400">|</span>
        <span class="text-slate-500 font-medium">Đã bán {{ product.sold }}</span>
        <span class="text-slate-400">|</span>
        <span :class="[product.stock > 0 ? 'text-green-600' : 'text-red-600', 'font-semibold']">
          {{ product.stock > 0 ? `Còn hàng (${product.stock} ${product.unit || 'cái'})` : 'Hết hàng' }}
        </span>
      </div>
    </div>

    <!-- Price Block -->
    <div class="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between">
      <div class="space-y-1">
        <!-- Giá gạch + "Tiết kiệm" chỉ khi có giảm giá thật (0 < discountPrice < price) -->
        <template v-if="hasRealDiscount">
          <div class="flex items-baseline gap-3 flex-wrap">
            <span class="text-3xl font-black text-[#dc2626]">{{ formatCurrency(product.discountPrice) }}</span>
            <span class="text-slate-400 line-through text-sm font-medium">{{ formatCurrency(product.price) }}</span>
            <span v-if="product.unit" class="text-sm font-semibold text-slate-500">/ {{ product.unit }}</span>
          </div>
          <p class="text-xs text-red-500 font-bold">
            Tiết kiệm {{ formatCurrency(product.price - product.discountPrice) }} (-{{ getDiscountPercent(product.price, product.discountPrice) }}%)
          </p>
        </template>
        <template v-else>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-slate-800">{{ formatCurrency(product.price) }}</span>
            <span v-if="product.unit" class="text-sm font-semibold text-slate-500">/ {{ product.unit }}</span>
          </div>
        </template>
      </div>
    </div>

    <ComboBundle :product="product" :category="categoryDetail" />

    <!-- Quantity Selector -->
    <div class="space-y-3">
      <span class="text-sm font-bold text-slate-700">
        Số lượng <span v-if="product.unit" class="text-xs text-slate-400 font-normal">({{ product.unit }})</span>
      </span>
      <div class="flex items-center gap-3">
        <div class="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
          <button
            :disabled="quantity <= 1"
            class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white text-slate-500 font-bold transition-colors disabled:opacity-50"
            @click="changeQuantity(-1)"
          >
            -
          </button>
          <input
            v-model.number="quantity"
            type="number"
            min="1"
            :max="product.stock"
            class="w-14 text-center bg-transparent border-none focus:outline-none font-bold text-slate-800 text-sm"
            @change="validateQuantity"
          />
          <button
            :disabled="quantity >= product.stock"
            class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white text-slate-500 font-bold transition-colors disabled:opacity-50"
            @click="changeQuantity(1)"
          >
            +
          </button>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-4 pt-4">
      <button
        :disabled="isAddingToCart || product.stock === 0"
        class="flex-1 bg-white hover:bg-slate-50 text-[#dc2626] border-2 border-[#dc2626] font-bold py-3.5 px-4 rounded-2xl transition-colors flex items-center justify-center gap-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-300 disabled:cursor-not-allowed text-sm uppercase tracking-wider cursor-pointer"
        @click="addToCart()"
      >
        <svg v-if="isAddingToCart" class="animate-spin h-5 w-5 text-[#dc2626]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
        <span>{{ isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng' }}</span>
      </button>
      <button
        :disabled="isBuyingNow || product.stock === 0"
        class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed text-sm uppercase tracking-wider cursor-pointer"
        @click="buyNow()"
      >
        <svg v-if="isBuyingNow" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{{ isBuyingNow ? 'Đang xử lý...' : (categoryDetail && categoryDetail.comboPrice ? 'Mua trọn bộ Combo' : 'Mua ngay') }}</span>
      </button>
    </div>

    <!-- Back in Stock Alert Subscription -->
    <div v-if="product.stock === 0" class="border border-amber-200 rounded-2xl p-5 bg-amber-50/40 space-y-3 shadow-xs">
      <div class="flex items-center gap-2 text-amber-700 text-xs font-black uppercase tracking-wider">
        <span>🔔</span> Nhận thông báo khi có hàng
      </div>
      <p class="text-xs text-slate-500 leading-relaxed font-medium">
        Sản phẩm này hiện tại đang tạm hết hàng. Vui lòng để lại email của bạn, chúng tôi sẽ tự động gửi thư thông báo ngay khi có hàng trở lại!
      </p>
      <form class="flex gap-2" @submit.prevent="handleStockAlertSubscribe">
        <input
          v-model="stockAlertEmail"
          type="email"
          placeholder="Nhập email nhận thông báo..."
          class="flex-grow bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626]/80 text-slate-700 font-bold"
          required
        />
        <button
          type="submit"
          :disabled="isSubscribingAlert"
          class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm flex-shrink-0 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <svg v-if="isSubscribingAlert" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ isSubscribingAlert ? 'Đang đăng ký...' : 'Đăng ký' }}</span>
        </button>
      </form>
    </div>

    <!-- Share buttons -->
    <div class="border border-slate-200 rounded-2xl p-5 bg-white space-y-3 shadow-xs">
      <h3 class="text-xs font-black text-slate-800 uppercase tracking-wider">
        Chia sẻ sản phẩm
      </h3>
      <div class="flex flex-wrap gap-2.5">
        <button
          class="bg-[#1877F2] text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95 transition-all"
          @click="shareOnFacebook"
        >
          <span>📘</span> Facebook
        </button>
        <button
          class="bg-[#0068ff] text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95 transition-all"
          @click="shareOnZalo"
        >
          <span>💬</span> Zalo
        </button>
        <button
          class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          @click="copyProductLink"
        >
          <span>🔗</span> Sao chép link
        </button>
      </div>
    </div>

    <!-- Chính sách ưu đãi của Trường Thành -->
    <div class="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 shadow-xs">
      <h3 class="text-sm font-extrabold text-slate-800 tracking-wide">
        Chính sách ưu đãi của Trường Thành
      </h3>
      <div class="divide-y divide-slate-100">
        <button
          v-for="item in POLICY_LINKS"
          :key="item.key"
          class="w-full flex items-center justify-between py-3 text-left hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors group focus:outline-none"
          @click="emit('open-policy', item.key)"
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" :d="item.iconPath" />
              </svg>
            </div>
            <div class="text-sm">
              <span class="font-bold text-slate-700">{{ item.label }} </span>
              <span class="text-slate-600">{{ item.summary }}</span>
            </div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { productService } from '@/services/product.service'
import { formatCurrency, getDiscountPercent } from '@/utils/helpers'
import type { Product, Category } from '@/types'
import ComboBundle from './ComboBundle.vue'
import type { PolicyKey } from './PolicyModal.vue'

const props = defineProps<{
  product: Product
  /** Category detail (combo info); null until it has loaded. */
  categoryDetail: Category | null
  /** Backend rating summary for the header badge. */
  averageRating: number
  reviewCount: number
}>()

const emit = defineEmits<{
  (e: 'open-policy', policy: PolicyKey): void
}>()

const POLICY_LINKS: ReadonlyArray<{ key: PolicyKey; label: string; summary: string; iconPath: string }> = [
  {
    key: 'delivery',
    label: 'Thời gian giao hàng:',
    summary: 'Giao nhanh và uy tín',
    iconPath: 'M8.25 18.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM19.5 18.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m-7.487-9h-1.11a2 2 0 0 0-1.872 1.302l-.994 2.98a2 2 0 0 0-1.872 1.302v4.416a.75.75 0 0 0 .75.75h.588M19.5 12h-3.076M19.5 12V9.382a2 2 0 0 0-1.106-1.79l-2.472-1.236A2 2 0 0 0 15 6.223V12m4.5 0v3.75m-4.5-3.75h-3m3 3.75h-3.076',
  },
  {
    key: 'return',
    label: 'Chính sách đổi trả:',
    summary: 'Đổi trả miễn phí toàn quốc',
    iconPath: 'M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z',
  },
  {
    key: 'wholesale',
    label: 'Chính sách khách sỉ:',
    summary: 'Ưu đãi khi mua số lượng lớn',
    iconPath: 'M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.015a2.993 2.993 0 0 0 2.25 1.015c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z',
  },
]

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const toast = useToast()

const hasRealDiscount = computed(
  () => props.product.discountPrice > 0 && props.product.discountPrice < props.product.price,
)

// ─── Quantity ───────────────────────────────────────────────────────────────
const quantity = ref(1)

function changeQuantity(val: number) {
  const newQty = quantity.value + val
  if (newQty >= 1 && newQty <= props.product.stock) {
    quantity.value = newQty
  }
}

function validateQuantity() {
  if (quantity.value < 1) quantity.value = 1
  if (quantity.value > props.product.stock) quantity.value = props.product.stock
}

// ─── Cart / buy now ─────────────────────────────────────────────────────────
const isAddingToCart = ref(false)
const isBuyingNow = ref(false)

function addToCart() {
  if (isAddingToCart.value) return
  isAddingToCart.value = true
  try {
    cartStore.addToCart(props.product, quantity.value)
    toast.success(`Đã thêm ${quantity.value} "${props.product.name}" vào giỏ hàng`)
  } finally {
    setTimeout(() => {
      isAddingToCart.value = false
    }, 500)
  }
}

function buyNow() {
  if (isBuyingNow.value) return
  if (props.product.stock === 0) return
  isBuyingNow.value = true
  try {
    cartStore.addToCart(props.product, quantity.value)
    router.push('/checkout')
  } finally {
    setTimeout(() => {
      isBuyingNow.value = false
    }, 500)
  }
}

// ─── Wishlist ───────────────────────────────────────────────────────────────
const isWishlisted = computed(() => {
  if (!authStore.isAuthenticated || !authStore.user?.wishlist) return false
  return authStore.user.wishlist.includes(props.product._id)
})

async function onWishlistToggle() {
  if (!authStore.isAuthenticated) {
    toast.info('Vui lòng đăng nhập để lưu sản phẩm yêu thích!')
    return
  }
  const success = await authStore.toggleWishlist(props.product._id)
  if (success) {
    if (isWishlisted.value) {
      toast.success('Đã thêm vào danh sách yêu thích!')
    } else {
      toast.success('Đã xóa khỏi danh sách yêu thích!')
    }
  }
}

// ─── Sharing ────────────────────────────────────────────────────────────────
function shareOnFacebook() {
  const url = encodeURIComponent(window.location.href)
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
}

function shareOnZalo() {
  const url = encodeURIComponent(window.location.href)
  window.open(`https://zalo.me/share?to=&utm_source=&utm_medium=&utm_campaign=&url=${url}`, '_blank')
}

function copyProductLink() {
  navigator.clipboard.writeText(window.location.href)
  toast.success('Đã sao chép liên kết sản phẩm!')
}

// ─── Back-in-stock alert ────────────────────────────────────────────────────
const stockAlertEmail = ref(authStore.user?.email || '')
const isSubscribingAlert = ref(false)

async function handleStockAlertSubscribe() {
  if (isSubscribingAlert.value) return
  isSubscribingAlert.value = true
  try {
    await productService.subscribeStockAlert(props.product._id, stockAlertEmail.value)
    toast.success('Đăng ký nhận thông báo thành công!')
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký nhận thông báo.')
  } finally {
    isSubscribingAlert.value = false
  }
}
</script>
