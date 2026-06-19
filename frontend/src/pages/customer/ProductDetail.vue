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
          <div class="aspect-square bg-slate-50/70 rounded-2xl overflow-hidden border border-slate-100 relative flex items-center justify-center">
            <img v-if="selectedImage" :src="selectedImage" class="w-full h-full object-cover" />
            <div v-else :class="`w-full h-full ${getProductPlaceholder(product.name).gradient} flex items-center justify-center`">
              <svg v-if="getProductPlaceholder(product.name).icon === 'pencil'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
              <svg v-else-if="getProductPlaceholder(product.name).icon === 'document'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <svg v-else-if="getProductPlaceholder(product.name).icon === 'calculator'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008ZM2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.379-3.379a.75.75 0 0 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06-1.06l-1.25-1.25Z" />
              </svg>
              <svg v-else-if="getProductPlaceholder(product.name).icon === 'folder'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-19.5 0A2.25 2.25 0 0 0 4.5 15h15a2.25 2.25 0 0 0 2.25-2.25m-19.5 0v.225C2.25 14.28 3.52 15 5.04 15h13.92c1.52 0 2.79-.72 2.79-2.025v-.225M3 9V6a3 3 0 0 1 3-3h3.75a3 3 0 0 1 2.25 1.025L13.5 6h6.75A3 3 0 0 1 23 9v2.25m-20.25 0h17.5" />
              </svg>
              <svg v-else-if="getProductPlaceholder(product.name).icon === 'briefcase'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 .994-.806 1.8-1.8 1.8H5.55c-.994 0-1.8-.806-1.8-1.8v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.45.258-.717.258H5.184c-.267 0-.523-.093-.717-.258m16.5 0V8.706c0-1.08-.768-2.014-1.837-2.174a47.79 47.79 0 0 0-3.413-.387m-7.5 0V5.25A2.25 2.25 0 0 1 10.5 3h3a2.25 2.25 0 0 1 2.25 2.25v.819M6.75 7.5v.75m0-1.5h10.5M6.75 7.5H4.25m13 0h2.5M6.75 7.5v8.25M17.25 7.5v8.25M3 16.5h18" />
              </svg>
              <svg v-else-if="getProductPlaceholder(product.name).icon === 'academic'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M12 21v-4.5" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.753 2.481.162l5.586-5.586a1.725 1.725 0 0 0 .162-2.481l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
              </svg>
            </div>
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
              @click="addToCart()"
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
          <ProductCard
            v-for="related in relatedProducts"
            :key="related._id"
            :product="related"
            @add-to-cart="addToCart"
          />
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
import ProductCard from '@/components/ProductCard.vue'
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

function addToCart(prod?: Product) {
  if (prod) {
    cartStore.addToCart(prod, 1)
    toast.success(`Đã thêm "${prod.name}" vào giỏ hàng`)
  } else if (product.value) {
    cartStore.addToCart(product.value, quantity.value)
    toast.success(`Đã thêm ${quantity.value} "${product.value.name}" vào giỏ hàng`)
  }
}

function formatNumber(num: number) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function getProductPlaceholder(prodName?: string) {
  const name = (prodName || '').toLowerCase()
  if (name.includes('bút') || name.includes('viết') || name.includes('chì')) {
    return {
      gradient: 'bg-gradient-to-br from-red-400 to-rose-500',
      icon: 'pencil'
    }
  }
  if (name.includes('giấy') || name.includes('sổ') || name.includes('vở') || name.includes('tập') || name.includes('note')) {
    return {
      gradient: 'bg-gradient-to-br from-emerald-400 to-teal-500',
      icon: 'document'
    }
  }
  if (name.includes('máy tính') || name.includes('casio')) {
    return {
      gradient: 'bg-gradient-to-br from-indigo-400 to-purple-500',
      icon: 'calculator'
    }
  }
  if (name.includes('hồ sơ') || name.includes('bìa') || name.includes('kẹp') || name.includes('keo') || name.includes('thước')) {
    return {
      gradient: 'bg-gradient-to-br from-blue-400 to-sky-500',
      icon: 'folder'
    }
  }
  if (name.includes('combo') || name.includes('văn phòng')) {
    return {
      gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      icon: 'briefcase'
    }
  }
  if (name.includes('học sinh') || name.includes('tiểu học') || name.includes('bộ dụng cụ')) {
    return {
      gradient: 'bg-gradient-to-br from-amber-400 to-orange-500',
      icon: 'academic'
    }
  }
  return {
    gradient: 'bg-gradient-to-br from-pink-400 to-rose-500',
    icon: 'paint'
  }
}
</script>
