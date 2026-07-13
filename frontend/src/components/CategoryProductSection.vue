<template>
  <section class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8">
    <div class="reveal flex items-end justify-between border-b border-slate-100 pb-4">
      <div class="text-left">
        <span class="text-xs font-bold text-rose-600 tracking-[0.2em] uppercase font-black">
          {{ subtitle }}
        </span>
        <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
          ✨ {{ title }}
        </h2>
      </div>
      <router-link
        :to="viewAllLink"
        class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group"
      >
        <span>Xem tất cả</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </router-link>
    </div>

    <!-- Skeleton loader -->
    <div v-if="loading" class="responsive-flex-grid">
      <div
        v-for="n in 5"
        :key="n"
        class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse"
      >
        <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
        <div class="h-4 bg-slate-200 rounded w-2/3"></div>
        <div class="h-6 bg-slate-200 rounded w-1/3"></div>
      </div>
    </div>

    <!-- Products grid -->
    <div v-else class="responsive-flex-grid">
      <ProductCard
        v-for="(prod, idx) in products.slice(0, 10)"
        :key="prod._id"
        :product="prod"
        :class="['reveal-scale', `delay-${(idx % 5) * 100}`]"
        @add-to-cart="$emit('add-to-cart', $event)"
      />
    </div>

    <!-- View More button -->
    <div class="flex justify-center pt-6">
      <router-link
        :to="viewAllLink"
        class="border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
      >
        {{ buttonLabel }}
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
import ProductCard from '@/components/ProductCard.vue'
import type { Product } from '@/types'

defineProps<{
  title: string
  subtitle: string
  products: Product[]
  loading: boolean
  viewAllLink: string
  buttonLabel: string
}>()

defineEmits<{
  'add-to-cart': [product: Product]
}>()
</script>
