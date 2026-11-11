<template>
  <div
    v-if="open"
    data-testid="mobile-drawer"
    class="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-4 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto"
  >
    <!-- Category List for mobile -->
    <div class="space-y-2">
      <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Danh mục sản phẩm</div>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="cat in parentCategories"
          :key="cat._id"
          type="button"
          class="text-left px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          @click="navigateToCategory(cat._id)"
        >
          {{ cat.name }}
        </button>
      </div>
    </div>

    <!-- Quick user links for mobile -->
    <div class="border-t border-slate-100 pt-3 flex flex-col gap-2.5">
      <router-link to="/cart" class="flex items-center gap-2 text-xs font-bold text-slate-700 px-1">
        🛒 Giỏ hàng ({{ cartStore.itemsCount }})
      </router-link>
      <template v-if="authStore.isAuthenticated">
        <button
          class="w-full text-left flex items-center gap-2 text-xs font-bold text-slate-700 px-1 cursor-pointer"
          @click="emit('open-profile')"
        >
          👤 Thông tin tài khoản
        </button>
        <router-link to="/my-orders" class="flex items-center gap-2 text-xs font-bold text-slate-700 px-1">
          📦 Đơn hàng của tôi
        </router-link>
        <router-link to="/addresses" class="flex items-center gap-2 text-xs font-bold text-slate-700 px-1">
          📍 Sổ địa chỉ
        </router-link>
        <router-link to="/wishlist" class="flex items-center gap-2 text-xs font-bold text-slate-700 px-1">
          ❤️ {{ $t('nav.wishlist') }}
        </router-link>
        <router-link
          v-if="authStore.isStaff"
          to="/admin/dashboard"
          class="flex items-center gap-2 text-xs font-bold text-[#dc2626] px-1"
        >
          ⚙️ Quản trị Admin
        </router-link>
        <button
          class="text-left flex items-center gap-2 text-xs font-bold text-red-600 px-1 cursor-pointer"
          @click="authStore.logout"
        >
          🚪 Đăng xuất
        </button>
      </template>
      <template v-else>
        <router-link to="/login" class="flex items-center gap-2 text-xs font-bold text-[#dc2626] px-1">
          🔑 Đăng nhập
        </router-link>
      </template>

      <!-- Mobile Dark Mode & Language Toggles -->
      <div class="border-t border-slate-100 pt-3 flex items-center justify-between px-1">
        <button
          class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer"
          @click="emit('toggle-dark-mode')"
        >
          <span v-if="isDarkMode">☀️ Chế độ sáng</span>
          <span v-else>🌙 Chế độ tối</span>
        </button>
        <div class="flex gap-2">
          <button
            class="text-xs font-bold px-2.5 py-1 rounded-md"
            :class="
              currentLocale === 'vi'
                ? 'bg-[#dc2626] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            "
            @click="emit('change-locale', 'vi')"
          >
            VI
          </button>
          <button
            class="text-xs font-bold px-2.5 py-1 rounded-md"
            :class="
              currentLocale === 'en'
                ? 'bg-[#dc2626] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            "
            @click="emit('change-locale', 'en')"
          >
            EN
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Category } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

defineProps<{
  open: boolean
  parentCategories: Category[]
  isDarkMode: boolean
  currentLocale: string
}>()

const emit = defineEmits<{
  (e: 'open-profile'): void
  (e: 'toggle-dark-mode'): void
  (e: 'change-locale', lang: 'vi' | 'en'): void
}>()

const authStore = useAuthStore()
const cartStore = useCartStore()
const router = useRouter()

// The drawer closes itself through SiteHeader's route watcher once navigation happens.
function navigateToCategory(categoryId: string) {
  router.push(`/products?category=${categoryId}`)
}
</script>
