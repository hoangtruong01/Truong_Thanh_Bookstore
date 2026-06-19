<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
    <div v-if="loading" class="bg-white border border-slate-200 rounded-3xl p-8 animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
      <div class="space-y-6">
        <div class="h-8 bg-slate-200 rounded w-2/3"></div>
        <div class="h-4 bg-slate-200 rounded w-1/3"></div>
        <div class="h-10 bg-slate-200 rounded w-1/2"></div>
        <div class="h-20 bg-slate-200 rounded w-full"></div>
      </div>
    </div>

    <div v-else-if="!product" class="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-4">
      <h3 class="text-lg font-bold text-slate-800">Không tìm thấy sản phẩm</h3>
      <router-link to="/products" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors inline-block text-sm">
        Trở về danh sách sản phẩm
      </router-link>
    </div>

    <div v-else class="space-y-12">
      <!-- Product Main Grid -->
      <div class="bg-white border border-slate-200 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-2 gap-12 shadow-xs">
        <!-- Gallery -->
        <div class="space-y-4">
          <div class="aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
            <img :src="selectedImage || 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'" class="w-full h-full object-cover" />
          </div>
          <div v-if="product.images.length > 1" class="flex gap-3 overflow-x-auto py-1">
            <button
              v-for="(img, idx) in product.images"
              :key="idx"
              @click="selectedImage = img"
              class="w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0"
              :class="[selectedImage === img ? 'border-blue-600' : 'border-transparent opacity-70 hover:opacity-100']"
            >
              <img :src="img" class="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        <!-- Meta and Actions -->
        <div class="space-y-6">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Thương hiệu: {{ product.brand || 'Khác' }}</span>
              <span>•</span>
              <span>Mã SKU: {{ product.sku }}</span>
            </div>
            <h1 class="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
              {{ product.name }}
            </h1>
            <div class="flex items-center gap-4 text-sm mt-2">
              <div class="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-lg">
                <span class="font-bold text-yellow-700">{{ product.rating || 5 }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-yellow-500">
                  <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
                </svg>
              </div>
              <span class="text-slate-400">|</span>
              <span class="text-slate-500 font-medium">Đã bán {{ product.sold }}</span>
              <span class="text-slate-400">|</span>
              <span :class="[product.stock > 0 ? 'text-green-600' : 'text-red-600', 'font-semibold']">
                {{ product.stock > 0 ? `Còn hàng (${product.stock})` : 'Hết hàng' }}
              </span>
            </div>
          </div>

          <!-- Price Block -->
          <div class="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between">
            <div class="space-y-1">
              <template v-if="product.discountPrice > 0">
                <div class="flex items-baseline gap-3">
                  <span class="text-3xl font-black text-blue-700">{{ formatCurrency(product.discountPrice) }}</span>
                  <span class="text-slate-400 line-through text-sm font-medium">{{ formatCurrency(product.price) }}</span>
                </div>
                <p class="text-xs text-red-500 font-bold">
                  Tiết kiệm {{ formatCurrency(product.price - product.discountPrice) }} (-{{ getDiscountPercent(product.price, product.discountPrice) }}%)
                </p>
              </template>
              <template v-else>
                <span class="text-3xl font-black text-slate-800">{{ formatCurrency(product.price) }}</span>
              </template>
            </div>
          </div>

          <!-- Quantity Selector -->
          <div class="space-y-3">
            <span class="text-sm font-bold text-slate-700">Số lượng</span>
            <div class="flex items-center gap-3">
              <div class="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                <button
                  @click="changeQuantity(-1)"
                  :disabled="quantity <= 1"
                  class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white text-slate-500 font-bold transition-colors disabled:opacity-50"
                >
                  -
                </button>
                <input
                  v-model.number="quantity"
                  type="number"
                  min="1"
                  :max="product.stock"
                  class="w-14 text-center bg-transparent border-none focus:outline-none font-bold text-slate-800 text-sm"
                  @change="validateQuantity"
                />
                <button
                  @click="changeQuantity(1)"
                  :disabled="quantity >= product.stock"
                  class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white text-slate-500 font-bold transition-colors disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4 pt-4">
            <button
              @click="addToCart"
              :disabled="product.stock === 0"
              class="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed text-sm uppercase tracking-wider"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>

      <!-- Description Block -->
      <div class="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
        <h2 class="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-4 mb-6">Mô tả sản phẩm</h2>
        <div class="prose max-w-none text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
          {{ product.description || 'Chưa có thông tin mô tả chi tiết cho sản phẩm này.' }}
        </div>
      </div>

      <!-- Related Products -->
      <section v-if="relatedProducts.length > 0" class="space-y-6">
        <h2 class="text-xl font-extrabold text-slate-900">Sản phẩm liên quan</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div v-for="related in relatedProducts" :key="related._id" class="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-lg transition-all flex flex-col group relative">
            <span v-if="getDiscountPercent(related.price, related.discountPrice) > 0" class="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full z-10">
              -{{ getDiscountPercent(related.price, related.discountPrice) }}%
            </span>
            <div class="aspect-square bg-slate-50 rounded-xl overflow-hidden mb-4 relative">
              <img :src="related.images[0] || 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <h3 class="text-sm font-bold text-slate-800 line-clamp-2 min-h-[40px] group-hover:text-blue-700 transition-colors">
              <router-link :to="`/products/${related._id}`">{{ related.name }}</router-link>
            </h3>
            <div class="mt-2 flex items-center justify-between">
              <div class="flex flex-col">
                <template v-if="related.discountPrice > 0">
                  <span class="text-base font-extrabold text-blue-700">{{ formatCurrency(related.discountPrice) }}</span>
                  <span class="text-xs text-slate-400 line-through">{{ formatCurrency(related.price) }}</span>
                </template>
                <template v-else>
                  <span class="text-base font-extrabold text-slate-800">{{ formatCurrency(related.price) }}</span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useCartStore } from '@/stores/cart'
import { productService } from '@/services/product.service'
import { formatCurrency, getDiscountPercent } from '@/utils/helpers'
import type { Product } from '@/types'

const route = useRoute()
const cartStore = useCartStore()
const toast = useToast()

const product = ref<Product | null>(null)
const relatedProducts = ref<Product[]>([])
const selectedImage = ref('')
const quantity = ref(1)
const loading = ref(true)

async function loadProduct() {
  loading.value = true
  try {
    const id = route.params.id as string
    const res = await productService.getById(id)
    product.value = res.data
    selectedImage.value = res.data.images[0] || ''
    quantity.value = 1
    
    // Load related products
    const relatedRes = await productService.getAll({
      category: typeof res.data.category === 'object' ? res.data.category._id : res.data.category,
      limit: 4
    })
    relatedProducts.value = relatedRes.data.filter((p: Product) => p._id !== id)
  } catch (err) {
    toast.error('Lỗi khi tải chi tiết sản phẩm')
  } finally {
    loading.value = false
  }
}

onMounted(loadProduct)
watch(() => route.params.id, loadProduct)

function changeQuantity(val: number) {
  const newQty = quantity.value + val
  if (product.value && newQty >= 1 && newQty <= product.value.stock) {
    quantity.value = newQty
  }
}

function validateQuantity() {
  if (product.value) {
    if (quantity.value < 1) quantity.value = 1
    if (quantity.value > product.value.stock) quantity.value = product.value.stock
  }
}

function addToCart() {
  if (product.value) {
    cartStore.addToCart(product.value, quantity.value)
    toast.success(`Đã thêm ${quantity.value} "${product.value.name}" vào giỏ hàng`)
  }
}
</script>
