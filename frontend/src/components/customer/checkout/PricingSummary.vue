<template>
  <div class="border-t border-slate-100 pt-4 space-y-2.5 text-xs font-medium">
    <!-- Bảng Minh Bạch Chi Phí Đơn Hàng (FE-06 Transparency Table) -->
    <!-- Server warning messages if prices or stock adjusted -->
    <div v-if="cartStore.warnings.length" class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
      <div class="font-bold flex items-center gap-1">
        <span>⚠️</span>
        <span>Thông báo cập nhật từ hệ thống:</span>
      </div>
      <p v-for="(warn, idx) in cartStore.warnings" :key="idx" class="text-[11px] leading-relaxed">
        • {{ warn }}
      </p>
    </div>

    <!-- Preview failed: the last good numbers stay visible, but ordering is blocked -->
    <div v-if="cartStore.pricingError" class="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium flex items-center justify-between gap-2" data-testid="checkout-pricing-error">
      <span>{{ cartStore.pricingError }}</span>
      <button type="button" class="font-bold hover:underline cursor-pointer whitespace-nowrap" @click="emit('retry')">Thử lại</button>
    </div>

    <SkeletonLoader v-if="!cartStore.pricing && cartStore.pricingLoading" type="lines" :count="4" data-testid="checkout-pricing-skeleton" />

    <template v-else-if="cartStore.pricing">
      <div class="flex justify-between text-slate-600">
        <span>Tiền hàng</span>
        <span class="text-slate-800 font-bold" data-testid="checkout-subtotal">{{ formatCurrency(cartStore.subtotal) }}</span>
      </div>

      <div class="flex justify-between text-slate-600 items-center">
        <span>Phí vận chuyển</span>
        <div class="text-right">
          <span v-if="cartStore.shippingFee === 0" class="font-bold text-green-600 flex items-center gap-1">
            <span v-if="cartStore.standardShippingFee" class="line-through text-slate-400 font-normal">{{ formatCurrency(cartStore.standardShippingFee) }}</span>
            <span>Miễn phí</span>
          </span>
          <span v-else class="text-slate-800 font-bold" data-testid="checkout-shipping-fee">
            {{ formatCurrency(cartStore.shippingFee) }}
          </span>
        </div>
      </div>

      <div v-if="cartStore.discountAmount > 0" class="flex justify-between text-red-600">
        <span class="flex items-center gap-1">
          <span>Voucher giảm giá</span>
          <span class="font-mono font-bold bg-red-50 px-1 py-0.2 rounded border border-red-200 text-[10px]">{{ cartStore.appliedPromotion?.code }}</span>
        </span>
        <span class="font-bold">-{{ formatCurrency(cartStore.discountAmount) }}</span>
      </div>

      <div v-if="cartStore.loyaltyDiscount > 0" class="flex justify-between text-amber-600">
        <span>Điểm thưởng<template v-if="cartStore.loyalty?.appliedPoints"> ({{ cartStore.loyalty.appliedPoints.toLocaleString() }} điểm)</template></span>
        <span class="font-bold">-{{ formatCurrency(cartStore.loyaltyDiscount) }}</span>
      </div>

      <div class="border-t border-slate-200 pt-3 flex justify-between items-baseline text-slate-900">
        <div>
          <span class="text-sm font-black block">Tổng thanh toán cuối cùng</span>
          <span class="text-[10px] text-slate-400 font-normal">
            {{ cartStore.pricingLoading ? 'Đang cập nhật giá...' : 'Đã bao gồm VAT, không phí ẩn' }}
          </span>
        </div>
        <span class="text-xl font-black text-[#dc2626]" :class="{ 'opacity-50': cartStore.pricingLoading }" data-testid="checkout-total">{{ formatCurrency(cartStore.total) }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { formatCurrency } from '@/utils/helpers'
import SkeletonLoader from '@/components/SkeletonLoader.vue'

/**
 * Checkout cost breakdown. Every number is the server checkout-preview held by the cart store;
 * nothing is added up on the client. `retry` asks the page to re-run the preview.
 */
const emit = defineEmits<{
  retry: []
}>()

const cartStore = useCartStore()
</script>
