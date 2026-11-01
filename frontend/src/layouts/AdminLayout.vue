<template>
  <div class="h-screen w-screen overflow-hidden flex bg-slate-50 dark:bg-slate-950 font-sans relative">
    <!-- Backdrop for mobile -->
    <div v-if="sidebarOpen" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden" @click="sidebarOpen = false"></div>

    <!-- Sidebar (Matches Screenshot: light background) -->
    <aside 
      class="fixed inset-y-0 left-0 w-64 h-full md:h-screen md:max-h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xs flex-shrink-0 z-40 transition-transform duration-300 md:translate-x-0 md:static"
      :class="[sidebarOpen ? 'translate-x-0' : '-translate-x-full']"
    >
      <!-- Sidebar Header / Logo -->
      <div class="h-20 flex-shrink-0 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 gap-2.5 bg-white dark:bg-slate-900">
        <!-- Emblem -->
        <img src="@/assets/logo.jpg" class="w-8.5 h-8.5 rounded-full object-cover border border-slate-200 dark:border-slate-700" alt="Trường Thành Logo" />
        <div class="flex flex-col leading-none">
          <span class="text-sm font-black text-[#dc2626] tracking-tight uppercase">TRƯỜNG THÀNH</span>
          <span class="text-[8px] font-bold text-slate-400 tracking-wider uppercase">ADMIN PANEL</span>
        </div>
      </div>

      <!-- Navigation links (Collapsible Accordion Style with Independent Scroll) -->
      <nav class="flex-1 min-h-0 p-3 space-y-1.5 overflow-y-auto overscroll-contain custom-scrollbar">
        <!-- Top Standalone Quick Links (e.g. Dashboard) -->
        <div class="space-y-0.5 pb-2 mb-1.5 border-b border-slate-100 dark:border-slate-800">
          <router-link
            v-for="item in topNavItems"
            :key="item.name"
            :to="item.to"
            class="flex items-center gap-3 px-3.5 py-2.2 rounded-xl text-xs font-semibold transition-all group"
            :class="[
              $route.name === item.name || route.path.startsWith(item.to)
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-2xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <span class="text-base flex-shrink-0 leading-none">{{ item.icon }}</span>
            <span class="truncate">{{ item.label }}</span>
          </router-link>
        </div>

        <!-- Collapsible Groups -->
        <div
          v-for="group in navGroups"
          :key="group.key"
          class="space-y-0.5"
        >
          <!-- Group Header Button -->
          <button
            type="button"
            class="w-full flex items-center justify-between px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider text-[#991b1b] dark:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer select-none"
            @click="toggleGroup(group.key)"
          >
            <div class="flex items-center gap-2.5 truncate">
              <span class="text-sm flex-shrink-0 leading-none">{{ group.icon }}</span>
              <span class="truncate">{{ group.label }}</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2.5"
              stroke="currentColor"
              class="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 transition-transform duration-200 flex-shrink-0"
              :class="[isGroupOpen(group.key) ? 'rotate-180' : '']"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          <!-- Group Submenu -->
          <transition
            enter-active-class="transition-all duration-200 ease-out overflow-hidden"
            leave-active-class="transition-all duration-150 ease-in overflow-hidden"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-96 opacity-100"
            leave-from-class="max-h-96 opacity-100"
            leave-to-class="max-h-0 opacity-0"
          >
            <div v-show="isGroupOpen(group.key)" class="space-y-0.5 pl-2">
              <router-link
                v-for="item in group.items"
                :key="item.name"
                :to="item.to"
                class="flex items-center gap-3 px-3.5 py-2.2 rounded-xl text-xs font-semibold transition-all group"
                :class="[
                  $route.name === item.name || route.path.startsWith(item.to)
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                ]"
              >
                <span class="text-base flex-shrink-0 leading-none">{{ item.icon }}</span>
                <span class="truncate">{{ item.label }}</span>
              </router-link>
            </div>
          </transition>
        </div>
      </nav>

      <!-- Sidebar Footer -->
      <div class="flex-shrink-0 p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-1.5">
        <router-link
          to="/"
          class="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-700 transition-all shadow-2xs"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5 text-slate-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          <span>Về trang bán hàng</span>
        </router-link>

        <button
          class="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-100/90 dark:border-rose-900/40 transition-all cursor-pointer"
          @click="handleLogout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>

    <!-- Main Workspace -->
    <div class="flex-1 h-screen max-h-screen flex flex-col overflow-hidden min-w-0">
      <!-- Top Bar (Matches Screenshot) -->
      <header class="h-20 flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between md:justify-end px-8">
        <!-- Mobile hamburger menu button -->
        <button 
          class="md:hidden text-slate-500 hover:text-slate-800 transition-colors p-2 rounded-lg hover:bg-slate-100 cursor-pointer" 
          @click="sidebarOpen = !sidebarOpen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <!-- Right User details -->
        <div class="flex items-center gap-5">
          <!-- Dark Mode Toggle -->
          <button class="text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" :title="isDarkMode ? 'Bật chế độ sáng' : 'Bật chế độ tối'" @click="toggleDarkMode">
            <span v-if="isDarkMode">☀️</span>
            <span v-else>🌙</span>
          </button>

          <!-- Language Switcher -->
          <div class="relative group/lang flex items-center">
            <button class="text-xs font-black text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer">
              <span>🌐</span>
              <span class="uppercase font-bold">{{ currentLocale.toUpperCase() }}</span>
            </button>
            <div class="absolute right-0 top-full pt-2 hidden group-hover/lang:block z-50">
              <div class="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 text-slate-700 dark:text-slate-350 text-xs font-bold">
                <button class="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between" @click="changeLocale('vi')">
                  <span>Tiếng Việt</span>
                  <span v-if="currentLocale === 'vi'">✓</span>
                </button>
                <button class="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between" @click="changeLocale('en')">
                  <span>English</span>
                  <span v-if="currentLocale === 'en'">✓</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Notification bell -->
          <div id="notification-dropdown-container" class="relative">
            <button 
              class="relative text-slate-500 hover:text-slate-800 transition-colors cursor-pointer p-1.5 rounded-full hover:bg-slate-100"
              title="Thông báo hệ thống" 
              @click="toggleNotifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              <!-- Unread badge -->
              <span 
                v-if="unreadCount > 0" 
                class="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-[9px] font-black text-white rounded-full flex items-center justify-center border border-white"
              >
                {{ unreadCount }}
              </span>
            </button>

            <!-- Dropdown menu -->
            <div 
              v-if="showNotifications" 
              class="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <!-- Header -->
              <div class="px-4 py-3 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <span class="text-xs font-black text-slate-800 uppercase tracking-wider">Thông báo hệ thống</span>
                <button 
                  v-if="unreadCount > 0" 
                  class="text-[10px] font-extrabold text-[#dc2626] hover:underline cursor-pointer" 
                  @click="markAllAsRead"
                >
                  Đọc tất cả
                </button>
              </div>

              <!-- List -->
              <div class="max-h-80 overflow-y-auto divide-y divide-slate-100">
                <div v-if="notifications.length === 0" class="p-6 text-center text-xs text-slate-400 font-medium">
                  Không có thông báo nào.
                </div>
                <div 
                  v-for="item in notifications" 
                  :key="item.id" 
                  class="p-3.5 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  :class="{'bg-red-50/5 font-semibold': !readIds.includes(item.id)}"
                  @click="handleNotificationClick(item)"
                >
                  <!-- Icon indicator -->
                  <div
class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-xs" :class="{
                    'bg-red-100 text-red-600 border border-red-200': item.type === 'out_of_stock',
                    'bg-amber-50 text-amber-600 border border-amber-100': item.type === 'stock',
                    'bg-rose-100 text-rose-600 border border-rose-200': item.type === 'high_value_order',
                    'bg-orange-50 text-orange-600 border border-orange-100': item.type === 'pending_delay',
                    'bg-emerald-50 text-emerald-600 border border-emerald-100': item.type === 'order',
                    'bg-blue-50 text-blue-600 border border-blue-100': item.type === 'customer'
                  }">
                    <span v-if="item.type === 'out_of_stock'">🔴</span>
                    <span v-else-if="item.type === 'stock'">⚠️</span>
                    <span v-else-if="item.type === 'high_value_order'">🚨</span>
                    <span v-else-if="item.type === 'pending_delay'">⏰</span>
                    <span v-else-if="item.type === 'order'">📦</span>
                    <span v-else-if="item.type === 'customer'">👤</span>
                    <span v-else>🔔</span>
                  </div>

                  <!-- Text -->
                  <div class="flex-grow min-w-0 text-left">
                    <div class="flex justify-between items-baseline gap-1">
                      <span class="text-xs font-bold text-slate-800 truncate">{{ item.title }}</span>
                      <span class="text-[9px] text-slate-400 font-medium whitespace-nowrap">{{ formatTimeAgo(item.createdAt) }}</span>
                    </div>
                    <p class="text-[11px] text-slate-600 leading-relaxed mt-0.5 line-clamp-2 font-medium">
                      {{ item.message }}
                    </p>
                  </div>
                  
                  <!-- Read indicator dot -->
                  <div v-if="!readIds.includes(item.id)" class="flex-shrink-0 self-center">
                    <div class="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Profile -->
          <div class="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all select-none" title="Thông tin tài khoản" @click="showProfile = true">
            <div class="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white font-extrabold text-xs shadow-xs border border-slate-200 bg-[#f97316]">
              <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" class="w-full h-full object-cover" />
              <span v-else>{{ adminInitials }}</span>
            </div>
            <div class="text-left leading-tight hidden sm:block">
              <p class="text-xs font-extrabold text-slate-800">{{ adminName }}</p>
              <p class="text-[9px] text-slate-400 font-semibold uppercase">{{ adminRole }}</p>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content Container (Scrolls Independently from Left Sidebar) -->
      <main class="flex-1 min-h-0 overflow-y-auto overscroll-contain p-8 custom-scrollbar">
        <router-view />
      </main>
    </div>

    <!-- Profile Modal -->
    <ProfileModal :is-open="showProfile" @close="showProfile = false" />
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { reportService } from '@/services/report.service'
import ProfileModal from '@/components/ProfileModal.vue'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const showProfile = ref(false)
const sidebarOpen = ref(false)

watch(() => route.path, () => {
  sidebarOpen.value = false
})

const adminName = computed(() => authStore.user?.fullName || 'Admin')
const adminInitials = computed(() => {
  const name = authStore.user?.fullName || 'AD'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
})
const adminRole = computed(() => {
  const role = authStore.user?.role
  if (role === 'ADMIN') return 'Super Admin'
  if (role === 'STAFF') return 'Nhân viên'
  return 'Admin'
})

// Language setup
const { locale } = useI18n()
const currentLocale = computed(() => locale.value)

function changeLocale(lang: 'vi' | 'en') {
  locale.value = lang
  localStorage.setItem('lang', lang)
  document.documentElement.setAttribute('lang', lang)
}

// Dark Mode logic
const isDarkMode = ref(localStorage.getItem("theme") === "dark")
function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value
  if (isDarkMode.value) {
    document.documentElement.classList.add("dark")
    localStorage.setItem("theme", "dark")
  } else {
    document.documentElement.classList.remove("dark")
    localStorage.setItem("theme", "light")
  }
}

// Cross-tab theme and language synchronization
function handleStorageChange(event: StorageEvent) {
  if (event.key === 'theme') {
    const isDark = event.newValue === 'dark'
    isDarkMode.value = isDark
    document.documentElement.classList.toggle('dark', isDark)
  } else if (event.key === 'lang') {
    const newLang = (event.newValue || 'vi') as 'vi' | 'en'
    locale.value = newLang
    document.documentElement.setAttribute('lang', newLang)
  }
}

// Notifications State & Logic
const showNotifications = ref(false)
const notifications = ref<any[]>([])
const readIds = ref<string[]>([])

function loadReadIds() {
  const stored = localStorage.getItem('admin_read_notification_ids')
  if (stored) {
    try {
      readIds.value = JSON.parse(stored)
    } catch {
      readIds.value = []
    }
  }
}

function saveReadIds() {
  localStorage.setItem('admin_read_notification_ids', JSON.stringify(readIds.value))
}

const unreadCount = computed(() => {
  if (!Array.isArray(notifications.value)) return 0
  return notifications.value.filter(n => n && !readIds.value.includes(n.id)).length
})

async function fetchNotifications() {
  try {
    const res: any = await reportService.getNotifications()
    const raw = res.data?.data || res.data
    notifications.value = Array.isArray(raw) ? raw : (Array.isArray(raw?.items) ? raw.items : [])
  } catch (err) {
    notifications.value = []
    console.error('Failed to fetch notifications:', err)
  }
}

function toggleNotifications(event: Event) {
  event.stopPropagation()
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    fetchNotifications()
  }
}

function markAllAsRead() {
  if (!Array.isArray(notifications.value)) return
  notifications.value.forEach(n => {
    if (n && n.id && !readIds.value.includes(n.id)) {
      readIds.value.push(n.id)
    }
  })
  saveReadIds()
}

function handleNotificationClick(item: any) {
  if (!readIds.value.includes(item.id)) {
    readIds.value.push(item.id)
    saveReadIds()
  }
  showNotifications.value = false
  
  if (item.type === 'order' || item.type === 'high_value_order' || item.type === 'pending_delay') {
    router.push('/admin/orders')
  } else if (item.type === 'stock' || item.type === 'out_of_stock') {
    router.push('/admin/inventory')
  } else if (item.type === 'customer') {
    router.push('/admin/customers')
  }
}

function closeDropdown() {
  showNotifications.value = false
}

function handleClickOutside(event: MouseEvent) {
  const dropdown = document.getElementById('notification-dropdown-container')
  if (dropdown && !dropdown.contains(event.target as Node)) {
    closeDropdown()
  }
}

function formatTimeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'Vừa xong'
  
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Hôm qua'
  return `${days} ngày trước`
}

onMounted(() => {
  // Initialize theme & language states from localStorage on mount
  isDarkMode.value = localStorage.getItem("theme") === "dark"
  document.documentElement.classList.toggle("dark", isDarkMode.value)

  locale.value = (localStorage.getItem("lang") || "vi") as "vi" | "en"
  document.documentElement.setAttribute("lang", locale.value)

  loadReadIds()
  fetchNotifications()
  
  const interval = setInterval(fetchNotifications, 30000)
  window.addEventListener('click', handleClickOutside)
  window.addEventListener('storage', handleStorageChange)
  
  onUnmounted(() => {
    clearInterval(interval)
    window.removeEventListener('click', handleClickOutside)
    window.removeEventListener('storage', handleStorageChange)
  })
})

interface NavItem {
  name: string
  label: string
  to: string
  icon: string
  permission?: string
}

interface NavGroup {
  key: string
  label: string
  icon: string
  items: NavItem[]
}

// Top Standalone Quick Links (like E-Form, Bãi đỗ xe in reference)
const topNavItems = computed<NavItem[]>(() => {
  const isEn = locale.value === 'en'
  const rawItems: NavItem[] = [
    { name: 'AdminDashboard', label: isEn ? 'Dashboard' : 'Dashboard', to: '/admin/dashboard', icon: '📈' },
  ]
  const user = authStore.user
  if (!user) return []
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return rawItems

  const userPermissions = user.permissions || []
  return rawItems.filter(item => !item.permission || userPermissions.includes(item.permission))
})

// Collapsible group state
const openGroups = ref<Record<string, boolean>>({
  sales: true,
  catalog: true,
  inventory: true,
  finance: true,
  marketing: true,
})

function toggleGroup(key: string) {
  openGroups.value[key] = !openGroups.value[key]
}

function isGroupOpen(key: string): boolean {
  return openGroups.value[key] ?? true
}

function autoExpandActiveGroup() {
  for (const group of navGroups.value) {
    const hasActiveItem = group.items.some(
      item => route.name === item.name || route.path.startsWith(item.to)
    )
    if (hasActiveItem) {
      openGroups.value[group.key] = true
    }
  }
}

watch(() => route.path, () => {
  autoExpandActiveGroup()
}, { immediate: true })

const navGroups = computed<NavGroup[]>(() => {
  const isEn = locale.value === 'en'

  const rawGroups: NavGroup[] = [
    {
      key: 'sales',
      label: isEn ? 'Sales & Orders' : 'BÁN HÀNG & ĐƠN HÀNG',
      icon: '🛒',
      items: [
        { name: 'AdminPOS', label: isEn ? 'POS Counter' : 'Bán hàng tại quầy', to: '/admin/pos', icon: '🖥️', permission: 'POS_ACCESS' },
        { name: 'AdminOrders', label: isEn ? 'Orders' : 'Đơn hàng', to: '/admin/orders', icon: '🧾', permission: 'MANAGE_ORDERS' },
        { name: 'AdminCustomers', label: isEn ? 'Customers' : 'Khách hàng', to: '/admin/customers', icon: '👥', permission: 'MANAGE_CUSTOMERS' },
      ],
    },
    {
      key: 'catalog',
      label: isEn ? 'Products & Pricing' : 'SẢN PHẨM & GIÁ BÁN',
      icon: '📚',
      items: [
        { name: 'AdminProducts', label: isEn ? 'Products' : 'Sản phẩm', to: '/admin/products', icon: '📖', permission: 'MANAGE_PRODUCTS' },
        { name: 'AdminCombos', label: isEn ? 'Combos' : 'Combo sản phẩm', to: '/admin/combos', icon: '🎁', permission: 'MANAGE_PRODUCTS' },
        { name: 'AdminPricing', label: isEn ? 'Pricing & Margin' : 'Chính sách giá & Lãi', to: '/admin/pricing', icon: '💲', permission: 'MANAGE_PRICING' },
        { name: 'AdminReviews', label: isEn ? 'Reviews' : 'Đánh giá', to: '/admin/reviews', icon: '⭐', permission: 'MANAGE_PRODUCTS' },
      ],
    },
    {
      key: 'inventory',
      label: isEn ? 'Inventory & Procurement' : 'KHO & THU MUA',
      icon: '🏢',
      items: [
        { name: 'AdminInventory', label: isEn ? 'Inventory' : 'Kho hàng', to: '/admin/inventory', icon: '📦', permission: 'MANAGE_INVENTORY' },
        { name: 'AdminPurchases', label: isEn ? 'Purchases & PO' : 'Mua hàng & PO', to: '/admin/purchases', icon: '🚚', permission: 'MANAGE_INVENTORY' },
        { name: 'AdminStockAudits', label: isEn ? 'Stock Audits' : 'Kiểm kê kho', to: '/admin/stock-audits', icon: '📋', permission: 'MANAGE_INVENTORY' },
        { name: 'AdminSuppliers', label: isEn ? 'Suppliers' : 'Nhà cung cấp', to: '/admin/suppliers', icon: '🏭', permission: 'MANAGE_INVENTORY' },
      ],
    },
    {
      key: 'finance',
      label: isEn ? 'Finance & Reports' : 'TÀI CHÍNH & BÁO CÁO',
      icon: '💰',
      items: [
        { name: 'AdminReports', label: isEn ? 'Reports' : 'Báo cáo', to: '/admin/reports', icon: '📊', permission: 'VIEW_REPORTS' },
        { name: 'AdminCashbook', label: isEn ? 'Cashbook & Finance' : 'Sổ quỹ & Thu chi', to: '/admin/cashbook', icon: '💼', permission: 'MANAGE_FINANCE' },
      ],
    },
    {
      key: 'marketing',
      label: isEn ? 'Marketing & Growth' : 'TRUYỀN THÔNG & TIẾP THỊ',
      icon: '📣',
      items: [
        { name: 'AdminPromotions', label: isEn ? 'Promotions' : 'Khuyến mãi', to: '/admin/promotions', icon: '🏷️', permission: 'MANAGE_PROMOTIONS' },
        { name: 'AdminBanners', label: isEn ? 'Banners' : 'Banners', to: '/admin/banners', icon: '🖼️', permission: 'MANAGE_BANNERS' },
        { name: 'AdminLandingPages', label: isEn ? 'Quick Pages' : 'Tạo Page Nhanh', to: '/admin/landing-pages', icon: '⚡', permission: 'MANAGE_LANDING_PAGES' },
      ],
    },
  ]

  const user = authStore.user
  if (!user) return []
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return rawGroups

  const userPermissions = user.permissions || []
  return rawGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.permission) return true
        return userPermissions.includes(item.permission)
      }),
    }))
    .filter((group) => group.items.length > 0)
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.4) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.35);
  border-radius: 9999px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.65);
}

:global(.dark) .custom-scrollbar {
  scrollbar-color: rgba(100, 116, 139, 0.4) transparent;
}

:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.35);
}

:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.65);
}
</style>
