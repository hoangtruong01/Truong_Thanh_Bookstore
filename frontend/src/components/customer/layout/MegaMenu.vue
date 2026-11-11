<template>
  <div class="relative" @mouseenter="showMenu = true" @mouseleave="showMenu = false">
    <button
      type="button"
      class="flex items-center gap-1.5 bg-[#dc2626] hover:bg-[#b91c1c] rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
      :aria-expanded="showMenu"
      aria-haspopup="true"
    >
      <!-- Menu icon -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="2"
        stroke="currentColor"
        class="w-5 h-5 text-white"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      </svg>
      <span>Danh mục</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="2.5"
        stroke="currentColor"
        class="w-3.5 h-3.5 text-white/90 transition-transform duration-200"
        :class="{ 'rotate-180': showMenu }"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </button>

    <!-- Mega Menu Dropdown -->
    <div
      v-show="showMenu"
      data-testid="mega-menu-panel"
      class="absolute left-0 top-full pt-3 z-50 w-[700px] transition-all duration-200"
    >
      <div class="bg-white border border-slate-200 rounded-3xl shadow-xl flex overflow-hidden min-h-[350px] h-[450px]">
        <!-- Left Sidebar: Parent Categories -->
        <div class="w-2/5 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto space-y-1">
          <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">
            Danh mục sản phẩm
          </div>
          <button
            v-for="cat in parentCategories"
            :key="cat._id"
            type="button"
            class="w-full text-left px-4 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-between group/item"
            :class="
              activeParent?._id === cat._id
                ? 'bg-[#dc2626] text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            "
            @mouseenter="activeParent = cat"
            @click="navigateToCategory(cat._id)"
          >
            <span class="truncate text-slate-700" :class="{ 'text-white': activeParent?._id === cat._id }">{{
              cat.name
            }}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2.5"
              stroke="currentColor"
              class="w-3.5 h-3.5 opacity-60 group-hover/item:translate-x-0.5 transition-transform"
              :class="activeParent?._id === cat._id ? 'text-white' : 'text-slate-400'"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        <!-- Right Panel: Subcategories or Products -->
        <div class="w-3/5 p-6 overflow-y-auto bg-white flex flex-col text-slate-800">
          <div v-if="activeParent" class="space-y-6 flex-grow">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-[#dc2626]"></span>
                {{ activeParent.name }}
              </h3>
              <button
                type="button"
                class="text-[11px] font-bold text-[#dc2626] hover:text-[#b91c1c] transition-colors cursor-pointer"
                @click="navigateToCategory(activeParent._id)"
              >
                Xem tất cả &gt;
              </button>
            </div>

            <!-- Subcategories Grid (if any subcategories exist) -->
            <div v-if="activeSubcategories.length > 0" class="grid grid-cols-2 gap-6">
              <div v-for="sub in activeSubcategories" :key="sub._id" class="space-y-2">
                <router-link
                  :to="`/products?category=${sub._id}`"
                  class="text-xs font-black text-slate-800 hover:text-[#dc2626] transition-colors block"
                  @click="showMenu = false"
                >
                  {{ sub.name }}
                </router-link>
                <!-- Level 3 Grandchildren links (TT-012) -->
                <div v-if="childrenOf(sub._id).length > 0" class="space-y-1 pl-2 border-l-2 border-red-100">
                  <router-link
                    v-for="grand in childrenOf(sub._id)"
                    :key="grand._id"
                    :to="`/products?category=${grand._id}`"
                    class="text-[11px] text-slate-500 hover:text-[#dc2626] font-medium block transition-colors truncate"
                    @click="showMenu = false"
                  >
                    • {{ grand.name }}
                  </router-link>
                </div>
              </div>
            </div>

            <!-- Fallback: Show Products in this Category -->
            <div v-else-if="activeParent.products && activeParent.products.length > 0" class="space-y-3">
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sản phẩm nổi bật</div>
              <div class="grid grid-cols-1 gap-2.5">
                <router-link
                  v-for="prod in activeParent.products.slice(0, 4)"
                  :key="prod._id"
                  :to="`/products?q=${encodeURIComponent(prod.name)}`"
                  class="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-xs transition-all group/prod cursor-pointer"
                  @click="showMenu = false"
                >
                  <img
                    :src="prod.images && prod.images[0] ? prod.images[0] : PRODUCT_FALLBACK_IMAGE"
                    class="w-10 h-10 object-cover rounded-xl bg-slate-50 flex-shrink-0"
                    alt="Product thumbnail"
                    loading="lazy"
                    decoding="async"
                  />
                  <div class="min-w-0 flex-1">
                    <div
                      class="text-xs font-bold text-slate-800 group-hover/prod:text-[#dc2626] truncate leading-snug"
                    >
                      {{ prod.name }}
                    </div>
                    <div class="text-[11px] font-bold text-[#dc2626] mt-0.5">
                      {{ formatCurrency(prod.discountPrice || prod.price) }}
                    </div>
                  </div>
                </router-link>
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-else
              class="flex flex-col items-center justify-center h-64 text-center text-slate-400 space-y-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-8 h-8 opacity-60"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z"
                />
              </svg>
              <p class="text-xs font-bold">Chưa có sản phẩm hoặc danh mục con</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Category } from '@/types'
import { formatCurrency } from '@/utils/helpers'
import { getChildCategories } from '@/utils/category'
import { PRODUCT_FALLBACK_IMAGE } from './searchConfig'

const props = defineProps<{
  /** Full flat category list (needed to resolve level 2 and 3 children). */
  categories: Category[]
  /** Root categories shown in the left column. */
  parentCategories: Category[]
}>()

const router = useRouter()
const showMenu = ref(false)
const activeParent = ref<Category | null>(null)

// Highlight the first root category once the list arrives (or when the active one disappears).
watch(
  () => props.parentCategories,
  (parents) => {
    const current = activeParent.value
    if (!current || !parents.some((p) => p._id === current._id)) {
      activeParent.value = parents[0] ?? null
    }
  },
  { immediate: true },
)

const activeSubcategories = computed(() => {
  const parent = activeParent.value
  if (!parent || parent.slug === 'combo') return []
  return getChildCategories(props.categories, parent._id)
})

function childrenOf(parentId: string) {
  return getChildCategories(props.categories, parentId)
}

function navigateToCategory(categoryId: string) {
  showMenu.value = false
  router.push(`/products?category=${categoryId}`)
}
</script>
