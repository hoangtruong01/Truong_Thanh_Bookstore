<template>
  <!-- Top Bar -->
  <div
    class="bg-[#dc2626] text-white text-[11px] py-1.5 text-center font-medium tracking-wide flex items-center justify-center gap-1.5"
  >
    <span>🚚</span> Miễn phí giao hàng cho đơn từ 299K
  </div>

  <!-- Main Header -->
  <header
    class="sticky top-0 z-50 transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-slate-200/80"
    :class="isSticky ? 'shadow-lg shadow-slate-100/50' : 'shadow-xs'"
  >
    <div class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20 gap-4">
        <!-- Mobile Menu Toggle (UX-05) -->
        <button
          class="md:hidden text-slate-700 hover:text-[#dc2626] transition-colors cursor-pointer flex-shrink-0"
          aria-label="Menu"
          :aria-expanded="mobileMenuOpen"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="w-6 h-6"
          >
            <path
              v-if="!mobileMenuOpen"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
            <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-2.5 flex-shrink-0">
          <!-- Icon TT -->
          <img
            src="@/assets/logo.jpg"
            class="w-10 h-10 rounded-full object-cover border border-slate-200"
            alt="Trường Thành Logo"
          />
          <div class="flex flex-col leading-none">
            <span class="text-lg font-black text-[#dc2626] tracking-tight">TRƯỜNG THÀNH</span>
            <span class="text-[9px] font-bold text-slate-500 tracking-widest uppercase">Stationery</span>
          </div>
        </router-link>

        <!-- Search Bar & Category Menu -->
        <div class="flex-1 max-w-xl hidden md:flex items-center gap-3 relative">
          <MegaMenu :categories="categories" :parent-categories="parentCategories" />
          <SearchAutocomplete variant="desktop" />
        </div>

        <!-- Utility Icons -->
        <div class="flex items-center gap-3 sm:gap-6">
          <!-- Notifications -->
          <NotificationDropdown @open-profile="emit('open-profile')" />

          <!-- Cart -->
          <router-link
            to="/cart"
            class="relative text-slate-700 hover:text-[#dc2626] flex items-center gap-1 transition-colors"
            aria-label="Giỏ hàng"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
              />
            </svg>
            <span
              v-if="cartStore.itemsCount > 0"
              class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
            >
              {{ cartStore.itemsCount }}
            </span>
          </router-link>

          <!-- Account -->
          <div class="relative">
            <template v-if="authStore.isAuthenticated">
              <div class="flex items-center gap-2 cursor-pointer group">
                <div
                  class="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-red-100 bg-red-50 flex-shrink-0"
                >
                  <img
                    v-if="authStore.user?.avatar"
                    :src="authStore.user.avatar"
                    :alt="authStore.user?.fullName || 'Avatar'"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-[#dc2626] font-bold">{{ userInitial }}</span>
                </div>
                <span
                  class="text-sm font-medium text-slate-700 group-hover:text-[#dc2626] max-w-[160px] truncate hidden lg:block transition-colors"
                >
                  {{ authStore.user?.fullName }}
                </span>
                <!-- Dropdown Menu -->
                <div class="absolute right-0 top-full pt-2 hidden group-hover:block z-50">
                  <div class="w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 text-slate-700 text-sm">
                    <router-link v-if="authStore.isStaff" to="/admin/dashboard" class="block px-4 py-2 hover:bg-slate-100">
                      {{ $t('nav.admin') }}
                    </router-link>
                    <button
                      class="w-full text-left block px-4 py-2 hover:bg-slate-100 cursor-pointer"
                      @click="emit('open-profile')"
                    >
                      Thông tin tài khoản
                    </button>
                    <router-link to="/my-orders" class="block px-4 py-2 hover:bg-slate-100">
                      {{ $t('nav.myOrders') }}
                    </router-link>
                    <router-link to="/addresses" class="block px-4 py-2 hover:bg-slate-100">
                      {{ $t('nav.addresses') }}
                    </router-link>
                    <router-link to="/wishlist" class="block px-4 py-2 hover:bg-slate-100">
                      {{ $t('nav.wishlist') }}
                    </router-link>
                    <button
                      class="w-full text-left block px-4 py-2 hover:bg-red-50 text-red-600 cursor-pointer"
                      @click="authStore.logout"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <router-link
                to="/login"
                class="flex items-center gap-1.5 text-slate-700 hover:text-[#dc2626] font-medium text-sm transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                  stroke="currentColor"
                  class="w-5 h-5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
                <span>Đăng nhập</span>
              </router-link>
            </template>
          </div>

          <!-- Language Switcher -->
          <div class="relative group/lang hidden md:block">
            <button
              class="text-xs font-black text-slate-700 hover:text-[#dc2626] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>🌐</span>
              <span class="uppercase font-bold">{{ currentLocale.toUpperCase() }}</span>
            </button>
            <div class="absolute right-0 top-full pt-2 hidden group-hover/lang:block z-50">
              <div class="w-24 bg-white border border-slate-200 rounded-xl shadow-lg py-1 text-slate-700 text-xs font-bold">
                <button
                  class="w-full text-left px-3 py-2 hover:bg-slate-100 cursor-pointer flex items-center justify-between"
                  @click="emit('change-locale', 'vi')"
                >
                  <span>Tiếng Việt</span>
                  <span v-if="currentLocale === 'vi'">✓</span>
                </button>
                <button
                  class="w-full text-left px-3 py-2 hover:bg-slate-100 cursor-pointer flex items-center justify-between"
                  @click="emit('change-locale', 'en')"
                >
                  <span>English</span>
                  <span v-if="currentLocale === 'en'">✓</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Dark Mode Toggle -->
          <button
            class="text-slate-700 hover:text-[#dc2626] transition-colors p-1 cursor-pointer"
            :title="$t('theme.' + (isDarkMode ? 'light' : 'dark'))"
            @click="emit('toggle-dark-mode')"
          >
            <span v-if="isDarkMode">☀️</span>
            <span v-else>🌙</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Search Bar (always visible on mobile/tablet below the logo line) -->
    <SearchAutocomplete variant="mobile" />

    <!-- Mobile Menu Drawer (UX-05) -->
    <MobileDrawer
      :open="mobileMenuOpen"
      :parent-categories="parentCategories"
      :is-dark-mode="isDarkMode"
      :current-locale="currentLocale"
      @open-profile="emit('open-profile')"
      @toggle-dark-mode="emit('toggle-dark-mode')"
      @change-locale="(lang) => emit('change-locale', lang)"
    />
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Category } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import MegaMenu from './MegaMenu.vue'
import SearchAutocomplete from './SearchAutocomplete.vue'
import NotificationDropdown from './NotificationDropdown.vue'
import MobileDrawer from './MobileDrawer.vue'

const props = defineProps<{
  categories: Category[]
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
const route = useRoute()

const mobileMenuOpen = ref(false)
const isSticky = ref(false)

const parentCategories = computed(() =>
  Array.isArray(props.categories) ? props.categories.filter((c) => !c.parentId) : [],
)

const userInitial = computed(() => (authStore.user?.fullName || '').charAt(0).toUpperCase())

function handleScroll() {
  isSticky.value = window.scrollY > 40
}

// Close the mobile drawer on navigation
watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
  },
)

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
