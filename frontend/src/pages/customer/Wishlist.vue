<template>
  <div class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[60vh]">
    <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white mb-8">
      {{ $t('nav.wishlist') }}
    </h1>

    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div v-for="n in 4" :key="n" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 animate-pulse h-80">
        <div class="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl mb-4"></div>
        <div class="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
      </div>
    </div>

    <div v-else-if="products.length === 0" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center max-w-xl mx-auto space-y-6">
      <div class="w-20 h-20 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl">
        ❤️
      </div>
      <div class="space-y-2">
        <h2 class="text-xl font-extrabold text-slate-800 dark:text-white">Chưa có sản phẩm yêu thích</h2>
        <p class="text-slate-500 dark:text-slate-400 text-sm">
          Hãy thả tim những sản phẩm bạn thích để lưu lại và tìm kiếm dễ dàng hơn khi cần nhé.
        </p>
      </div>
      <router-link to="/products" class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-3 px-8 rounded-xl transition-colors inline-block text-sm">
        Khám phá sản phẩm
      </router-link>
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      <ProductCard 
        v-for="prod in products" 
        :key="prod._id" 
        :product="prod" 
        @add-to-cart="handleAddToCart"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userService } from '@/services/user.service'
import { useCartStore } from '@/stores/cart'
import ProductCard from '@/components/ProductCard.vue'
import type { Product } from '@/types'
import { useToast } from 'vue-toastification'

const cartStore = useCartStore()
const toast = useToast()
const products = ref<Product[]>([])
const loading = ref(true)

async function fetchWishlist() {
  loading.value = true
  try {
    const res = await userService.getWishlist()
    products.value = res.data?.data || res.data || []
  } catch (err) {
    console.error('Failed to fetch wishlist:', err)
  } finally {
    loading.value = false
  }
}

function handleAddToCart(product: Product) {
  cartStore.addToCart(product, 1)
  toast.success(`Đã thêm ${product.name} vào giỏ hàng!`)
}

onMounted(() => {
  fetchWishlist()
})
</script>
