<template>
  <div class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-extrabold text-slate-900 mb-8">Giỏ hàng của bạn</h1>

    <div v-if="cartStore.items.length === 0" class="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-6">
      <div class="w-20 h-20 bg-red-50 text-[#dc2626] rounded-full flex items-center justify-center mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
      </div>
      <div class="space-y-2">
        <h3 class="text-lg font-bold text-slate-800">Giỏ hàng đang trống</h3>
        <p class="text-slate-400 text-sm max-w-xs mx-auto">Hãy lấp đầy giỏ hàng bằng những sản phẩm văn phòng phẩm chất lượng.</p>
      </div>
      <router-link to="/products" class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-3 px-8 rounded-xl transition-colors inline-block text-sm">
        Tiếp tục mua sắm
      </router-link>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Items list -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Select All Header -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button
              @click="toggleSelectAll"
              class="w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all cursor-pointer"
              :class="[
                isAllSelected
                  ? 'bg-[#dc2626] border-[#dc2626] text-white'
                  : 'bg-white border-slate-300 hover:border-[#dc2626]'
              ]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="3"
                stroke="currentColor"
                class="w-3.5 h-3.5 transition-transform"
                :class="[isAllSelected ? 'scale-100' : 'scale-0']"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </button>
            <span class="text-sm font-bold text-slate-800">
              Chọn tất cả ({{ cartStore.items.length }} sản phẩm)
            </span>
          </div>
          
          <button
            v-if="isAnyItemSelected"
            @click="removeSelectedItems"
            class="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
            Xóa đã chọn
          </button>
        </div>

        <div v-for="item in cartStore.items" :key="item.product._id" class="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4">
          <!-- Checkbox -->
          <div class="flex items-center justify-center pr-1 sm:pr-2 flex-shrink-0">
            <button
              @click="cartStore.toggleItemSelection(item.product._id)"
              class="w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all cursor-pointer"
              :class="[
                item.selected !== false
                  ? 'bg-[#dc2626] border-[#dc2626] text-white'
                  : 'bg-white border-slate-300 hover:border-[#dc2626]'
              ]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="3"
                stroke="currentColor"
                class="w-3.5 h-3.5 transition-transform"
                :class="[item.selected !== false ? 'scale-100' : 'scale-0']"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </button>
          </div>
          <div class="w-20 h-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
            <img :src="item.product.images[0] || 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'" class="w-full h-full object-cover" />
          </div>
          <div class="flex-grow flex flex-col justify-between">
            <div>
              <div class="flex justify-between gap-2">
                <h3 class="text-sm font-bold text-slate-800 hover:text-[#dc2626] transition-colors line-clamp-2">
                  <router-link :to="`/products/${item.product._id}`">{{ item.product.name }}</router-link>
                </h3>
                <button @click="cartStore.removeFromCart(item.product._id)" class="text-slate-400 hover:text-red-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                </button>
              </div>
              <p class="text-xs text-slate-400 mt-1 font-semibold">SKU: {{ item.product.sku }}</p>
            </div>
            
            <div class="flex justify-between items-end mt-4">
              <!-- Price info -->
              <div class="flex items-baseline gap-2">
                <span class="text-sm font-extrabold text-[#dc2626]">
                  {{ formatCurrency(getEffectivePrice(item.product.price, item.product.discountPrice)) }}
                </span>
                <span v-if="item.product.discountPrice != null && item.product.discountPrice > 0 && item.product.discountPrice < item.product.price" class="text-xs text-slate-400 line-through">
                  {{ formatCurrency(item.product.price) }}
                </span>
              </div>

              <!-- Quantity selector -->
              <div class="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
                <button
                  @click="cartStore.updateQuantity(item.product._id, item.quantity - 1)"
                  class="w-8 h-8 flex items-center justify-center rounded text-slate-500 font-bold hover:bg-white transition-colors"
                >
                  -
                </button>
                <span class="w-10 text-center font-bold text-slate-800 text-xs">{{ item.quantity }}</span>
                <button
                  @click="cartStore.updateQuantity(item.product._id, item.quantity + 1)"
                  :disabled="item.quantity >= item.product.stock"
                  class="w-8 h-8 flex items-center justify-center rounded text-slate-500 font-bold hover:bg-white transition-colors disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pricing Summary -->
      <div class="space-y-6">
        <!-- Freeship Progress Block -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xl">🚚</span>
              <span class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Miễn phí vận chuyển</span>
            </div>
            <span class="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Đơn từ 299K</span>
          </div>
          <div class="space-y-2">
            <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                class="h-full bg-red-600 rounded-full transition-all duration-500" 
                :style="{ width: `${Math.min(100, (cartStore.subtotal / 299000) * 100)}%` }"
              ></div>
            </div>
            <p class="text-xs font-bold text-slate-500">
              <template v-if="cartStore.subtotal >= 299000">
                🎉 Đơn hàng của bạn đã được <span class="text-green-600 font-extrabold">Miễn phí vận chuyển</span>!
              </template>
              <template v-else-if="cartStore.subtotal > 0">
                Mua thêm <span class="text-red-600 font-extrabold">{{ formatCurrency(299000 - cartStore.subtotal) }}</span> để freeship.
              </template>
              <template v-else>
                Đơn hàng từ 299.000đ sẽ được miễn phí vận chuyển.
              </template>
            </p>
          </div>
        </div>

        <!-- Coupon Form -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Mã giảm giá</h3>
          <div v-if="cartStore.appliedPromotion" class="bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between items-center">
            <div class="text-xs text-green-800 font-medium">
              <p class="font-bold">Đã áp dụng: {{ cartStore.appliedPromotion.code }}</p>
              <p>Giảm {{ formatCurrency(cartStore.discountAmount) }}</p>
            </div>
            <button @click="cartStore.removeCoupon" class="text-xs font-bold text-red-600 hover:underline">Gỡ</button>
          </div>
          <form v-else @submit.prevent="handleApplyCoupon" class="flex gap-2">
            <input
              v-model="couponCode"
              type="text"
              placeholder="Nhập mã..."
              maxlength="30"
              class="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white font-mono uppercase tracking-wider"
            />
            <button type="submit" class="bg-slate-950 hover:bg-[#dc2626] text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer">
              Áp dụng
            </button>
          </form>
          <p v-if="cartStore.promoError" class="text-xs text-red-500 font-medium mt-1">{{ cartStore.promoError }}</p>

          <!-- Active Coupons List -->
          <div v-if="activePromotions.length > 0" class="pt-3 border-t border-slate-100">
            <p class="text-xs font-bold text-slate-500 mb-2">Voucher đề xuất:</p>
            <div class="space-y-2 max-h-40 overflow-y-auto pr-1">
              <div 
                v-for="promo in activePromotions" 
                :key="promo._id" 
                class="border border-dashed border-red-200 rounded-xl p-2.5 bg-red-50/10 flex justify-between items-center gap-2 hover:bg-red-50/20 transition-colors"
              >
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="bg-red-100 text-red-700 text-[10px] font-black px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">{{ promo.code }}</span>
                    <span class="text-xs font-extrabold text-slate-800">
                      {{ promo.discountType === 'PERCENT' ? `Giảm ${promo.discountValue}%` : `Giảm ${formatCurrency(promo.discountValue)}` }}
                    </span>
                  </div>
                  <p class="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{{ promo.description }}</p>
                  <p class="text-[9px] text-slate-400 mt-0.5 font-medium">Đơn tối thiểu: {{ formatCurrency(promo.minOrderValue) }}</p>
                </div>
                <button 
                  @click="applySuggestedCoupon(promo.code)"
                  :disabled="cartStore.subtotal < promo.minOrderValue"
                  class="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2.5 rounded-lg text-[10px] transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
                >
                  Dùng
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary Info -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">Tóm tắt đơn hàng</h3>
          <div class="space-y-3 text-sm font-medium">
            <div class="flex justify-between text-slate-500">
              <span>Tạm tính</span>
              <span class="text-slate-800 font-bold">{{ formatCurrency(cartStore.subtotal) }}</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>Phí vận chuyển</span>
              <span class="text-slate-800 font-bold">
                {{ cartStore.shippingFee === 0 ? 'Miễn phí' : formatCurrency(cartStore.shippingFee) }}
              </span>
            </div>
            <div v-if="cartStore.discountAmount > 0" class="flex justify-between text-red-500">
              <span>Giảm giá</span>
              <span class="font-bold">-{{ formatCurrency(cartStore.discountAmount) }}</span>
            </div>
            <div class="border-t border-slate-100 pt-3 flex justify-between text-slate-800">
              <span class="text-base font-extrabold">Tổng tiền</span>
              <span class="text-lg font-black text-[#dc2626]">{{ formatCurrency(cartStore.total) }}</span>
            </div>
          </div>

          <button
            @click="proceedToCheckout"
            :class="[
              'w-full font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-md cursor-pointer',
              isAnyItemSelected ? 'bg-[#dc2626] hover:bg-[#b91c1c] text-white shadow-red-500/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            ]"
            :disabled="!isAnyItemSelected"
          >
            Tiến hành thanh toán
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useCartStore } from '@/stores/cart'
import { formatCurrency, getEffectivePrice } from '@/utils/helpers'
import { promotionService } from '@/services/promotion.service'
import type { Promotion } from '@/types'
import { useSeoMeta } from '@/composables/useSeoMeta'

useSeoMeta({
  title: 'Giỏ hàng',
  description: 'Xem và quản lý giỏ hàng của bạn tại Trường Thành Stationery.',
})

const cartStore = useCartStore()
const toast = useToast()
const router = useRouter()
const couponCode = ref('')
const activePromotions = ref<Promotion[]>([])

const isAnyItemSelected = computed(() => cartStore.items.some(item => item.selected !== false))
const isAllSelected = computed(() => cartStore.items.every(item => item.selected !== false))

function toggleSelectAll() {
  cartStore.toggleAllSelection(!isAllSelected.value)
}

function removeSelectedItems() {
  if (confirm('Bạn có chắc chắn muốn xóa các sản phẩm đã chọn khỏi giỏ hàng?')) {
    const selectedIds = cartStore.items
      .filter(item => item.selected !== false)
      .map(item => item.product._id)
    
    selectedIds.forEach(id => {
      cartStore.removeFromCart(id)
    })
    toast.success('Đã xóa các sản phẩm đã chọn')
  }
}

function proceedToCheckout() {
  if (isAnyItemSelected.value) {
    router.push('/checkout')
  }
}

async function handleApplyCoupon() {
  if (!couponCode.value.trim()) return
  const success = await cartStore.applyCoupon(couponCode.value.trim().toUpperCase())
  if (success) {
    toast.success('Áp dụng mã giảm giá thành công!')
    couponCode.value = ''
  } else {
    toast.error(cartStore.promoError || 'Mã giảm giá không hợp lệ')
  }
}

async function applySuggestedCoupon(code: string) {
  const success = await cartStore.applyCoupon(code)
  if (success) {
    toast.success('Áp dụng mã giảm giá thành công!')
  } else {
    toast.error(cartStore.promoError || 'Mã giảm giá không hợp lệ')
  }
}

onMounted(async () => {
  try {
    const res = await promotionService.getActive()
    activePromotions.value = res.data || []
  } catch (err) {
    console.error('Failed to load active promotions:', err)
  }
})
</script>
