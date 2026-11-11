<template>
  <div class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-2 shadow-xs">
    <span class="text-xs font-black text-slate-500 uppercase tracking-wider mr-1">Bộ lọc:</span>

    <!-- Category Tag -->
    <span v-if="categoryName" class="inline-flex items-center gap-1 bg-red-50 text-[#dc2626] text-xs font-bold px-2.5 py-1 rounded-lg border border-red-200/60">
      Danh mục: {{ categoryName }}
      <button class="hover:text-red-800 ml-0.5 cursor-pointer" @click="emit('clear-category')">✕</button>
    </span>

    <!-- Search Query Tag -->
    <span v-if="searchQuery" class="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200">
      Từ khóa: "{{ searchQuery }}"
      <button class="hover:text-red-600 ml-0.5 cursor-pointer" @click="emit('clear-search')">✕</button>
    </span>

    <!-- Price Tag -->
    <span v-if="minPrice || maxPrice" class="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200">
      Giá: {{ priceRangeText }}
      <button class="hover:text-red-600 ml-0.5 cursor-pointer" @click="emit('clear-price')">✕</button>
    </span>

    <!-- Brand Tags -->
    <span v-for="br in brands" :key="br" class="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200">
      Thương hiệu: {{ br }}
      <button class="hover:text-red-600 ml-0.5 cursor-pointer" @click="emit('remove-brand', br)">✕</button>
    </span>

    <!-- Author Tags -->
    <span v-for="au in authors" :key="au" class="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200">
      Tác giả: {{ au }}
      <button class="hover:text-red-600 ml-0.5 cursor-pointer" @click="emit('remove-author', au)">✕</button>
    </span>

    <!-- Publisher Tags -->
    <span v-for="pub in publishers" :key="pub" class="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200">
      NXB: {{ pub }}
      <button class="hover:text-red-600 ml-0.5 cursor-pointer" @click="emit('remove-publisher', pub)">✕</button>
    </span>

    <!-- Rating Tag -->
    <span v-if="rating" class="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200">
      ⭐ ≥ {{ rating }} sao
      <button class="hover:text-red-600 ml-0.5 cursor-pointer" @click="emit('clear-rating')">✕</button>
    </span>

    <!-- Stock Tag -->
    <span v-if="onlyInStock" class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-200">
      Còn hàng
      <button class="hover:text-emerald-900 ml-0.5 cursor-pointer" @click="emit('clear-stock')">✕</button>
    </span>

    <!-- Deals Tag -->
    <span v-if="discounted" class="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-orange-200">
      Đang giảm giá
      <button class="hover:text-orange-900 ml-0.5 cursor-pointer" @click="emit('clear-discount')">✕</button>
    </span>

    <!-- Clear All Button -->
    <button
      class="text-xs font-extrabold text-[#dc2626] hover:underline ml-auto cursor-pointer"
      @click="emit('clear-all')"
    >
      Xóa tất cả bộ lọc
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/** Toolbar of the active product-list filters; each chip asks the page to clear its filter. */
const props = defineProps<{
  categoryName: string
  searchQuery: string
  minPrice: number | null
  maxPrice: number | null
  brands: string[]
  authors: string[]
  publishers: string[]
  rating: number | null
  onlyInStock: boolean
  discounted: boolean
}>()

const emit = defineEmits<{
  'clear-category': []
  'clear-search': []
  'clear-price': []
  'remove-brand': [brand: string]
  'remove-author': [author: string]
  'remove-publisher': [publisher: string]
  'clear-rating': []
  'clear-stock': []
  'clear-discount': []
  'clear-all': []
}>()

const priceRangeText = computed(() => {
  const { minPrice, maxPrice } = props
  if (minPrice && maxPrice) {
    return `${minPrice.toLocaleString()}đ - ${maxPrice.toLocaleString()}đ`
  }
  if (minPrice) {
    return `Từ ${minPrice.toLocaleString()}đ`
  }
  if (maxPrice) {
    return `Dưới ${maxPrice.toLocaleString()}đ`
  }
  return ''
})
</script>
