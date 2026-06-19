<template>
  <div class="space-y-8">
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-5 gap-6">
      <div v-for="n in 5" :key="n" class="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 animate-pulse">
        <div class="h-4 bg-slate-200 rounded w-1/2"></div>
        <div class="h-8 bg-slate-200 rounded w-3/4"></div>
      </div>
    </div>

    <div v-else-if="stats" class="space-y-8">
      <!-- Stats grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
        <!-- Revenue Card -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div class="space-y-2">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Doanh thu hôm nay</span>
            <p class="text-2xl font-black text-blue-700">{{ formatCurrency(stats.todayRevenue) }}</p>
          </div>
          <div class="absolute right-4 bottom-4 text-blue-50 bg-blue-100/50 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6 text-blue-700"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.75A.75.75 0 0 1 3 4.5h.75m0 0V3a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 .75.75v1.5m-16 0h16M3.75 9h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" /></svg>
          </div>
        </div>

        <!-- Orders Card -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div class="space-y-2">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng số đơn hàng</span>
            <p class="text-2xl font-black text-slate-800">{{ stats.totalOrders }}</p>
          </div>
          <div class="absolute right-4 bottom-4 text-indigo-50 bg-indigo-100/50 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6 text-indigo-700"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H3.75A1.125 1.125 0 0 0 2.625 3.375v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-3a3.375 3.375 0 0 0-3.375-3.375H12" /></svg>
          </div>
        </div>

        <!-- Products Card -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div class="space-y-2">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng sản phẩm</span>
            <p class="text-2xl font-black text-slate-800">{{ stats.totalProducts }}</p>
          </div>
          <div class="absolute right-4 bottom-4 text-emerald-50 bg-emerald-100/50 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6 text-emerald-700"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
          </div>
        </div>

        <!-- Low Stock Card -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div class="space-y-2">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sắp hết hàng</span>
            <p class="text-2xl font-black text-red-600">{{ stats.lowStockCount }}</p>
          </div>
          <div class="absolute right-4 bottom-4 text-red-50 bg-red-100/50 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6 text-red-600"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
          </div>
        </div>

        <!-- New Customers Card -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div class="space-y-2">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Khách hàng mới (30 ngày)</span>
            <p class="text-2xl font-black text-slate-800">{{ stats.newCustomers }}</p>
          </div>
          <div class="absolute right-4 bottom-4 text-amber-50 bg-amber-100/50 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6 text-amber-700"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.97 5.97 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
          </div>
        </div>
      </div>

      <!-- Detail tables -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Recent Orders -->
        <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col">
          <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Đơn hàng gần đây</h3>
            <router-link to="/admin/orders" class="text-xs font-bold text-blue-600 hover:underline">Tất cả đơn hàng</router-link>
          </div>
          <div class="overflow-x-auto flex-grow">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="text-slate-400 font-bold border-b border-slate-100">
                  <th class="pb-3 text-xs">Mã đơn</th>
                  <th class="pb-3 text-xs">Khách hàng</th>
                  <th class="pb-3 text-xs">Tổng tiền</th>
                  <th class="pb-3 text-xs">Trạng thái</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
                <tr v-for="order in recentOrders" :key="order._id" class="hover:bg-slate-50">
                  <td class="py-3 font-mono text-xs">{{ order.orderCode }}</td>
                  <td class="py-3">{{ order.customerName || 'Vãng lai' }}</td>
                  <td class="py-3">{{ formatCurrency(order.total) }}</td>
                  <td class="py-3">
                    <span :class="['px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', getStatusColor(order.orderStatus)]">
                      {{ getStatusLabel(order.orderStatus) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Best Selling Products -->
        <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col">
          <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Sản phẩm bán chạy nhất</h3>
            <router-link to="/admin/products" class="text-xs font-bold text-blue-600 hover:underline">Quản lý sản phẩm</router-link>
          </div>
          <div class="overflow-x-auto flex-grow">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="text-slate-400 font-bold border-b border-slate-100">
                  <th class="pb-3 text-xs">Sản phẩm</th>
                  <th class="pb-3 text-xs">SKU</th>
                  <th class="pb-3 text-xs">Giá bán</th>
                  <th class="pb-3 text-xs">Đã bán</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
                <tr v-for="prod in bestSelling" :key="prod._id" class="hover:bg-slate-50">
                  <td class="py-3 flex items-center gap-3">
                    <img :src="prod.images[0]" class="w-8 h-8 rounded-lg object-cover bg-slate-50" />
                    <span class="truncate max-w-[180px]">{{ prod.name }}</span>
                  </td>
                  <td class="py-3 font-mono text-xs">{{ prod.sku }}</td>
                  <td class="py-3">{{ formatCurrency(prod.discountPrice || prod.price) }}</td>
                  <td class="py-3 font-bold text-blue-700">{{ prod.sold }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { reportService } from '@/services/report.service'
import { formatCurrency, getStatusColor, getStatusLabel } from '@/utils/helpers'
import type { DashboardStats, Order, Product } from '@/types'

const stats = ref<DashboardStats | null>(null)
const recentOrders = ref<Order[]>([])
const bestSelling = ref<Product[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await reportService.getDashboard()
    stats.value = res.data.stats
    recentOrders.value = res.data.recentOrders
    bestSelling.value = res.data.bestSellingProducts
  } catch (err) {
    console.error('Error fetching dashboard stats', err)
  } finally {
    loading.value = false
  }
})
</script>
