<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Filters Sidebar -->
      <aside class="w-full lg:w-64 flex-shrink-0 space-y-6">
        <!-- Categories -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">Combo</h3>
          <div class="space-y-2">
            <button
              @click="selectCategory('')"
              class="w-full text-left text-sm font-medium py-1 px-2 rounded-lg transition-colors"
              :class="[!selectedCategory ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50']"
            >
              Tất cả sản phẩm
            </button>
            <div v-for="cat in categories" :key="cat._id" class="space-y-1">
              <button
                @click="selectCategory(cat._id)"
                class="w-full text-left text-sm font-medium py-1 px-2 rounded-lg transition-colors flex justify-between items-center"
                :class="[selectedCategory === cat._id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50']"
              >
                <span>{{ cat.name }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Price Filter -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">Khoảng giá</h3>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-slate-400 font-medium">Giá tối thiểu</label>
              <input
                v-model.number="minPrice"
                type="number"
                placeholder="0đ"
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
            <div>
              <label class="text-xs text-slate-400 font-medium">Giá tối đa</label>
              <input
                v-model.number="maxPrice"
                type="number"
                placeholder="Không giới hạn"
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
            <button
              @click="applyFilters"
              class="w-full bg-slate-950 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors mt-2"
            >
              Áp dụng
            </button>
          </div>
        </div>
      </aside>

      <!-- Products Area -->
      <div class="flex-grow space-y-6">
        <!-- Sort and Stats -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div class="text-sm text-slate-500 font-medium">
            Tìm thấy <span class="text-slate-800 font-bold">{{ totalProducts }}</span> sản phẩm
            <span v-if="searchQuery"> cho "{{ searchQuery }}"</span>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm text-slate-500 font-medium whitespace-nowrap">Sắp xếp:</span>
            <select
              v-model="sortBy"
              @change="fetchProducts"
              class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
              <option value="best_selling">Bán chạy nhất</option>
            </select>
          </div>
        </div>

        <!-- Products Grid -->
        <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div v-for="n in 6" :key="n" class="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 animate-pulse">
            <div class="bg-slate-200 rounded-xl aspect-square w-full"></div>
            <div class="h-4 bg-slate-200 rounded w-2/3"></div>
            <div class="h-6 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>

        <div v-else-if="products.length === 0" class="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-4">
          <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="m21-21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" /></svg>
          </div>
          <h3 class="text-lg font-bold text-slate-800">Không tìm thấy sản phẩm nào</h3>
          <p class="text-slate-400 text-sm max-w-xs mx-auto">Vui lòng điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
        </div>

        <div v-else class="space-y-8">
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <ProductCard
              v-for="prod in products"
              :key="prod._id"
              :product="prod"
              @add-to-cart="addToCart"
            />
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex justify-center items-center gap-2">
            <button
              @click="changePage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
            </button>
            <span class="text-sm font-medium text-slate-500">
              Trang {{ currentPage }} / {{ totalPages }}
            </span>
            <button
              @click="changePage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useCartStore } from '@/stores/cart'
import { productService } from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import ProductCard from '@/components/ProductCard.vue'
import type { Product, Category } from '@/types'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const toast = useToast()

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)

const totalProducts = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const limit = 9

// Filter values
const selectedCategory = ref(route.query.category as string || '')
const searchQuery = ref(route.query.q as string || '')
const minPrice = ref<number | null>(null)
const maxPrice = ref<number | null>(null)
const sortBy = ref('newest')

onMounted(async () => {
  try {
    const catRes = await categoryService.getAll()
    categories.value = catRes.data
  } catch (err) {
    console.error('Error fetching categories', err)
  }
  fetchProducts()
})

watch(() => route.query, (newQuery) => {
  selectedCategory.value = newQuery.category as string || ''
  searchQuery.value = newQuery.q as string || ''
  fetchProducts()
})

async function fetchProducts() {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit,
      category: selectedCategory.value || undefined,
      q: searchQuery.value || undefined,
      minPrice: minPrice.value || undefined,
      maxPrice: maxPrice.value || undefined,
      sort: sortBy.value,
    }
    const res: any = await productService.getAll(params)
    products.value = res.data.data
    totalProducts.value = res.data.total || res.data.data.length
    totalPages.value = res.data.totalPages || 1
  } catch (err) {
    toast.error('Lỗi khi tải danh sách sản phẩm')
  } finally {
    loading.value = false
  }
}

function selectCategory(catId: string) {
  selectedCategory.value = catId
  currentPage.value = 1
  router.push({
    path: '/products',
    query: {
      ...route.query,
      category: catId || undefined,
    }
  })
}

function applyFilters() {
  currentPage.value = 1
  fetchProducts()
}

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchProducts()
  }
}

function addToCart(product: Product) {
  cartStore.addToCart(product)
  toast.success(`Đã thêm "${product.name}" vào giỏ hàng`)
}

function formatNumber(num: number) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
</script>
