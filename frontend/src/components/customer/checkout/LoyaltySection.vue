<template>
  <div class="border-t border-slate-100 pt-4 space-y-3" data-testid="checkout-loyalty">
    <!-- Balance, limits and errors come from preview.loyalty (server), not from the cached profile -->
    <div class="flex justify-between items-center">
      <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-amber-500"></span>
        <span>Điểm thưởng tích lũy</span>
      </h4>
      <span class="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
        Có: {{ loyalty.availablePoints.toLocaleString() }} điểm
      </span>
    </div>

    <div v-if="loyalty.availablePoints < loyalty.minRedeemPoints" class="text-[11px] text-slate-400 font-medium">
      Bạn cần tối thiểu {{ loyalty.minRedeemPoints.toLocaleString() }} điểm để quy đổi (hiện có {{ loyalty.availablePoints.toLocaleString() }} điểm).
    </div>

    <div v-else-if="!loyalty.canRedeem" class="text-[11px] text-slate-400 font-medium">
      Đơn hàng từ {{ formatCurrency(loyalty.minSubtotalToRedeem) }} mới có thể dùng điểm (tối đa {{ loyalty.maxRedeemPercent }}% giá trị đơn).
    </div>

    <div v-else class="space-y-2">
      <div class="flex gap-2">
        <input
          v-model.number="points"
          type="number"
          min="0"
          :max="loyalty.maxRedeemablePoints"
          step="100"
          :placeholder="`Nhập số điểm muốn tiêu (tối thiểu ${loyalty.minRedeemPoints.toLocaleString()})...`"
          class="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-semibold"
        />
        <button
          type="button"
          class="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer whitespace-nowrap"
          @click="applyMaxPoints"
        >
          Tối đa
        </button>
      </div>
      <p class="text-[10px] text-slate-500">
        1 điểm = {{ loyalty.pointValue.toLocaleString() }} VNĐ. Tối đa {{ loyalty.maxRedeemPercent }}% giá trị đơn (tối đa {{ loyalty.maxRedeemablePoints.toLocaleString() }} điểm = {{ formatCurrency(loyalty.maxRedeemablePoints * loyalty.pointValue) }}).
      </p>
      <p v-if="error" class="text-[10px] text-red-500 font-medium">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'vue-toastification'
import { formatCurrency } from '@/utils/helpers'
import type { CheckoutPreviewLoyalty } from '@/types'

/**
 * PRODUCT-01: loyalty point redemption. `loyalty` is preview.loyalty from the server; the page
 * owns the typed points (v-model:points), validates them and sends them to the preview.
 */
const props = defineProps<{
  loyalty: CheckoutPreviewLoyalty
  error: string
}>()

const points = defineModel<number | null>('points', { default: null })

const toast = useToast()

function applyMaxPoints() {
  if (props.loyalty.canRedeem && props.loyalty.maxRedeemablePoints > 0) {
    points.value = props.loyalty.maxRedeemablePoints
  } else {
    toast.info('Đơn hàng hiện tại hoặc số dư điểm chưa đủ điều kiện quy đổi')
  }
}
</script>
