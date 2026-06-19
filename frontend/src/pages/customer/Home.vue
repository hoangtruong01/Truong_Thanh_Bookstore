<template>
  <div class="space-y-12 pb-16">
    <!-- Hero Banner -->
    <div class="relative bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white py-20 px-8 md:px-16 overflow-hidden">
      <!-- Background pattern -->
      <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
      
      <div class="relative max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-12">
        <div class="space-y-6 text-center md:text-left">
          <span class="bg-blue-600/35 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
            🔥 SIÊU ƯU ĐÃI VĂN PHÒNG PHẨM
          </span>
          <h1 class="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Mua sắm dụng cụ học tập & văn phòng giá tốt mỗi ngày
          </h1>
          <p class="text-slate-300 text-lg md:text-xl font-medium max-w-lg">
            Hàng chính hãng 100%, miễn phí vận chuyển từ 299K, giao hàng nhanh trong ngày.
          </p>
          <div class="pt-4 flex flex-wrap justify-center md:justify-start gap-4">
            <router-link to="/products" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-full shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all text-base">
              Mua ngay
            </router-link>
            <a href="#featured-products" class="border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-bold py-3.5 px-8 rounded-full transition-all text-base">
              Tìm hiểu thêm
            </a>
          </div>
        </div>
        <div class="hidden md:flex justify-center relative">
          <img
            src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800"
            alt="Stationery banner"
            class="rounded-3xl shadow-2xl border-4 border-slate-800/80 max-w-md object-cover aspect-[4/3] rotate-1 hover:rotate-0 transition-transform duration-500"
          />
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      <!-- Highlighted Categories -->
      <section class="space-y-6">
        <div class="flex items-end justify-between">
          <div>
            <h2 class="text-2xl font-extrabold text-slate-900">Danh Mục Nổi Bật</h2>
            <p class="text-slate-500 text-sm mt-1">Khám phá các sản phẩm theo nhóm danh mục tiện lợi</p>
          </div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <router-link
            v-for="cat in parentCategories"
            :key="cat._id"
            :to="`/products?category=${cat._id}`"
            class="bg-white border border-slate-200 rounded-2xl p-6 text-center hover:shadow-md hover:border-blue-400 transition-all flex flex-col items-center group"
          >
            <div class="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <img :src="cat.image" class="w-10 h-10 object-cover rounded-full" />
            </div>
            <span class="text-sm font-bold text-slate-800 group-hover:text-blue-700">{{ cat.name }}</span>
          </router-link>
        </div>
      </section>

      <!-- Best Sellers -->
      <section id="featured-products" class="space-y-6">
        <div class="flex items-end justify-between">
          <div>
            <h2 class="text-2xl font-extrabold text-slate-900">Sản Phẩm Bán Chạy</h2>
            <p class="text-slate-500 text-sm mt-1">Những sản phẩm được khách hàng yêu thích và tin dùng nhất</p>
          </div>
          <router-link to="/products?sort=best_selling" class="text-blue-600 hover:text-blue-800 font-bold text-sm flex items-center gap-1">
            <span>Xem tất cả</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          </router-link>
        </div>
        
        <div v-if="loadingBest" class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div v-for="n in 4" :key="n" class="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 animate-pulse">
            <div class="bg-slate-200 rounded-xl aspect-square w-full"></div>
            <div class="h-4 bg-slate-200 rounded w-2/3"></div>
            <div class="h-6 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>

        <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div v-for="prod in bestSelling" :key="prod._id" class="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg transition-all flex flex-col group relative">
            <!-- Discount badge -->
            <span v-if="getDiscountPercent(prod.price, prod.discountPrice) > 0" class="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full z-10">
              -{{ getDiscountPercent(prod.price, prod.discountPrice) }}%
            </span>
            <!-- Image container -->
            <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden mb-4 relative">
              <img :src="prod.images[0] || 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <!-- Title -->
            <h3 class="text-sm font-bold text-slate-800 line-clamp-2 min-h-[40px] group-hover:text-blue-700 transition-colors">
              <router-link :to="`/products/${prod._id}`">{{ prod.name }}</router-link>
            </h3>
            <!-- Price and Rating -->
            <div class="mt-2 flex items-center justify-between">
              <div class="flex flex-col">
                <template v-if="prod.discountPrice > 0">
                  <span class="text-base font-extrabold text-blue-700">{{ formatCurrency(prod.discountPrice) }}</span>
                  <span class="text-xs text-slate-400 line-through">{{ formatCurrency(prod.price) }}</span>
                </template>
                <template v-else>
                  <span class="text-base font-extrabold text-slate-800">{{ formatCurrency(prod.price) }}</span>
                </template>
              </div>
              <div class="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                <span class="text-xs font-bold text-yellow-700">{{ prod.rating || 5 }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3.5 h-3.5 text-yellow-500">
                  <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <!-- Add to Cart -->
            <button @click="addToCart(prod)" class="mt-4 w-full bg-slate-900 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
              Thêm vào giỏ
            </button>
          </div>
        </div>
      </section>

      <!-- Promotions / Coupon Area -->
      <section class="bg-amber-50 rounded-3xl p-8 border border-amber-200/60 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="space-y-2 text-center md:text-left">
          <h3 class="text-xl font-black text-amber-900">Mã Giảm Giá Độc Quyền 🎉</h3>
          <p class="text-amber-700 text-sm font-medium">Nhập mã vào giỏ hàng hoặc thanh toán để nhận thêm ưu đãi đặc biệt.</p>
        </div>
        <div class="flex flex-wrap gap-4 justify-center">
          <div v-for="code in ['WELCOME10', 'SUMMER50K', 'FREESHIP']" :key="code" class="bg-white border border-amber-200 rounded-xl px-4 py-3 text-center shadow-xs flex items-center gap-3">
            <span class="font-mono font-bold text-amber-800 text-sm tracking-wide bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
              {{ code }}
            </span>
            <button @click="copyCode(code)" class="text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors">
              Sao chép
            </button>
          </div>
        </div>
      </section>

      <!-- Discounted Products -->
      <section class="space-y-6">
        <div class="flex items-end justify-between">
          <div>
            <h2 class="text-2xl font-extrabold text-slate-900">Đang Giảm Giá Cực Sốc</h2>
            <p class="text-slate-500 text-sm mt-1">Mua sắm ngay với ưu đãi giảm giá tốt nhất</p>
          </div>
          <router-link to="/products?discounted=true" class="text-blue-600 hover:text-blue-800 font-bold text-sm flex items-center gap-1">
            <span>Xem tất cả</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          </router-link>
        </div>

        <div v-if="loadingDiscount" class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div v-for="n in 4" :key="n" class="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse space-y-4">
            <div class="bg-slate-200 rounded-xl aspect-square w-full"></div>
            <div class="h-4 bg-slate-200 rounded w-2/3"></div>
            <div class="h-6 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>

        <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div v-for="prod in discounted" :key="prod._id" class="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg transition-all flex flex-col group relative">
            <span class="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full z-10">
              -{{ getDiscountPercent(prod.price, prod.discountPrice) }}%
            </span>
            <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden mb-4 relative">
              <img :src="prod.images[0] || 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <h3 class="text-sm font-bold text-slate-800 line-clamp-2 min-h-[40px] group-hover:text-blue-700 transition-colors">
              <router-link :to="`/products/${prod._id}`">{{ prod.name }}</router-link>
            </h3>
            <div class="mt-2 flex items-center justify-between">
              <div class="flex flex-col">
                <span class="text-base font-extrabold text-blue-700">{{ formatCurrency(prod.discountPrice) }}</span>
                <span class="text-xs text-slate-400 line-through">{{ formatCurrency(prod.price) }}</span>
              </div>
              <div class="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                <span class="text-xs font-bold text-yellow-700">{{ prod.rating || 5 }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3.5 h-3.5 text-yellow-500">
                  <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <button @click="addToCart(prod)" class="mt-4 w-full bg-slate-900 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2">
              Thêm vào giỏ
            </button>
          </div>
        </div>
      </section>

      <!-- New Products -->
      <section class="space-y-6">
        <div class="flex items-end justify-between">
          <div>
            <h2 class="text-2xl font-extrabold text-slate-900">Hàng Mới Về</h2>
            <p class="text-slate-500 text-sm mt-1">Cập nhật những dụng cụ mới nhất cho kệ hàng của bạn</p>
          </div>
          <router-link to="/products?sort=newest" class="text-blue-600 hover:text-blue-800 font-bold text-sm flex items-center gap-1">
            <span>Xem tất cả</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          </router-link>
        </div>

        <div v-if="loadingNew" class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div v-for="n in 4" :key="n" class="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse space-y-4">
            <div class="bg-slate-200 rounded-xl aspect-square w-full"></div>
            <div class="h-4 bg-slate-200 rounded w-2/3"></div>
            <div class="h-6 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>

        <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div v-for="prod in newProducts" :key="prod._id" class="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg transition-all flex flex-col group relative">
            <span v-if="getDiscountPercent(prod.price, prod.discountPrice) > 0" class="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full z-10">
              -{{ getDiscountPercent(prod.price, prod.discountPrice) }}%
            </span>
            <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden mb-4 relative">
              <img :src="prod.images[0] || 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <h3 class="text-sm font-bold text-slate-800 line-clamp-2 min-h-[40px] group-hover:text-blue-700 transition-colors">
              <router-link :to="`/products/${prod._id}`">{{ prod.name }}</router-link>
            </h3>
            <div class="mt-2 flex items-center justify-between">
              <div class="flex flex-col">
                <template v-if="prod.discountPrice > 0">
                  <span class="text-base font-extrabold text-blue-700">{{ formatCurrency(prod.discountPrice) }}</span>
                  <span class="text-xs text-slate-400 line-through">{{ formatCurrency(prod.price) }}</span>
                </template>
                <template v-else>
                  <span class="text-base font-extrabold text-slate-800">{{ formatCurrency(prod.price) }}</span>
                </template>
              </div>
              <div class="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                <span class="text-xs font-bold text-yellow-700">{{ prod.rating || 5 }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3.5 h-3.5 text-yellow-500">
                  <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <button @click="addToCart(prod)" class="mt-4 w-full bg-slate-900 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2">
              Thêm vào giỏ
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useCartStore } from '@/stores/cart'
import { productService } from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import { formatCurrency, getDiscountPercent } from '@/utils/helpers'
import type { Product, Category } from '@/types'

const cartStore = useCartStore()
const toast = useToast()

const parentCategories = ref<Category[]>([])
const bestSelling = ref<Product[]>([])
const discounted = ref<Product[]>([])
const newProducts = ref<Product[]>([])

const loadingBest = ref(true)
const loadingDiscount = ref(true)
const loadingNew = ref(true)

onMounted(async () => {
  try {
    const catRes = await categoryService.getParents()
    parentCategories.value = catRes.data
  } catch (err) {
    console.error('Error loading parent categories', err)
  }

  try {
    const bestRes = await productService.getBestSelling(4)
    bestSelling.value = bestRes.data
  } finally {
    loadingBest.value = false
  }

  try {
    const discRes = await productService.getDiscounted(4)
    discounted.value = discRes.data
  } finally {
    loadingDiscount.value = false
  }

  try {
    const newRes = await productService.getNew(4)
    newProducts.value = newRes.data
  } finally {
    loadingNew.value = false
  }
})

function addToCart(product: Product) {
  cartStore.addToCart(product, 1)
  toast.success(`Đã thêm "${product.name}" vào giỏ hàng`)
}

function copyCode(code: string) {
  navigator.clipboard.writeText(code)
  toast.success(`Đã sao chép mã: ${code}`)
}
</script>
