<template>
  <div class="min-h-screen flex bg-slate-100 font-sans">
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl">
      <!-- Sidebar Header / Logo -->
      <div class="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950 gap-2">
        <span class="text-lg font-black text-white tracking-wider uppercase">TRUONG THANH</span>
        <span class="bg-blue-600 text-white text-[9px] font-bold px-1 py-0.5 rounded-sm">ADMIN</span>
      </div>

      <!-- Navigation links -->
      <nav class="flex-grow p-4 space-y-1.5 overflow-y-auto">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group"
          :class="[
            $route.name === item.name
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/35'
              : 'hover:bg-slate-800 hover:text-white text-slate-400'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- Sidebar Footer -->
      <div class="p-4 border-t border-slate-800 bg-slate-950 flex flex-col gap-2">
        <router-link to="/" class="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 0 1 3.75-2.905m0 0C6.912 6.746 8.5 8 8.5 9.35m0-3.001a3.002 3.002 0 0 1 3.75-2.906m0 0C13.912 3.746 15.5 5 15.5 6.35m0-3.001a3.002 3.002 0 0 1 3.75-2.906m0 0C20.912 0.746 22.5 2 22.5 3.35" />
          </svg>
          <span>Xem cửa hàng</span>
        </router-link>

        <button @click="handleLogout" class="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-sm font-semibold text-red-400 border border-red-900/40 transition-colors">
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>

    <!-- Main Workspace -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Bar -->
      <header class="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0">
        <div>
          <h1 class="text-xl font-bold text-slate-800">{{ currentRouteLabel }}</h1>
        </div>

        <!-- User Menu -->
        <div class="flex items-center gap-4">
          <div class="text-right hidden sm:block">
            <p class="text-sm font-semibold text-slate-800">{{ authStore.user?.fullName }}</p>
            <p class="text-xs text-slate-400 uppercase font-medium">{{ authStore.user?.role }}</p>
          </div>
          <div class="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
            {{ authStore.user?.fullName.charAt(0).toUpperCase() }}
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
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Simple SVG Icons
const DashboardIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" /></svg>`
}
const ProductsIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>`
}
const OrdersIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H3.75A1.125 1.125 0 0 0 2.625 3.375v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-3a3.375 3.375 0 0 0-3.375-3.375H12" /></svg>`
}
const InventoryIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9.75v6.75m0 0l-3-3m3 3l3-3m-8.25 6h10.5a2.25 2.25 0 0 0 2.25-2.25v-10.5A2.25 2.25 0 0 0 18 3.75H6a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 6 18Z" /></svg>`
}
const CustomersIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.97 5.97 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>`
}
const PromotionsIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.5 1.5 0 0 0 2.122 0l4.318-4.318a1.5 1.5 0 0 0 0-2.122L11.16 3.659A2.25 2.25 0 0 0 9.568 3Z" /></svg>`
}
const ReportsIcon = {
  template: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg>`
}

const navItems = [
  { name: 'AdminDashboard', label: 'Tổng quan', to: '/admin/dashboard', icon: DashboardIcon },
  { name: 'AdminProducts', label: 'Quản lý Sản phẩm', to: '/admin/products', icon: ProductsIcon },
  { name: 'AdminOrders', label: 'Quản lý Đơn hàng', to: '/admin/orders', icon: OrdersIcon },
  { name: 'AdminInventory', label: 'Quản lý Kho hàng', to: '/admin/inventory', icon: InventoryIcon },
  { name: 'AdminCustomers', label: 'Quản lý Khách hàng', to: '/admin/customers', icon: CustomersIcon },
  { name: 'AdminPromotions', label: 'Quản lý Khuyến mãi', to: '/admin/promotions', icon: PromotionsIcon },
  { name: 'AdminReports', label: 'Báo cáo & Thống kê', to: '/admin/reports', icon: ReportsIcon },
]

const currentRouteLabel = computed(() => {
  const active = navItems.find(item => item.name === route.name)
  return active ? active.label : 'Quản trị'
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>
