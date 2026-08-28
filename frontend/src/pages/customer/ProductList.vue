<template>
  <div class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <!-- Breadcrumb -->
    <Breadcrumb :items="breadcrumbItems" />

    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Filters Sidebar -->
      <aside class="w-full lg:w-72 flex-shrink-0 space-y-5">
        <!-- Categories -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Danh mục</span>
            <span v-if="selectedCategory" @click="selectCategory('')" class="text-[10px] font-bold text-[#dc2626] hover:underline cursor-pointer">
              Xóa chọn
            </span>
          </h3>
          <div class="space-y-1 max-h-64 overflow-y-auto pr-1">
            <button
              @click="selectCategory('')"
              class="w-full text-left text-xs font-bold py-1.5 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between"
              :class="[!selectedCategory ? 'bg-red-50 text-[#dc2626]' : 'text-slate-600 hover:bg-slate-50']"
            >
              <span>Tất cả sản phẩm</span>
            </button>
            <div v-for="cat in categories" :key="cat._id" class="space-y-1">
              <button
                @click="selectCategory(cat._id)"
                class="w-full text-left text-xs font-semibold py-1.5 px-2.5 rounded-xl transition-all cursor-pointer flex justify-between items-center"
                :class="[selectedCategory === cat._id ? 'bg-red-50 text-[#dc2626] font-bold' : 'text-slate-600 hover:bg-slate-50']"
              >
                <span class="truncate">{{ cat.name }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Dynamic Sub-Options Filter -->
        <div v-if="activeSubOptions" class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-all duration-300">
          <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <span class="w-1.5 h-3 bg-[#dc2626] rounded-full"></span>
              {{ activeSubOptions.label }}
            </span>
            <span v-if="selectedSubOption" @click="toggleSubOption('')" class="text-[10px] font-bold text-slate-400 hover:text-[#dc2626] cursor-pointer">
              Xóa
            </span>
          </h3>
          
          <!-- Grid Layout (e.g. for Grades 1-12) -->
          <div v-if="activeSubOptions.type === 'grid'" class="grid grid-cols-4 gap-1.5">
            <button
              v-for="opt in activeSubOptions.options"
              :key="opt"
              @click="toggleSubOption(opt)"
              class="h-8 text-[11px] font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center"
              :class="[
                selectedSubOption === opt
                  ? 'bg-[#dc2626] border-[#dc2626] text-white shadow-xs font-extrabold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
              ]"
            >
              {{ opt.replace('Lớp ', '') }}
            </button>
          </div>

          <!-- Pills Layout (e.g. for subjects, genres) -->
          <div v-else class="flex flex-wrap gap-1.5">
            <button
              v-for="opt in activeSubOptions.options"
              :key="opt"
              @click="toggleSubOption(opt)"
              class="px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all cursor-pointer flex items-center justify-center"
              :class="[
                selectedSubOption === opt
                  ? 'bg-[#dc2626] border-[#dc2626] text-white shadow-xs font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
              ]"
            >
              {{ opt }}
            </button>
          </div>
        </div>

        <!-- Price Range Filter -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Khoảng giá</h3>
          
          <!-- Quick Price Presets -->
          <div class="grid grid-cols-2 gap-1.5 mb-3">
            <button
              v-for="preset in pricePresets"
              :key="preset.label"
              @click="applyPricePreset(preset.min, preset.max)"
              type="button"
              class="px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center truncate"
              :class="[
                isPricePresetActive(preset.min, preset.max)
                  ? 'bg-red-50 border-red-200 text-[#dc2626] font-extrabold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              ]"
            >
              {{ preset.label }}
            </button>
          </div>

          <div class="space-y-2.5">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[10px] text-slate-400 font-bold block mb-1">Từ (đ)</label>
                <input
                  v-model.number="minPrice"
                  type="number"
                  placeholder="0"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white"
                />
              </div>
              <div>
                <label class="text-[10px] text-slate-400 font-bold block mb-1">Đến (đ)</label>
                <input
                  v-model.number="maxPrice"
                  type="number"
                  placeholder="Max"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white"
                />
              </div>
            </div>
            <button
              @click="applyFilters"
              class="w-full bg-slate-900 hover:bg-[#dc2626] text-white font-bold py-2 px-3 rounded-xl text-xs transition-all cursor-pointer shadow-xs hover:shadow-md"
            >
              Áp dụng giá
            </button>
          </div>
        </div>

        <!-- Brand Filter (Checklist) -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Thương hiệu</h3>
          <div class="space-y-2 max-h-40 overflow-y-auto pr-1">
            <label v-for="br in availableBrands" :key="br" class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                :value="br" 
                v-model="selectedBrands"
                class="rounded border-slate-300 text-[#dc2626] focus:ring-[#dc2626] w-3.5 h-3.5 cursor-pointer" 
              />
              <span class="truncate">{{ br }}</span>
            </label>
          </div>
        </div>

        <!-- Author Filter (Checklist / Text) -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Tác giả phổ biến</h3>
          <div class="space-y-2 max-h-40 overflow-y-auto pr-1">
            <label v-for="au in availableAuthors" :key="au" class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                :value="au" 
                v-model="selectedAuthors"
                class="rounded border-slate-300 text-[#dc2626] focus:ring-[#dc2626] w-3.5 h-3.5 cursor-pointer" 
              />
              <span class="truncate">{{ au }}</span>
            </label>
          </div>
        </div>

        <!-- Publisher Filter -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Nhà xuất bản</h3>
          <div class="space-y-2 max-h-40 overflow-y-auto pr-1">
            <label v-for="pub in availablePublishers" :key="pub" class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                :value="pub" 
                v-model="selectedPublishers"
                class="rounded border-slate-300 text-[#dc2626] focus:ring-[#dc2626] w-3.5 h-3.5 cursor-pointer" 
              />
              <span class="truncate">{{ pub }}</span>
            </label>
          </div>
        </div>

        <!-- Rating Filter -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Đánh giá</h3>
          <div class="space-y-1.5">
            <button 
              v-for="stars in [5, 4, 3]" 
              :key="stars"
              @click="toggleRatingFilter(stars)"
              class="w-full text-left text-xs font-bold py-1.5 px-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              :class="[selectedRating === stars ? 'bg-red-50 text-[#dc2626] border border-red-200/60' : 'text-slate-600 border border-transparent hover:bg-slate-50']"
            >
              <span class="text-amber-400 text-sm">★</span>
              <span>Từ {{ stars }} sao trở lên</span>
            </button>
          </div>
        </div>

        <!-- Stock & Deals Filter -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <label class="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
            <input 
              type="checkbox" 
              v-model="onlyInStock" 
              @change="applyFilters"
              class="rounded border-slate-300 text-[#dc2626] focus:ring-[#dc2626] w-3.5 h-3.5 cursor-pointer" 
            />
            <span>Chỉ sản phẩm còn hàng</span>
          </label>
          <label class="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
            <input 
              type="checkbox" 
              v-model="isDiscounted" 
              @change="applyFilters"
              class="rounded border-slate-300 text-[#dc2626] focus:ring-[#dc2626] w-3.5 h-3.5 cursor-pointer" 
            />
            <span>Đang khuyến mãi 🔥</span>
          </label>
        </div>
      </aside>

      <!-- Products Area -->
      <div class="flex-grow space-y-6">
        <!-- Active Filter Tags Toolbar -->
        <div v-if="hasActiveFilters" class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-2 shadow-xs">
          <span class="text-xs font-black text-slate-500 uppercase tracking-wider mr-1">Bộ lọc:</span>
          
          <!-- Category Tag -->
          <span v-if="selectedCategoryName" class="inline-flex items-center gap-1 bg-red-50 text-[#dc2626] text-xs font-bold px-2.5 py-1 rounded-lg border border-red-200/60">
            Danh mục: {{ selectedCategoryName }}
            <button @click="selectCategory('')" class="hover:text-red-800 ml-0.5 cursor-pointer">✕</button>
          </span>

          <!-- Search Query Tag -->
          <span v-if="searchQuery" class="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200">
            Từ khóa: "{{ searchQuery }}"
            <button @click="clearSearch" class="hover:text-red-600 ml-0.5 cursor-pointer">✕</button>
          </span>

          <!-- Price Tag -->
          <span v-if="minPrice || maxPrice" class="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200">
            Giá: {{ formatPriceRangeText() }}
            <button @click="clearPriceFilter" class="hover:text-red-600 ml-0.5 cursor-pointer">✕</button>
          </span>

          <!-- Brand Tags -->
          <span v-for="br in selectedBrands" :key="br" class="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200">
            Thương hiệu: {{ br }}
            <button @click="removeBrand(br)" class="hover:text-red-600 ml-0.5 cursor-pointer">✕</button>
          </span>

          <!-- Author Tags -->
          <span v-for="au in selectedAuthors" :key="au" class="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200">
            Tác giả: {{ au }}
            <button @click="removeAuthor(au)" class="hover:text-red-600 ml-0.5 cursor-pointer">✕</button>
          </span>

          <!-- Publisher Tags -->
          <span v-for="pub in selectedPublishers" :key="pub" class="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200">
            NXB: {{ pub }}
            <button @click="removePublisher(pub)" class="hover:text-red-600 ml-0.5 cursor-pointer">✕</button>
          </span>

          <!-- Rating Tag -->
          <span v-if="selectedRating" class="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200">
            ⭐ ≥ {{ selectedRating }} sao
            <button @click="selectedRating = null; applyFilters()" class="hover:text-red-600 ml-0.5 cursor-pointer">✕</button>
          </span>

          <!-- Stock Tag -->
          <span v-if="onlyInStock" class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-200">
            Còn hàng
            <button @click="onlyInStock = false; applyFilters()" class="hover:text-emerald-900 ml-0.5 cursor-pointer">✕</button>
          </span>

          <!-- Deals Tag -->
          <span v-if="isDiscounted" class="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-orange-200">
            Đang giảm giá
            <button @click="isDiscounted = false; applyFilters()" class="hover:text-orange-900 ml-0.5 cursor-pointer">✕</button>
          </span>

          <!-- Clear All Button -->
          <button
            @click="clearAllFilters"
            class="text-xs font-extrabold text-[#dc2626] hover:underline ml-auto cursor-pointer"
          >
            Xóa tất cả bộ lọc
          </button>
        </div>

        <!-- Sort and Stats Bar -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xs">
          <div class="text-xs text-slate-500 font-medium">
            Tìm thấy <span class="text-slate-900 font-extrabold text-sm">{{ totalProducts }}</span> sản phẩm
            <span v-if="searchQuery" class="text-slate-700 font-bold"> cho từ khóa "{{ searchQuery }}"</span>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500 font-bold whitespace-nowrap">Sắp xếp theo:</span>
            <select
              v-model="sortBy"
              @change="applyFilters"
              class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#dc2626] cursor-pointer"
            >
              <option value="newest">✨ Mới nhất</option>
              <option value="price_asc">💵 Giá: Thấp đến Cao</option>
              <option value="price_desc">💎 Giá: Cao đến Thấp</option>
              <option value="best_selling">🔥 Bán chạy nhất</option>
              <option value="rating">⭐ Đánh giá cao nhất</option>
              <option value="name_asc">🔤 Tên: A đến Z</option>
              <option value="name_desc">🔡 Tên: Z đến A</option>
              <option value="discount_desc">🏷️ Giảm giá nhiều nhất</option>
            </select>
          </div>
        </div>

        <!-- Products Grid / Skeleton / Empty State -->
        <div v-if="loading" class="responsive-flex-grid-gap-4">
          <div v-for="n in 12" :key="n" class="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 animate-pulse">
            <div class="bg-slate-200 rounded-xl aspect-square w-full"></div>
            <div class="h-4 bg-slate-200 rounded w-2/3"></div>
            <div class="h-6 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>

        <div v-else-if="products.length === 0" class="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-4 shadow-xs">
          <div class="w-16 h-16 bg-red-50 text-[#dc2626] rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" /></svg>
          </div>
          <h3 class="text-base font-extrabold text-slate-800">Không tìm thấy sản phẩm nào</h3>
          <p class="text-slate-400 text-xs max-w-sm mx-auto">Vui lòng điều chỉnh lại tiêu chí bộ lọc, mức giá hoặc thử tìm kiếm với các từ khóa phổ biến bên dưới.</p>
          <div class="flex flex-wrap justify-center gap-1.5 pt-2">
            <button
              v-for="kw in ['Bút bi', 'Sách giáo khoa', 'Tập vở', 'Deli', 'Thiên Long']"
              :key="kw"
              @click="quickSearch(kw)"
              class="bg-slate-100 hover:bg-red-50 hover:text-[#dc2626] text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              {{ kw }}
            </button>
          </div>
        </div>

        <div v-else class="space-y-8">
          <div class="responsive-flex-grid-gap-4">
            <ProductCard
              v-for="prod in products"
              :key="prod._id"
              :product="prod"
              @add-to-cart="addToCart"
            />
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 pt-4">
            <button
              @click="changePage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="w-9 h-9 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
            </button>
            
            <div class="flex items-center gap-1">
              <button
                v-for="p in visiblePages"
                :key="p"
                @click="changePage(p)"
                class="w-9 h-9 text-xs font-bold rounded-xl transition-all cursor-pointer"
                :class="[p === currentPage ? 'bg-[#dc2626] text-white shadow-xs' : 'hover:bg-slate-100 text-slate-700 border border-slate-200']"
              >
                {{ p }}
              </button>
            </div>

            <button
              @click="changePage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="w-9 h-9 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useCartStore } from '@/stores/cart'
import { productService } from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import ProductCard from '@/components/ProductCard.vue'
import type { Product, Category } from '@/types'
import { useSeoMeta } from '@/composables/useSeoMeta'
import Breadcrumb from '@/components/Breadcrumb.vue'

useSeoMeta({
  title: 'Danh sách sản phẩm & Sách',
  description: 'Khám phá hơn 1000+ sản phẩm sách, văn phòng phẩm, dụng cụ học tập chính hãng tại Trường Thành Bookstore.',
})

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const toast = useToast()

const categories = ref<Category[]>([])
const selectedCategory = ref((route.query.category as string) || '')

const breadcrumbItems = computed(() => {
  const items = [
    { label: 'Trang chủ', to: '/' },
    { label: 'Sản phẩm', to: '/products' },
  ]
  if (selectedCategory.value) {
    const cat = categories.value.find((c) => c._id === selectedCategory.value)
    if (cat) {
      items.push({
        label: cat.name,
        to: `/products?category=${cat._id}`,
      })
    }
  }
  return items
})

const selectedCategoryName = computed(() => {
  const cat = categories.value.find((c) => c._id === selectedCategory.value)
  return cat ? cat.name : ''
})

const products = ref<Product[]>([])
const loading = ref(true)

const totalProducts = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const limit = 16

// Filter values
const searchQuery = ref((route.query.q as string) || '')
const selectedSubOption = ref('')
const minPrice = ref<number | null>(null)
const maxPrice = ref<number | null>(null)
const sortBy = ref('newest')
const isDiscounted = ref(route.query.discounted === 'true')

const availableBrands = ['Thiên Long', 'Bến Nghé', 'Hồng Hà', 'Deli', 'Casio', 'Pentel', 'Plus', 'M&G']
const selectedBrands = ref<string[]>([])

const availableAuthors = ['Nguyễn Nhật Ánh', 'Tô Hoài', 'Dale Carnegie', 'Hermann Hesse', 'Arthur Conan Doyle', 'J.K. Rowling']
const selectedAuthors = ref<string[]>([])

const availablePublishers = ['NXB Trẻ', 'NXB Kim Đồng', 'NXB Giáo Dục', 'NXB Phụ Nữ', 'NXB Lao Động', 'NXB Tổng Hợp']
const selectedPublishers = ref<string[]>([])

const selectedRating = ref<number | null>(null)
const onlyInStock = ref(false)

const pricePresets = [
  { label: 'Dưới 50k', min: 0, max: 50000 },
  { label: '50k - 100k', min: 50000, max: 100000 },
  { label: '100k - 200k', min: 100000, max: 200000 },
  { label: 'Trên 200k', min: 200000, max: null },
]

function isPricePresetActive(min: number, max: number | null): boolean {
  if (max === null) {
    return minPrice.value === min && maxPrice.value === null
  }
  return minPrice.value === min && maxPrice.value === max
}

function applyPricePreset(min: number, max: number | null) {
  if (isPricePresetActive(min, max)) {
    minPrice.value = null
    maxPrice.value = null
  } else {
    minPrice.value = min
    maxPrice.value = max
  }
  applyFilters()
}

function formatPriceRangeText(): string {
  if (minPrice.value && maxPrice.value) {
    return `${minPrice.value.toLocaleString()}đ - ${maxPrice.value.toLocaleString()}đ`
  }
  if (minPrice.value) {
    return `Từ ${minPrice.value.toLocaleString()}đ`
  }
  if (maxPrice.value) {
    return `Dưới ${maxPrice.value.toLocaleString()}đ`
  }
  return ''
}

const hasActiveFilters = computed(() => {
  return (
    !!selectedCategory.value ||
    !!searchQuery.value ||
    minPrice.value !== null ||
    maxPrice.value !== null ||
    selectedBrands.value.length > 0 ||
    selectedAuthors.value.length > 0 ||
    selectedPublishers.value.length > 0 ||
    selectedRating.value !== null ||
    onlyInStock.value ||
    isDiscounted.value ||
    !!selectedSubOption.value
  )
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const max = totalPages.value
  const current = currentPage.value
  let start = Math.max(1, current - 2)
  let end = Math.min(max, current + 2)

  if (end - start < 4) {
    if (start === 1) end = Math.min(max, start + 4)
    else if (end === max) start = Math.max(1, end - 4)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

function toggleRatingFilter(stars: number) {
  if (selectedRating.value === stars) {
    selectedRating.value = null
  } else {
    selectedRating.value = stars
  }
  applyFilters()
}

watch(
  [selectedBrands, selectedAuthors, selectedPublishers],
  () => {
    currentPage.value = 1
    fetchProducts()
  },
  { deep: true },
)

const activeSubOptions = computed(() => {
  const cat = categories.value.find((c) => c._id === selectedCategory.value)
  if (cat && cat.optionsLabel && cat.optionsType && cat.options && cat.options.length > 0) {
    return {
      label: cat.optionsLabel,
      type: cat.optionsType as 'grid' | 'pills',
      options: cat.options,
    }
  }
  return null
})

onMounted(() => {
  categoryService
    .getAll()
    .then((catRes) => {
      categories.value = catRes.data.filter((c: any) => !c.parentId)
    })
    .catch((err) => {
      console.error('Error fetching categories', err)
    })
  fetchProducts()
})

watch(
  () => route.query,
  (newQuery) => {
    selectedCategory.value = (newQuery.category as string) || ''
    searchQuery.value = (newQuery.q as string) || ''
    isDiscounted.value = newQuery.discounted === 'true'
    selectedSubOption.value = ''
    fetchProducts()
  },
)

async function fetchProducts() {
  loading.value = true
  try {
    const combinedQ = [searchQuery.value, selectedSubOption.value].filter(Boolean).join(' ')

    const params: any = {
      page: currentPage.value,
      limit,
      category: selectedCategory.value || undefined,
      q: combinedQ || undefined,
      minPrice: minPrice.value || undefined,
      maxPrice: maxPrice.value || undefined,
      sort: sortBy.value,
      discounted: isDiscounted.value ? true : undefined,
      brand: selectedBrands.value.length > 0 ? selectedBrands.value.join(',') : undefined,
      author: selectedAuthors.value.length > 0 ? selectedAuthors.value.join(',') : undefined,
      publisher: selectedPublishers.value.length > 0 ? selectedPublishers.value.join(',') : undefined,
      minRating: selectedRating.value || undefined,
      inStock: onlyInStock.value ? true : undefined,
    }
    const res: any = await productService.getAll(params)
    const items = Array.isArray(res.data) ? res.data : res.data?.data || []
    products.value = items
    totalProducts.value = res.meta?.total || res.data?.total || items.length
    totalPages.value = res.meta?.totalPages || res.data?.totalPages || 1
  } catch (err) {
    toast.error('Lỗi khi tải danh sách sản phẩm')
  } finally {
    loading.value = false
  }
}

function selectCategory(catId: string) {
  selectedCategory.value = catId
  selectedSubOption.value = ''
  currentPage.value = 1
  router.push({
    path: '/products',
    query: {
      ...route.query,
      category: catId || undefined,
    },
  })
}

function quickSearch(kw: string) {
  searchQuery.value = kw
  currentPage.value = 1
  router.push({
    path: '/products',
    query: {
      ...route.query,
      q: kw,
    },
  })
}

function clearSearch() {
  searchQuery.value = ''
  currentPage.value = 1
  router.push({
    path: '/products',
    query: {
      ...route.query,
      q: undefined,
    },
  })
}

function clearPriceFilter() {
  minPrice.value = null
  maxPrice.value = null
  applyFilters()
}

function removeBrand(br: string) {
  selectedBrands.value = selectedBrands.value.filter((b) => b !== br)
}

function removeAuthor(au: string) {
  selectedAuthors.value = selectedAuthors.value.filter((a) => a !== au)
}

function removePublisher(pub: string) {
  selectedPublishers.value = selectedPublishers.value.filter((p) => p !== pub)
}

function clearAllFilters() {
  selectedCategory.value = ''
  searchQuery.value = ''
  selectedSubOption.value = ''
  minPrice.value = null
  maxPrice.value = null
  selectedBrands.value = []
  selectedAuthors.value = []
  selectedPublishers.value = []
  selectedRating.value = null
  onlyInStock.value = false
  isDiscounted.value = false
  currentPage.value = 1
  router.push({ path: '/products' })
}

function toggleSubOption(opt: string) {
  selectedSubOption.value = selectedSubOption.value === opt ? '' : opt
  currentPage.value = 1
  fetchProducts()
}

function applyFilters() {
  currentPage.value = 1
  fetchProducts()
}

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchProducts()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function addToCart(product: Product) {
  cartStore.addToCart(product)
  toast.success(`Đã thêm "${product.name}" vào giỏ hàng`)
}
</script>
