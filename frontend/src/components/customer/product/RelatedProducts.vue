<template>
  <!-- Recommended / Related Products -->
  <section v-if="products.length > 0" class="overflow-hidden border border-emerald-200/60 rounded-3xl shadow-xs">
    <!-- Header Banner -->
    <div class="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-8 py-5 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-white animate-pulse">
          <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
        </svg>
        <h2 class="text-lg font-black text-white uppercase tracking-wider">Sản phẩm liên quan & Gợi ý cho bạn</h2>
      </div>
      <router-link
        :to="viewAllLink"
        class="text-xs font-bold text-white/90 hover:text-white underline hover:no-underline"
      >
        Xem tất cả →
      </router-link>
    </div>

    <!-- Content Grid -->
    <div class="bg-emerald-50/5 p-6 md:p-8">
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <ProductCard
          v-for="related in products"
          :key="related._id"
          :product="related"
          @add-to-cart="emit('add-to-cart', $event)"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProductCard from '@/components/ProductCard.vue'
import type { Product, Category } from '@/types'

const props = defineProps<{
  products: Product[]
  /** Category of the product being viewed, used for the "Xem tất cả" link. */
  category?: Category | string | null
}>()

const emit = defineEmits<{
  (e: 'add-to-cart', product: Product): void
}>()

const viewAllLink = computed(() => {
  const cat = props.category
  if (!cat) return '/products'
  return `/products?category=${typeof cat === 'object' ? cat._id : cat}`
})
</script>
