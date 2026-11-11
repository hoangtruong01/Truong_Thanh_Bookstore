<template>
  <aside class="w-full lg:w-72 flex-shrink-0 space-y-5">
    <!-- Categories -->
    <!-- Categories Filter (TT-012 Multi-level Category Tree) -->
    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
        <span>Danh mục sản phẩm</span>
        <span v-if="selectedCategory" class="text-[10px] font-bold text-[#dc2626] hover:underline cursor-pointer" @click="emit('select-category', '')">
          Xóa chọn
        </span>
      </h3>
      <div class="space-y-1 max-h-80 overflow-y-auto pr-1">
        <button
          class="w-full text-left text-xs font-bold py-1.5 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between"
          :class="[!selectedCategory ? 'bg-red-50 text-[#dc2626]' : 'text-slate-600 hover:bg-slate-50']"
          @click="emit('select-category', '')"
        >
          <span>Tất cả sản phẩm</span>
        </button>
        <div v-for="parent in parentCategories" :key="parent._id" class="space-y-0.5">
          <div class="flex items-center justify-between group rounded-xl hover:bg-slate-50 transition-all">
            <button
              class="flex-1 text-left text-xs font-semibold py-1.5 px-2.5 rounded-xl cursor-pointer truncate"
              :class="[selectedCategory === parent._id ? 'bg-red-50 text-[#dc2626] font-bold' : 'text-slate-700']"
              @click="emit('select-category', parent._id)"
            >
              <span class="truncate">{{ parent.name }}</span>
            </button>
            <button
              v-if="getChildren(parent._id).length"
              type="button"
              class="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer text-xs"
              :title="isBranchActive(parent._id) ? 'Thu gọn' : 'Mở rộng'"
              @click.stop="toggleCategoryExpand(parent._id)"
            >
              <span class="text-[10px]">{{ isBranchActive(parent._id) ? '▼' : '▶' }}</span>
            </button>
          </div>

          <!-- Level 2 Subcategories -->
          <div v-if="getChildren(parent._id).length && isBranchActive(parent._id)" class="pl-3 border-l-2 border-red-100 ml-2 space-y-0.5 my-1">
            <div v-for="sub in getChildren(parent._id)" :key="sub._id" class="space-y-0.5">
              <div class="flex items-center justify-between group rounded-lg hover:bg-slate-50 transition-all">
                <button
                  class="flex-1 text-left text-[11px] font-medium py-1 px-2 rounded-lg cursor-pointer truncate"
                  :class="[selectedCategory === sub._id ? 'bg-red-100/70 text-[#dc2626] font-bold' : 'text-slate-600 hover:text-slate-900']"
                  @click="emit('select-category', sub._id)"
                >
                  <span class="truncate">↳ {{ sub.name }}</span>
                </button>
                <button
                  v-if="getChildren(sub._id).length"
                  type="button"
                  class="p-1 text-slate-400 hover:text-slate-700 cursor-pointer text-[10px]"
                  @click.stop="toggleCategoryExpand(sub._id)"
                >
                  <span>{{ isBranchActive(sub._id) ? '▼' : '▶' }}</span>
                </button>
              </div>

              <!-- Level 3 Grandchildren -->
              <div v-if="getChildren(sub._id).length && isBranchActive(sub._id)" class="pl-2.5 border-l border-slate-200 ml-2 space-y-0.5 my-0.5">
                <button
                  v-for="grand in getChildren(sub._id)"
                  :key="grand._id"
                  class="w-full text-left text-[10.5px] py-1 px-1.5 rounded cursor-pointer truncate block"
                  :class="[selectedCategory === grand._id ? 'text-[#dc2626] font-bold bg-red-50' : 'text-slate-500 hover:text-slate-800']"
                  @click="emit('select-category', grand._id)"
                >
                  • {{ grand.name }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Type Filter (TT-028) -->
    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
        <span>Loại sản phẩm</span>
        <span v-if="selectedProductType" class="text-[10px] font-bold text-[#dc2626] hover:underline cursor-pointer" @click="emit('select-product-type', '')">
          Xóa chọn
        </span>
      </h3>
      <div class="grid grid-cols-1 gap-1.5">
        <button
          type="button"
          class="w-full text-left text-xs font-medium py-1.5 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between"
          :class="!selectedProductType ? 'bg-red-50 text-[#dc2626] font-bold' : 'text-slate-600 hover:bg-slate-50'"
          @click="emit('select-product-type', '')"
        >
          <span>Tất cả</span>
        </button>
        <button
          type="button"
          class="w-full text-left text-xs font-medium py-1.5 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between"
          :class="selectedProductType === 'BOOK' ? 'bg-red-50 text-[#dc2626] font-bold' : 'text-slate-600 hover:bg-slate-50'"
          @click="emit('select-product-type', 'BOOK')"
        >
          <span>📚 Sách & Ấn phẩm</span>
        </button>
        <button
          type="button"
          class="w-full text-left text-xs font-medium py-1.5 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between"
          :class="selectedProductType === 'STATIONERY' ? 'bg-red-50 text-[#dc2626] font-bold' : 'text-slate-600 hover:bg-slate-50'"
          @click="emit('select-product-type', 'STATIONERY')"
        >
          <span>✏️ Văn phòng phẩm</span>
        </button>
      </div>
    </div>

    <!-- Dynamic Sub-Options Filter -->
    <div v-if="activeSubOptions" class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-all duration-300">
      <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
        <span class="flex items-center gap-1.5">
          <span class="w-1.5 h-3 bg-[#dc2626] rounded-full"></span>
          {{ activeSubOptions.label }}
        </span>
        <span v-if="selectedSubOption" class="text-[10px] font-bold text-slate-400 hover:text-[#dc2626] cursor-pointer" @click="emit('toggle-sub-option', '')">
          Xóa
        </span>
      </h3>

      <!-- Grid Layout (e.g. for Grades 1-12) -->
      <div v-if="activeSubOptions.type === 'grid'" class="grid grid-cols-4 gap-1.5">
        <button
          v-for="opt in activeSubOptions.options"
          :key="opt"
          class="h-8 text-[11px] font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center"
          :class="[
            selectedSubOption === opt
              ? 'bg-[#dc2626] border-[#dc2626] text-white shadow-xs font-extrabold'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
          ]"
          @click="emit('toggle-sub-option', opt)"
        >
          {{ opt.replace('Lớp ', '') }}
        </button>
      </div>

      <!-- Pills Layout (e.g. for subjects, genres) -->
      <div v-else class="flex flex-wrap gap-1.5">
        <button
          v-for="opt in activeSubOptions.options"
          :key="opt"
          class="px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all cursor-pointer flex items-center justify-center"
          :class="[
            selectedSubOption === opt
              ? 'bg-[#dc2626] border-[#dc2626] text-white shadow-xs font-bold'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
          ]"
          @click="emit('toggle-sub-option', opt)"
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
          v-for="preset in PRICE_PRESETS"
          :key="preset.label"
          type="button"
          class="px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center truncate"
          :class="[
            isPricePresetActive(preset.min, preset.max)
              ? 'bg-red-50 border-red-200 text-[#dc2626] font-extrabold'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          ]"
          @click="applyPricePreset(preset.min, preset.max)"
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
          class="w-full bg-slate-900 hover:bg-[#dc2626] text-white font-bold py-2 px-3 rounded-xl text-xs transition-all cursor-pointer shadow-xs hover:shadow-md"
          @click="emit('apply')"
        >
          Áp dụng giá
        </button>
      </div>
    </div>

    <!-- Brand Filter (Checklist) -->
    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <h3 class="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Thương hiệu</h3>
      <div class="space-y-2 max-h-40 overflow-y-auto pr-1">
        <label v-for="br in BRAND_OPTIONS" :key="br" class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
          <input
            v-model="brands"
            type="checkbox"
            :value="br"
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
        <label v-for="au in AUTHOR_OPTIONS" :key="au" class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
          <input
            v-model="authors"
            type="checkbox"
            :value="au"
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
        <label v-for="pub in PUBLISHER_OPTIONS" :key="pub" class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
          <input
            v-model="publishers"
            type="checkbox"
            :value="pub"
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
          class="w-full text-left text-xs font-bold py-1.5 px-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          :class="[rating === stars ? 'bg-red-50 text-[#dc2626] border border-red-200/60' : 'text-slate-600 border border-transparent hover:bg-slate-50']"
          @click="toggleRatingFilter(stars)"
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
          v-model="onlyInStock"
          type="checkbox"
          class="rounded border-slate-300 text-[#dc2626] focus:ring-[#dc2626] w-3.5 h-3.5 cursor-pointer"
          @change="emit('apply')"
        />
        <span>Chỉ sản phẩm còn hàng</span>
      </label>
      <label class="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
        <input
          v-model="discounted"
          type="checkbox"
          class="rounded border-slate-300 text-[#dc2626] focus:ring-[#dc2626] w-3.5 h-3.5 cursor-pointer"
          @change="emit('apply')"
        />
        <span>Đang khuyến mãi 🔥</span>
      </label>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Category } from '@/types'
import { findCategoryById, getChildCategories, isCategoryAncestor } from '@/utils/category'

/**
 * Product-list filter sidebar. Presentational: the page owns every filter value (v-model)
 * and decides when to re-fetch. `apply` is emitted after a model update that should
 * trigger an immediate fetch (price preset, rating, stock, deals, "Áp dụng giá").
 * Brand / author / publisher lists re-fetch through the page's own watcher.
 */
const props = defineProps<{
  categories: Category[]
  selectedCategory: string
  selectedProductType: string
  selectedSubOption: string
}>()

const emit = defineEmits<{
  'select-category': [categoryId: string]
  'select-product-type': [productType: string]
  'toggle-sub-option': [option: string]
  apply: []
}>()

const minPrice = defineModel<number | null>('minPrice', { default: null })
const maxPrice = defineModel<number | null>('maxPrice', { default: null })
const brands = defineModel<string[]>('brands', { default: () => [] })
const authors = defineModel<string[]>('authors', { default: () => [] })
const publishers = defineModel<string[]>('publishers', { default: () => [] })
const rating = defineModel<number | null>('rating', { default: null })
const onlyInStock = defineModel<boolean>('onlyInStock', { default: false })
const discounted = defineModel<boolean>('discounted', { default: false })

const BRAND_OPTIONS = ['Thiên Long', 'Bến Nghé', 'Hồng Hà', 'Deli', 'Casio', 'Pentel', 'Plus', 'M&G']
const AUTHOR_OPTIONS = ['Nguyễn Nhật Ánh', 'Tô Hoài', 'Dale Carnegie', 'Hermann Hesse', 'Arthur Conan Doyle', 'J.K. Rowling']
const PUBLISHER_OPTIONS = ['NXB Trẻ', 'NXB Kim Đồng', 'NXB Giáo Dục', 'NXB Phụ Nữ', 'NXB Lao Động', 'NXB Tổng Hợp']

const PRICE_PRESETS: { label: string; min: number; max: number | null }[] = [
  { label: 'Dưới 50k', min: 0, max: 50000 },
  { label: '50k - 100k', min: 50000, max: 100000 },
  { label: '100k - 200k', min: 100000, max: 200000 },
  { label: 'Trên 200k', min: 200000, max: null },
]

const parentCategories = computed(() => props.categories.filter((c) => !c.parentId))
const expandedCategories = ref<Set<string>>(new Set())

function getChildren(parentId: string): Category[] {
  return getChildCategories(props.categories, parentId)
}

/** A branch is open when expanded by hand, selected, or an ancestor of the selected category. */
function isBranchActive(catId: string): boolean {
  if (expandedCategories.value.has(catId)) return true
  if (String(props.selectedCategory) === String(catId)) return true
  return isCategoryAncestor(props.categories, catId, props.selectedCategory)
}

function toggleCategoryExpand(catId: string) {
  if (expandedCategories.value.has(catId)) {
    expandedCategories.value.delete(catId)
  } else {
    expandedCategories.value.add(catId)
  }
}

const activeSubOptions = computed(() => {
  const cat = findCategoryById(props.categories, props.selectedCategory)
  if (cat && cat.optionsLabel && cat.optionsType && cat.options && cat.options.length > 0) {
    return {
      label: cat.optionsLabel,
      type: cat.optionsType as 'grid' | 'pills',
      options: cat.options,
    }
  }
  return null
})

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
  emit('apply')
}

function toggleRatingFilter(stars: number) {
  rating.value = rating.value === stars ? null : stars
  emit('apply')
}
</script>
