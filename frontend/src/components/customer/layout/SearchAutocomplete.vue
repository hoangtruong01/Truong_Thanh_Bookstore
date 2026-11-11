<template>
  <div :class="cls.root">
    <form @submit.prevent="handleSearch">
      <div class="relative w-full">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="isDesktop ? 'Tìm bút, sổ tay, giấy A4, kẹp giấy...' : 'Tìm kiếm sản phẩm...'"
          aria-label="Tìm kiếm sản phẩm"
          :class="cls.input"
          @focus="handleFocus"
          @blur="handleBlur"
        />
        <button type="submit" aria-label="Tìm kiếm" :class="cls.submit">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2.5"
            stroke="currentColor"
            :class="cls.submitIcon"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z"
            />
          </svg>
        </button>
      </div>
    </form>

    <!-- Autocomplete Dropdown -->
    <div v-if="showDropdown" data-testid="search-dropdown" :class="cls.dropdown" style="contain: layout">
      <!-- Empty Search Query (Popular + History) -->
      <div v-if="!searchQuery.trim()">
        <!-- Popular Searches -->
        <div :class="cls.popularWrap">
          <div :class="cls.popularTitle">
            <span>🔥</span> {{ $t('search.popular') }}
          </div>
          <div :class="cls.chipList">
            <button
              v-for="keyword in POPULAR_SEARCHES"
              :key="keyword"
              type="button"
              :class="cls.popularChip"
              @mousedown="selectSuggestion(keyword)"
            >
              {{ keyword }}
            </button>
          </div>
        </div>

        <!-- Search History -->
        <div v-if="searchHistory.length > 0">
          <div :class="cls.historyTitle">
            <span :class="cls.historyLabel"><span>⏱️</span> {{ $t('search.history') }}</span>
            <button :class="cls.clearHistory" @mousedown="clearAllHistory">Xóa tất cả</button>
          </div>
          <div class="space-y-1">
            <div
              v-for="(item, idx) in searchHistory"
              :key="item"
              :class="cls.historyRow"
              @mousedown="selectSuggestion(item)"
            >
              <span :class="cls.historyText">{{ item }}</span>
              <button :class="cls.historyRemove" title="Xóa" @mousedown="removeHistoryItem(idx, $event)">
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Search Query -->
      <div v-else>
        <!-- Matching Categories Section (desktop) -->
        <div v-if="isDesktop && suggestedCategories.length > 0" class="mb-4">
          <div
            class="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"
          >
            <span>📂</span> Danh mục liên quan
          </div>
          <div class="flex flex-wrap gap-2">
            <router-link
              v-for="cat in suggestedCategories"
              :key="cat._id"
              :to="`/products?category=${cat._id}`"
              class="bg-red-50 hover:bg-red-100 text-[#dc2626] font-bold text-xs px-3 py-1.5 rounded-xl transition-colors cursor-pointer border border-red-200/60"
              @mousedown="showDropdown = false"
            >
              {{ cat.name }}
            </router-link>
          </div>
        </div>

        <!-- Suggestions Section -->
        <div v-if="visibleSuggestions.length > 0" :class="cls.suggestWrap">
          <div :class="cls.suggestTitle">
            <svg
              v-if="isDesktop"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2.5"
              stroke="currentColor"
              class="w-4 h-4 text-slate-500"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            {{ $t('search.suggestions') }}
          </div>
          <div :class="cls.chipList">
            <div
              v-for="tag in visibleSuggestions"
              :key="tag"
              :class="cls.suggestChip"
              @mousedown="selectSuggestion(tag)"
            >
              {{ tag }}
            </div>
          </div>
        </div>

        <!-- Products Section -->
        <div v-if="searchResults.length > 0" :class="cls.productsWrap">
          <div :class="cls.productsTitle">
            <svg
              v-if="isDesktop"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2.5"
              stroke="currentColor"
              class="w-4 h-4 text-slate-500"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
              />
            </svg>
            {{ $t('search.results') }}
          </div>
          <div :class="cls.productsGrid">
            <div
              v-for="prod in searchResults"
              :key="prod._id"
              :class="cls.productRow"
              @mousedown="selectProduct(prod.slug || prod._id)"
            >
              <img
                :src="prod.images && prod.images[0] ? prod.images[0] : PRODUCT_FALLBACK_IMAGE"
                :class="cls.productImage"
                alt="Product image"
                loading="lazy"
                decoding="async"
              />
              <div class="min-w-0 flex-1">
                <div :class="cls.productName">
                  {{ prod.name }}
                </div>
                <div v-if="isDesktop" class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-xs font-bold text-red-600">
                    {{ formatCurrency(displayPrice(prod)) }}
                  </span>
                </div>
                <div v-else class="text-[10px] font-bold text-red-600 mt-0.5">
                  {{ formatCurrency(displayPrice(prod)) }}
                </div>
                <div v-if="isDesktop" class="flex items-center justify-between text-[9px] text-slate-400 mt-0.5">
                  <span class="text-yellow-600 font-bold">★ {{ (prod.rating || 4.8).toFixed(1) }}</span>
                  <span>Đã bán {{ prod.sold || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="!loadingSearch" :class="cls.empty">
          {{ $t('search.empty') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { productService } from '@/services/product.service'
import { formatCurrency } from '@/utils/helpers'
import {
  COMMON_KEYWORDS,
  DEFAULT_SUGGESTIONS,
  POPULAR_SEARCHES,
  PRODUCT_FALLBACK_IMAGE,
  SEARCH_HISTORY_KEY,
  SEARCH_HISTORY_LIMIT,
  normalizeSearchText,
} from './searchConfig'

interface SearchProduct {
  _id: string
  slug?: string
  name: string
  images?: string[]
  price: number
  discountPrice?: number
  rating?: number
  sold?: number
}

interface SuggestedCategory {
  _id: string
  name: string
}

const props = withDefaults(defineProps<{ variant?: 'desktop' | 'mobile' }>(), {
  variant: 'desktop',
})

const router = useRouter()
const isDesktop = computed(() => props.variant === 'desktop')

const DESKTOP_CLASSES = {
  root: 'flex-grow relative',
  input:
    'w-full bg-slate-100 border border-slate-200 rounded-full py-2.5 pl-5 pr-20 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-transparent transition-all placeholder:text-slate-400',
  submit:
    'absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#dc2626] hover:bg-[#b91c1c] text-white p-2.5 px-5 rounded-full transition-colors cursor-pointer flex items-center justify-center',
  submitIcon: 'w-4 h-4',
  dropdown:
    'absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl z-50 p-6',
  popularWrap: 'mb-4',
  popularTitle:
    'text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5',
  chipList: 'flex flex-wrap gap-2',
  popularChip:
    'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs px-3.5 py-1.5 rounded-full transition-colors cursor-pointer border border-slate-200/50 dark:border-slate-700',
  historyTitle:
    'text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between',
  historyLabel: 'flex items-center gap-1.5',
  clearHistory: 'text-[10px] font-black text-red-500 hover:underline hover:text-red-600 cursor-pointer',
  historyRow:
    'flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group/history',
  historyText: 'text-xs text-slate-600 dark:text-slate-400 font-medium group-hover/history:text-[#dc2626]',
  historyRemove: 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-xs',
  suggestWrap: 'mb-5',
  suggestTitle:
    'text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5',
  suggestChip:
    'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer select-none',
  productsWrap: 'border-t border-slate-100 dark:border-slate-800 pt-4',
  productsTitle:
    'text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2',
  productsGrid: 'grid grid-cols-3 gap-4',
  productRow:
    'flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all cursor-pointer group',
  productImage:
    'w-12 h-12 object-cover rounded-xl bg-slate-50 border border-slate-100 dark:border-slate-800 flex-shrink-0',
  productName:
    'text-xs font-bold text-slate-850 dark:text-slate-200 group-hover:text-[#dc2626] line-clamp-1 leading-snug',
  empty: 'text-center py-6 text-xs text-slate-400 font-bold',
}

const MOBILE_CLASSES: typeof DESKTOP_CLASSES = {
  root: 'block md:hidden px-4 pb-3 border-t border-slate-100/50 pt-2 bg-white relative',
  input:
    'w-full bg-slate-100 border border-slate-200 rounded-full py-2 pl-4 pr-12 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-transparent transition-all placeholder:text-slate-400',
  submit:
    'absolute right-1 top-1/2 -translate-y-1/2 bg-[#dc2626] hover:bg-[#b91c1c] text-white p-1.5 px-3 rounded-full transition-colors cursor-pointer',
  submitIcon: 'w-3.5 h-3.5',
  dropdown:
    'absolute left-4 right-4 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-4',
  popularWrap: 'mb-3',
  popularTitle:
    'text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1',
  chipList: 'flex flex-wrap gap-1.5',
  popularChip:
    'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] px-2.5 py-1.5 rounded-full transition-colors cursor-pointer border border-slate-200/50 dark:border-slate-700',
  historyTitle:
    'text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center justify-between',
  historyLabel: 'flex items-center gap-1',
  clearHistory: 'text-[9px] font-black text-red-500 hover:underline cursor-pointer',
  historyRow:
    'flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer group/history',
  historyText: 'text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate group-hover/history:text-[#dc2626]',
  historyRemove: 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 text-[10px]',
  suggestWrap: 'mb-3',
  suggestTitle: 'text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2',
  suggestChip:
    'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer select-none',
  productsWrap: 'border-t border-slate-100 dark:border-slate-800 pt-3',
  productsTitle: 'text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2',
  productsGrid: 'grid grid-cols-1 gap-2',
  productRow:
    'flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all cursor-pointer group',
  productImage:
    'w-9 h-9 object-cover rounded-lg bg-slate-50 border border-slate-100 dark:border-slate-800 flex-shrink-0',
  productName:
    'text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#dc2626] line-clamp-1 leading-snug',
  empty: 'text-center py-4 text-[10px] text-slate-400 font-bold',
}

const cls = computed(() => (isDesktop.value ? DESKTOP_CLASSES : MOBILE_CLASSES))

const searchQuery = ref('')
const showDropdown = ref(false)
const searchResults = ref<SearchProduct[]>([])
const suggestedCategories = ref<SuggestedCategory[]>([])
const suggestedKeywords = ref<string[]>([])
const loadingSearch = ref(false)
const searchHistory = ref<string[]>(readSearchHistory())

function readSearchHistory(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function writeSearchHistory() {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory.value))
  } catch {
    // storage unavailable (private mode / quota) — history is a convenience only
  }
}

function saveSearchQuery(q: string) {
  const trimmed = q.trim()
  if (!trimmed) return
  const index = searchHistory.value.indexOf(trimmed)
  if (index > -1) searchHistory.value.splice(index, 1)
  searchHistory.value.unshift(trimmed)
  if (searchHistory.value.length > SEARCH_HISTORY_LIMIT) searchHistory.value.pop()
  writeSearchHistory()
}

function removeHistoryItem(index: number, event: Event) {
  event.stopPropagation()
  searchHistory.value.splice(index, 1)
  writeSearchHistory()
}

function clearAllHistory(event: Event) {
  event.stopPropagation()
  searchHistory.value = []
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY)
  } catch {
    // ignore
  }
}

/** Local keyword suggestions (fallback when the API returns no keywords). */
const suggestions = computed(() => {
  const raw = searchQuery.value.trim()
  const q = normalizeSearchText(raw)
  if (!q) return [...DEFAULT_SUGGESTIONS]
  const filtered = COMMON_KEYWORDS.filter((k) => normalizeSearchText(k).includes(q))
  if (filtered.length === 0) {
    return [raw, `bút ${raw}`, `sổ ${raw}`, `giấy ${raw}`].slice(0, 8)
  }
  return filtered.slice(0, 8)
})

const visibleSuggestions = computed(() =>
  isDesktop.value && suggestedKeywords.value.length > 0 ? suggestedKeywords.value : suggestions.value,
)

function displayPrice(prod: SearchProduct): number {
  return prod.discountPrice && prod.discountPrice > 0 ? prod.discountPrice : prod.price
}

function clearResults() {
  searchResults.value = []
  suggestedCategories.value = []
  suggestedKeywords.value = []
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let blurTimer: ReturnType<typeof setTimeout> | null = null

async function performAutocomplete(query: string) {
  const trimmed = query.trim()
  if (!trimmed) {
    clearResults()
    return
  }
  loadingSearch.value = true
  try {
    const res: any = await productService.getSuggestions(trimmed, 6)
    const data = res.data?.data || res.data || {}
    searchResults.value = data.products || []
    suggestedCategories.value = data.categories || []
    suggestedKeywords.value = data.keywords || []
  } catch {
    try {
      const fallbackRes: any = await productService.search(trimmed)
      searchResults.value = (fallbackRes.data?.data || fallbackRes.data || []).slice(0, 6)
    } catch {
      // silent fail — the dropdown falls back to the "no results" message
    }
  } finally {
    loadingSearch.value = false
  }
}

watch(searchQuery, (newVal) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!newVal.trim()) {
    clearResults()
    return
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    performAutocomplete(newVal)
  }, 250)
})

function handleFocus() {
  // Re-read so the desktop and mobile instances share the latest history.
  searchHistory.value = readSearchHistory()
  showDropdown.value = true
}

function handleBlur() {
  if (blurTimer) clearTimeout(blurTimer)
  blurTimer = setTimeout(() => {
    blurTimer = null
    showDropdown.value = false
  }, 200)
}

function handleSearch() {
  const q = searchQuery.value.trim()
  if (q) {
    saveSearchQuery(q)
    router.push(`/products?q=${encodeURIComponent(q)}`)
    showDropdown.value = false
  }
}

function selectSuggestion(tag: string) {
  searchQuery.value = tag
  showDropdown.value = false
  handleSearch()
}

function selectProduct(productIdOrSlug: string) {
  showDropdown.value = false
  router.push(`/products/${productIdOrSlug}`)
}

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (blurTimer) clearTimeout(blurTimer)
})
</script>
