<template>
  <div class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <!-- Breadcrumb -->
    <Breadcrumb :items="breadcrumbItems" />

    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Filters Sidebar -->
      <FilterSidebar
        v-model:min-price="minPrice"
        v-model:max-price="maxPrice"
        v-model:brands="selectedBrands"
        v-model:authors="selectedAuthors"
        v-model:publishers="selectedPublishers"
        v-model:rating="selectedRating"
        v-model:only-in-stock="onlyInStock"
        v-model:discounted="isDiscounted"
        :categories="categories"
        :selected-category="selectedCategory"
        :selected-product-type="selectedProductType"
        :selected-sub-option="selectedSubOption"
        @select-category="selectCategory"
        @select-product-type="selectProductType"
        @toggle-sub-option="toggleSubOption"
        @apply="applyFilters"
      />

      <!-- Products Area -->
      <div class="flex-grow space-y-6">
        <!-- SEO-TASK-008: H1 + mô tả danh mục (dữ liệu thật từ Category.description) -->
        <header class="space-y-1">
          <h1 class="text-xl md:text-2xl font-black text-slate-900 leading-tight">{{ pageHeading }}</h1>
          <p v-if="currentCategory?.description" class="text-sm text-slate-600 leading-relaxed max-w-3xl">
            {{ currentCategory.description }}
          </p>
        </header>

        <!-- Active Filter Tags Toolbar -->
        <ActiveFilterChips
          v-if="hasActiveFilters"
          :category-name="selectedCategoryName"
          :search-query="searchQuery"
          :min-price="minPrice"
          :max-price="maxPrice"
          :brands="selectedBrands"
          :authors="selectedAuthors"
          :publishers="selectedPublishers"
          :rating="selectedRating"
          :only-in-stock="onlyInStock"
          :discounted="isDiscounted"
          @clear-category="selectCategory('')"
          @clear-search="clearSearch"
          @clear-price="clearPriceFilter"
          @remove-brand="removeBrand"
          @remove-author="removeAuthor"
          @remove-publisher="removePublisher"
          @clear-rating="clearRatingFilter"
          @clear-stock="clearStockFilter"
          @clear-discount="clearDiscountFilter"
          @clear-all="clearAllFilters"
        />

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
              class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#dc2626] cursor-pointer"
              @change="applyFilters"
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
        <SkeletonLoader v-if="loading" type="card" :count="10" />

        <EmptyState
          v-else-if="products.length === 0"
          icon="🔍"
          title="Không tìm thấy sản phẩm nào"
          description="Vui lòng điều chỉnh lại tiêu chí bộ lọc, mức giá hoặc thử tìm kiếm với các từ khóa phổ biến bên dưới."
        >
          <template #action>
            <div class="flex flex-wrap justify-center gap-1.5 pt-2">
              <button
                v-for="kw in ['Bút bi', 'Sách giáo khoa', 'Tập vở', 'Deli', 'Thiên Long']"
                :key="kw"
                type="button"
                class="bg-slate-100 hover:bg-red-50 hover:text-[#dc2626] text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                @click="quickSearch(kw)"
              >
                {{ kw }}
              </button>
            </div>
          </template>
        </EmptyState>

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
              :disabled="currentPage === 1"
              class="w-9 h-9 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              @click="changePage(currentPage - 1)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
            </button>

            <div class="flex items-center gap-1">
              <button
                v-for="p in visiblePages"
                :key="p"
                class="w-9 h-9 text-xs font-bold rounded-xl transition-all cursor-pointer"
                :class="[p === currentPage ? 'bg-[#dc2626] text-white shadow-xs' : 'hover:bg-slate-100 text-slate-700 border border-slate-200']"
                @click="changePage(p)"
              >
                {{ p }}
              </button>
            </div>

            <button
              :disabled="currentPage === totalPages"
              class="w-9 h-9 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              @click="changePage(currentPage + 1)"
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
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import EmptyState from '@/components/EmptyState.vue'
import FilterSidebar from '@/components/customer/catalog/FilterSidebar.vue'
import ActiveFilterChips from '@/components/customer/catalog/ActiveFilterChips.vue'
import type { Product, Category } from '@/types'
import { useSeoMeta, INDEX_ROBOTS, NOINDEX_ROBOTS } from '@/composables/useSeoMeta'
import { toMetaDescription } from '@/utils/seo'
import { categoryPathToBreadcrumbs, findCategoryById, getCategoryPath } from '@/utils/category'
import Breadcrumb from '@/components/Breadcrumb.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const toast = useToast()

const categories = ref<Category[]>([])
const selectedCategory = ref((route.query.category as string) || '')
const selectedProductType = ref((route.query.productType as string) || '')

const breadcrumbItems = computed(() => [
  { label: 'Trang chủ', to: '/' },
  { label: 'Sản phẩm', to: '/products' },
  ...categoryPathToBreadcrumbs(getCategoryPath(categories.value, selectedCategory.value)),
])

// SEO-TASK-008: metadata riêng theo danh mục; tìm kiếm / lọc khuyến mãi => noindex, follow
const currentCategory = computed(() => {
  const key = String(route.query.category || '')
  if (!key) return null
  return categories.value.find((c) => String(c._id) === key || c.slug === key) || null
})

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  BOOK: 'Sách',
  STATIONERY: 'Văn phòng phẩm',
  OTHER: 'Sản phẩm khác',
}

const pageHeading = computed(() => {
  const q = String(route.query.q || '').trim()
  if (q) return `Kết quả tìm kiếm "${q}"`
  if (currentCategory.value) return currentCategory.value.name
  if (route.query.discounted === 'true') return 'Sản phẩm đang khuyến mãi'
  const typeLabel = PRODUCT_TYPE_LABELS[String(route.query.productType || '')]
  return typeLabel || 'Tất cả sản phẩm'
})

useSeoMeta(() => {
  const query = route.query
  const cat = currentCategory.value
  const isSearch = !!String(query.q || '').trim()
  const indexable = !isSearch && query.discounted !== 'true'
  const description = cat
    ? toMetaDescription(cat.description) ||
      `Mua ${cat.name} chính hãng tại Trường Thành Stationery. Giá rõ ràng, giao hàng toàn quốc, đổi trả linh hoạt.`
    : 'Sách, văn phòng phẩm và dụng cụ học tập chính hãng tại Trường Thành Stationery. Giá rõ ràng, giao hàng toàn quốc.'
  return {
    title: pageHeading.value,
    description,
    canonicalQuery: ['category', 'productType'],
    robots: indexable ? INDEX_ROBOTS : NOINDEX_ROBOTS,
  }
})

const selectedCategoryName = computed(() => findCategoryById(categories.value, selectedCategory.value)?.name ?? '')

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
const selectedBrands = ref<string[]>([])
const selectedAuthors = ref<string[]>([])
const selectedPublishers = ref<string[]>([])
const selectedRating = ref<number | null>(null)
const onlyInStock = ref(false)

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

watch(
  [selectedBrands, selectedAuthors, selectedPublishers],
  () => {
    currentPage.value = 1
    fetchProducts()
  },
  { deep: true },
)

onMounted(() => {
  categoryService
    .getAll()
    .then((catRes) => {
      const raw = catRes.data?.data || catRes.data || []
      categories.value = Array.isArray(raw) ? raw : []
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
    selectedProductType.value = (newQuery.productType as string) || ''
    searchQuery.value = (newQuery.q as string) || ''
    isDiscounted.value = newQuery.discounted === 'true'
    selectedSubOption.value = ''
    currentPage.value = 1
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
      productType: selectedProductType.value || undefined,
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
      status: 'ACTIVE',
    }
    const res: any = await productService.getAll(params)
    const items = Array.isArray(res.data) ? res.data : res.data?.data || []
    products.value = items
    totalProducts.value = res.meta?.total || res.data?.total || items.length
    totalPages.value = res.meta?.totalPages || res.data?.totalPages || 1
  } catch {
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

function selectProductType(type: string) {
  selectedProductType.value = type
  currentPage.value = 1
  router.push({
    path: '/products',
    query: {
      ...route.query,
      productType: type || undefined,
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

function clearRatingFilter() {
  selectedRating.value = null
  applyFilters()
}

function clearStockFilter() {
  onlyInStock.value = false
  applyFilters()
}

function clearDiscountFilter() {
  isDiscounted.value = false
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
