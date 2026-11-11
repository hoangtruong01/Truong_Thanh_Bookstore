<template>
  <div class="border-t border-slate-100 pt-4 space-y-3">
    <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Mã giảm giá (Voucher)</h4>

    <div v-if="cartStore.appliedPromotion" class="bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between items-center">
      <div class="text-xs text-green-800 font-medium">
        <p class="font-bold">Đã áp dụng: {{ cartStore.appliedPromotion.code }}</p>
        <p>Giảm {{ formatCurrency(cartStore.discountAmount) }}</p>
      </div>
      <button class="text-xs font-bold text-red-600 hover:underline" @click="cartStore.removeCoupon()">Gỡ</button>
    </div>

    <div v-else class="flex gap-2">
      <input
        v-model="code"
        type="text"
        placeholder="Nhập mã giảm giá..."
        maxlength="30"
        class="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white font-mono uppercase tracking-wider"
      />
      <button
        type="button"
        :disabled="applying || !code.trim()"
        class="bg-slate-950 hover:bg-[#dc2626] text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        @click="emit('apply')"
      >
        <svg v-if="applying" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{{ applying ? 'Đang áp dụng...' : 'Áp dụng' }}</span>
      </button>
    </div>
    <p v-if="cartStore.promoError" class="text-[10px] text-red-500 font-medium mt-1">{{ cartStore.promoError }}</p>

    <!-- Collapsible Suggestive Vouchers list -->
    <div v-if="promotions.length > 0" class="mt-2">
      <button
        class="text-xs font-bold text-[#dc2626] hover:text-[#b91c1c] flex items-center gap-1.5 focus:outline-none cursor-pointer"
        @click="expanded = !expanded"
      >
        <span>{{ expanded ? 'Ẩn danh sách Voucher' : 'Xem Voucher khả dụng' }}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2.5"
          stroke="currentColor"
          class="w-3.5 h-3.5 transition-transform duration-200"
          :class="{'rotate-180': expanded}"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <div v-if="expanded" class="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">
        <div
          v-for="promo in promotions"
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
            type="button"
            :disabled="applying || cartStore.subtotal < promo.minOrderValue"
            class="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2.5 rounded-lg text-[10px] transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
            @click="emit('apply-suggested', promo.code)"
          >
            <svg v-if="applying" class="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Dùng</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { formatCurrency } from '@/utils/helpers'
import type { Promotion } from '@/types'

/**
 * Checkout voucher block. Applied code, discount, error and subtotal are read from the cart
 * store (server preview); the page owns the typed code / list state and runs useCoupon.
 */
defineProps<{
  promotions: Promotion[]
  applying: boolean
}>()

const emit = defineEmits<{
  apply: []
  'apply-suggested': [code: string]
}>()

const code = defineModel<string>('code', { default: '' })
const expanded = defineModel<boolean>('expanded', { default: false })

const cartStore = useCartStore()
</script>
