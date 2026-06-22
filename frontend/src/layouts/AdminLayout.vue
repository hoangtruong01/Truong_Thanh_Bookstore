<template>
  <div class="min-h-screen flex bg-slate-50 font-sans">
    <!-- Sidebar (Matches Screenshot: light background) -->
    <aside class="w-64 bg-white border-r border-slate-200 flex flex-col shadow-xs flex-shrink-0">
      <!-- Sidebar Header / Logo -->
      <div class="h-20 flex items-center px-6 border-b border-slate-200 gap-2.5 bg-white">
        <!-- Emblem -->
        <img src="@/assets/logo.jpg" class="w-8.5 h-8.5 rounded-full object-cover border border-slate-200" alt="Trường Thành Logo" />
        <div class="flex flex-col leading-none">
          <span class="text-sm font-black text-[#dc2626] tracking-tight uppercase">TRƯỜNG THÀNH</span>
          <span class="text-[8px] font-bold text-slate-400 tracking-wider uppercase">ADMIN PANEL</span>
        </div>
      </div>

      <!-- Navigation links (Active links are solid red) -->
      <nav class="flex-grow p-4 space-y-1 overflow-y-auto">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all group"
          :class="[
            $route.name === item.name || route.path.startsWith(item.to)
              ? 'bg-[#dc2626] text-white shadow-xs'
              : 'hover:bg-slate-50 hover:text-slate-900 text-slate-600'
          ]"
        >
          <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- Sidebar Footer (Matches Screenshot) -->
      <div class="p-4 border-t border-slate-200 bg-white flex flex-col gap-2">
        <router-link to="/" class="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 border border-slate-200 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          <span>Về trang bán hàng</span>
        </router-link>

        <button @click="handleLogout" class="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-red-50 hover:bg-red-100 text-xs font-bold text-red-600 border border-red-100 transition-colors cursor-pointer">
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>

    <!-- Main Workspace -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Bar (Matches Screenshot) -->
      <header class="h-20 bg-white border-b border-slate-200 flex items-center justify-end px-8 flex-shrink-0">

        <!-- Right User details -->
        <div class="flex items-center gap-5">
          <!-- Notification bell -->
          <button class="relative text-slate-500 hover:text-slate-800 transition-colors cursor-pointer" title="Thông báo (Đang phát triển)">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </button>

          <!-- Profile -->
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-[#f97316] flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
              {{ adminInitials }}
            </div>
            <div class="text-left leading-tight hidden sm:block">
              <p class="text-xs font-extrabold text-slate-800">{{ adminName }}</p>
              <p class="text-[9px] text-slate-400 font-semibold uppercase">{{ adminRole }}</p>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content Container -->
      <main class="flex-grow overflow-y-auto p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// BUG-07: Dynamic admin profile from authStore
import { computed } from 'vue'

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

// Simple SVG Icons
const DashboardIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" /></svg>`
}
const ProductsIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>`
}
const OrdersIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H3.75A1.125 1.125 0 0 0 2.625 3.375v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-3a3.375 3.375 0 0 0-3.375-3.375H12" /></svg>`
}
const InventoryIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9.75v6.75m0 0l-3-3m3 3l3-3m-8.25 6h10.5a2.25 2.25 0 0 0 2.25-2.25v-10.5A2.25 2.25 0 0 0 18 3.75H6a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 6 18Z" /></svg>`
}
const CategoriesIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" /></svg>`
}
const CustomersIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.97 5.97 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>`
}
const PromotionsIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.5 1.5 0 0 0 2.122 0l4.318-4.318a1.5 1.5 0 0 0 0-2.122L11.16 3.659A2.25 2.25 0 0 0 9.568 3Z" /></svg>`
}
const ReportsIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg>`
}
const SettingsIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.552 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128c.332-.183.582-.495.645-.869l.213-1.28Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>`
}
const SparklingIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 21l-.813-5.096L3.096 15.09 8 14.277l.813-5.096.813 5.096 5.096.813-5.096.813ZM19.062 7.938 18.5 11.5l-.563-3.562L14.375 7.38 18 6.813l.563-3.563.563 3.563 3.562.563-3.562.562ZM19.062 17.938l-.562 3.562-.563-3.562-3.563-.563 3.563-.563.563-3.562.562 3.562 3.563.563-3.563.563Z" /></svg>`
}

const navItems = [
  { name: 'AdminDashboard', label: 'Dashboard', to: '/admin/dashboard', icon: DashboardIcon },
  { name: 'AdminProducts', label: 'Sản phẩm', to: '/admin/products', icon: ProductsIcon },
  { name: 'AdminOrders', label: 'Đơn hàng', to: '/admin/orders', icon: OrdersIcon },
  { name: 'AdminInventory', label: 'Kho', to: '/admin/inventory', icon: InventoryIcon },
  { name: 'AdminCombos', label: 'Combo sản phẩm', to: '/admin/combos', icon: CategoriesIcon },
  { name: 'AdminCustomers', label: 'Khách hàng', to: '/admin/customers', icon: CustomersIcon },
  { name: 'AdminPromotions', label: 'Khuyến mãi', to: '/admin/promotions', icon: PromotionsIcon },
  { name: 'AdminReports', label: 'Báo cáo', to: '/admin/reports', icon: ReportsIcon },
  { name: 'AdminLandingPages', label: 'Landing Page AI', to: '/admin/landing-pages', icon: SparklingIcon },
]

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>
