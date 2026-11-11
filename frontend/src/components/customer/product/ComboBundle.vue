<template>
  <!-- Combo Bundle List -->
  <div v-if="items.length > 0 && items.length <= MAX_COMBO_ITEMS && category && category.comboPrice" class="border-2 border-[#dc2626]/20 rounded-2xl p-5 bg-[#dc2626]/5 space-y-4">
    <h3 class="text-sm font-black text-slate-800 tracking-wide flex items-center gap-1.5">
      <span class="text-[#dc2626]">🎁</span> Các sản phẩm đi kèm trong Combo:
    </h3>

    <div class="space-y-3">
      <div v-for="item in visibleItems" :key="item._id" class="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-100 shadow-xs">
        <img
          :src="item.images && item.images[0] ? item.images[0] : FALLBACK_THUMBNAIL"
          class="w-12 h-12 object-cover rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0"
          :alt="item.name"
          loading="lazy"
        />
        <div class="min-w-0 flex-1">
          <div class="text-xs font-bold text-slate-800 truncate">{{ item.name }}</div>
          <div class="text-[10px] text-slate-400 font-medium">Thương hiệu: {{ item.brand || 'Khác' }}</div>
        </div>
        <div class="text-right">
          <div class="text-xs font-black text-slate-900">{{ formatCurrency(item.discountPrice || item.price) }}</div>
          <div v-if="hasRealDiscount(item)" class="text-[9px] text-slate-400 line-through">{{ formatCurrency(item.price) }}</div>
        </div>
      </div>
    </div>

    <!-- Expand/Collapse Toggle Button -->
    <div v-if="items.length > COLLAPSED_COUNT" class="flex justify-center pt-1 border-t border-slate-100/50">
      <button
        type="button"
        class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold text-[#dc2626] hover:bg-[#dc2626]/5 active:scale-95 transition-all cursor-pointer focus:outline-none"
        @click="showAll = !showAll"
      >
        <span>{{ showAll ? 'Thu gọn danh sách' : `Xem thêm ${items.length - COLLAPSED_COUNT} sản phẩm` }}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2.5"
          stroke="currentColor"
          class="w-3.5 h-3.5 transition-transform duration-300"
          :class="{ 'rotate-180': showAll }"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
    </div>

    <div class="pt-3 border-t border-dashed border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
      <div class="font-medium text-slate-600">
        Tổng giá bán lẻ: <span :class="[comboSavings > 0 ? 'line-through text-slate-400' : 'text-slate-700', 'font-bold']">{{ formatCurrency(comboRetailTotal) }}</span>
      </div>
      <!-- Chỉ hiện "Tiết kiệm" khi combo thực sự rẻ hơn (tránh "Tiết kiệm 0 đ (-0%)") -->
      <div v-if="comboSavings > 0" class="bg-[#dc2626] text-white font-extrabold px-3 py-1 rounded-full text-[10px] tracking-wide uppercase">
        Tiết kiệm {{ formatCurrency(comboSavings) }} (-{{ comboSavingsPercent }}%)
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatCurrency } from '@/utils/helpers'
import type { Product, Category } from '@/types'

const props = defineProps<{
  /** The combo product being viewed (its price is the combo price). */
  product: Product
  /** Category detail carrying the combo member list and comboPrice. */
  category: Category | null
}>()

const MAX_COMBO_ITEMS = 10
const COLLAPSED_COUNT = 5
const FALLBACK_THUMBNAIL = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=100'

const showAll = ref(false)

const items = computed<Product[]>(() => props.category?.products || [])
const visibleItems = computed(() => (showAll.value ? items.value : items.value.slice(0, COLLAPSED_COUNT)))

function hasRealDiscount(item: Product): boolean {
  return !!item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.price
}

// Display-only figures for the bundle summary (unchanged from the original page; checkout prices come from the backend)
const comboRetailTotal = computed(() => {
  if (!items.value.length || !props.category?.comboPrice) return 0
  return items.value.reduce((sum: number, p: any) => sum + (p.discountPrice || p.price || 0), 0)
})

const comboSavings = computed(() => {
  if (comboRetailTotal.value === 0) return 0
  const comboPrice = props.product.discountPrice || props.product.price
  return Math.max(0, comboRetailTotal.value - comboPrice)
})

const comboSavingsPercent = computed(() => {
  if (comboRetailTotal.value === 0 || comboSavings.value === 0) return 0
  return Math.round((comboSavings.value / comboRetailTotal.value) * 100)
})
</script>
