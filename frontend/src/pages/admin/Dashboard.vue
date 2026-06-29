<template>
  <div class="space-y-6">
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-5 gap-6">
      <div v-for="n in 5" :key="n" class="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 animate-pulse">
        <div class="h-4 bg-slate-200 rounded w-1/2"></div>
        <div class="h-8 bg-slate-200 rounded w-3/4"></div>
      </div>
    </div>

    <div v-else-if="stats" class="space-y-6">
      <!-- Low Stock Warnings / Push Notifications (Low Stock Alert) -->
      <div v-if="lowStockItems.length > 0" class="bg-red-50 border border-red-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl animate-bounce">⚠️</span>
            <div>
              <h3 class="text-xs font-black text-red-800 uppercase tracking-wider">Cảnh báo tồn kho dưới mức tối thiểu</h3>
              <p class="text-[10px] text-red-500 font-medium">Các sản phẩm dưới đây có số lượng tồn kho thực tế thấp hơn mức tối thiểu (minStock).</p>
            </div>
          </div>
          <span class="text-[10px] bg-red-100 text-red-700 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            {{ lowStockItems.length }} sản phẩm
          </span>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div v-for="item in lowStockItems" :key="item._id" class="bg-white border border-red-100 rounded-xl p-3 flex items-center justify-between shadow-xs hover:border-red-300 transition-colors">
            <div class="flex items-center gap-3 min-w-0">
              <img 
                :src="item.product?.images && item.product.images[0] ? item.product.images[0] : 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=100'" 
                class="w-10 h-10 object-cover rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0"
                alt="Low stock product thumbnail"
              />
              <div class="min-w-0">
                <p class="text-xs font-bold text-slate-800 truncate leading-snug">{{ item.product?.name || 'Sản phẩm không rõ' }}</p>
                <p class="text-[9px] text-slate-400 font-semibold">SKU: {{ item.product?.sku }}</p>
              </div>
            </div>
            <div class="text-right flex-shrink-0 ml-2">
              <div class="text-xs font-black text-red-600">{{ item.currentStock }} / {{ item.minStock }}</div>
              <p class="text-[8px] text-slate-400 uppercase font-bold">Hiện tại / Min</p>
            </div>
          </div>
        </div>
        
        <div class="text-right pt-1">
          <router-link to="/admin/inventory" class="text-xs font-extrabold text-red-600 hover:text-red-700 inline-flex items-center gap-1">
            <span>Quản lý kho hàng &gt;</span>
          </router-link>
        </div>
      </div>

      <!-- Stats grid (Matches Screenshot) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <!-- Revenue Card -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div class="space-y-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doanh thu hôm nay</span>
            <p class="text-xl font-extrabold text-red-600">{{ formatCurrency(stats.todayRevenue) }}</p>
          </div>
          <div class="absolute right-4 bottom-4 text-red-50 bg-red-100/50 p-2 rounded-lg group-hover:scale-105 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5 text-red-600"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.75A.75.75 0 0 1 3 4.5h.75m0 0V3a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 .75.75v1.5m-16 0h16M3.75 9h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" /></svg>
          </div>
        </div>

        <!-- Orders Card -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div class="space-y-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng số đơn hàng</span>
            <p class="text-xl font-extrabold text-slate-800">{{ stats.totalOrders }}</p>
          </div>
          <div class="absolute right-4 bottom-4 text-orange-50 bg-orange-100/50 p-2 rounded-lg group-hover:scale-105 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5 text-orange-600"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H3.75A1.125 1.125 0 0 0 2.625 3.375v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-3a3.375 3.375 0 0 0-3.375-3.375H12" /></svg>
          </div>
        </div>

        <!-- Products Card -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div class="space-y-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng sản phẩm</span>
            <p class="text-xl font-extrabold text-slate-800">{{ stats.totalProducts }}</p>
          </div>
          <div class="absolute right-4 bottom-4 text-blue-50 bg-blue-100/50 p-2 rounded-lg group-hover:scale-105 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5 text-blue-600"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
          </div>
        </div>

        <!-- Low Stock Card -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div class="space-y-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sắp hết hàng</span>
            <p class="text-xl font-extrabold text-red-600">{{ stats.lowStockCount }}</p>
          </div>
          <div class="absolute right-4 bottom-4 text-red-50 bg-red-100/50 p-2 rounded-lg group-hover:scale-105 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5 text-red-600"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
          </div>
        </div>

        <!-- New Customers Card -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div class="space-y-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Khách hàng mới (30 ngày)</span>
            <p class="text-xl font-extrabold text-slate-800">{{ stats.newCustomers }}</p>
          </div>
          <div class="absolute right-4 bottom-4 text-emerald-50 bg-emerald-100/50 p-2 rounded-lg group-hover:scale-105 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5 text-emerald-600"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.97 5.97 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
          </div>
        </div>
      </div>

      <!-- Middle Row: 70% Chart + 30% Numbered Best Sellers List -->
      <div class="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <!-- 70% width: Doanh thu 7 ngày chart placeholder -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between lg:col-span-7">
          <div class="mb-4">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Doanh thu 7 ngày</h3>
            <p class="text-[10px] text-slate-400 font-medium">Báo cáo doanh số tuần này</p>
          </div>
          
          <!-- Mock Chart Graphic utilizing SVG layout -->
          <div class="h-64 mt-2 relative flex items-end justify-between px-2 pb-6 border-b border-slate-100">
            <!-- Background grids -->
            <div class="absolute inset-x-0 top-0 h-[1px] bg-slate-100/60"></div>
            <div class="absolute inset-x-0 top-1/4 h-[1px] bg-slate-100/60"></div>
            <div class="absolute inset-x-0 top-2/4 h-[1px] bg-slate-100/60"></div>
            <div class="absolute inset-x-0 top-3/4 h-[1px] bg-slate-100/60"></div>
            
            <!-- Bars representing data -->
            <div class="flex-1 flex flex-col items-center group relative h-full justify-end">
              <div class="w-8 bg-gradient-to-t from-[#f97316] to-[#dc2626] rounded-t-md transition-all duration-300 hover:opacity-85 cursor-pointer" style="height: 48%;">
                <span class="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 font-bold">1.450.000đ</span>
              </div>
              <span class="text-[9px] text-slate-400 font-extrabold mt-2 absolute bottom-0">Thứ 2</span>
            </div>
            
            <div class="flex-1 flex flex-col items-center group relative h-full justify-end">
              <div class="w-8 bg-gradient-to-t from-[#f97316] to-[#dc2626] rounded-t-md transition-all duration-300 hover:opacity-85 cursor-pointer" style="height: 65%;">
                <span class="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 font-bold">2.100.000đ</span>
              </div>
              <span class="text-[9px] text-slate-400 font-extrabold mt-2 absolute bottom-0">Thứ 3</span>
            </div>
            
            <div class="flex-1 flex flex-col items-center group relative h-full justify-end">
              <div class="w-8 bg-gradient-to-t from-[#f97316] to-[#dc2626] rounded-t-md transition-all duration-300 hover:opacity-85 cursor-pointer" style="height: 40%;">
                <span class="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 font-bold">1.100.000đ</span>
              </div>
              <span class="text-[9px] text-slate-400 font-extrabold mt-2 absolute bottom-0">Thứ 4</span>
            </div>
            
            <div class="flex-1 flex flex-col items-center group relative h-full justify-end">
              <div class="w-8 bg-gradient-to-t from-[#f97316] to-[#dc2626] rounded-t-md transition-all duration-300 hover:opacity-85 cursor-pointer" style="height: 82%;">
                <span class="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 font-bold">2.750.000đ</span>
              </div>
              <span class="text-[9px] text-slate-400 font-extrabold mt-2 absolute bottom-0">Thứ 5</span>
            </div>
            
            <div class="flex-1 flex flex-col items-center group relative h-full justify-end">
              <div class="w-8 bg-gradient-to-t from-[#f97316] to-[#dc2626] rounded-t-md transition-all duration-300 hover:opacity-85 cursor-pointer" style="height: 95%;">
                <span class="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 font-bold">3.400.000đ</span>
              </div>
              <span class="text-[9px] text-slate-400 font-extrabold mt-2 absolute bottom-0">Thứ 6</span>
            </div>
            
            <div class="flex-1 flex flex-col items-center group relative h-full justify-end">
              <div class="w-8 bg-gradient-to-t from-[#f97316] to-[#dc2626] rounded-t-md transition-all duration-300 hover:opacity-85 cursor-pointer" style="height: 72%;">
                <span class="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 font-bold">2.350.000đ</span>
              </div>
              <span class="text-[9px] text-slate-400 font-extrabold mt-2 absolute bottom-0">Thứ 7</span>
            </div>
            
            <div class="flex-1 flex flex-col items-center group relative h-full justify-end">
              <div class="w-8 bg-gradient-to-t from-[#f97316] to-[#dc2626] rounded-t-md transition-all duration-300 hover:opacity-85 cursor-pointer" style="height: 55%;">
                <span class="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 font-bold">1.800.000đ</span>
              </div>
              <span class="text-[9px] text-slate-400 font-extrabold mt-2 absolute bottom-0">Chủ Nhật</span>
            </div>
          </div>
        </div>

        <!-- 30% width: Sản phẩm bán chạy numbered list -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col lg:col-span-3">
          <div class="border-b border-slate-100 pb-4 mb-4">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Sản phẩm bán chạy</h3>
            <p class="text-[10px] text-slate-400 font-medium">Bán chạy nhất tháng này</p>
          </div>
          
          <div class="space-y-4 flex-grow overflow-y-auto max-h-[256px]">
            <div v-for="(prod, idx) in bestSelling.slice(0, 5)" :key="prod._id" class="flex items-center gap-3">
              <!-- Number in circle -->
              <div class="w-6 h-6 rounded-full bg-red-50 text-[#dc2626] flex items-center justify-center font-extrabold text-xs flex-shrink-0">
                {{ idx + 1 }}
              </div>
              
              <div class="flex-grow min-w-0">
                <p class="text-[11px] font-bold text-slate-800 truncate leading-tight">{{ prod.name }}</p>
                <p class="text-[9px] text-slate-400 font-semibold">{{ formatCurrency(prod.discountPrice || prod.price) }}</p>
              </div>

              <div class="text-right flex-shrink-0">
                <span class="text-[11px] font-bold text-slate-800">{{ prod.sold }}</span>
                <p class="text-[8px] text-slate-400 uppercase font-semibold">đã bán</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom row: Recent Orders table (Matches Screenshot) -->
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Đơn hàng gần đây</h3>
          <router-link to="/admin/orders" class="text-xs font-bold text-red-600 hover:text-red-700">Tất cả đơn hàng</router-link>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="text-slate-400 font-bold border-b border-slate-100">
                <th class="pb-3">MÃ ĐƠN</th>
                <th class="pb-3">KHÁCH HÀNG</th>
                <th class="pb-3">NGÀY ĐẶT</th>
                <th class="pb-3">THANH TOÁN</th>
                <th class="pb-3">TỔNG TIỀN</th>
                <th class="pb-3">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
              <tr v-for="order in recentOrders" :key="order._id" class="hover:bg-slate-50">
                <td class="py-3.5 font-mono text-[10px] font-bold text-slate-900">{{ order.orderCode }}</td>
                <td class="py-3.5">
                  <div>
                    <p class="font-bold text-slate-800">{{ order.customerName || 'Khách vãng lai' }}</p>
                    <p class="text-[9px] text-slate-400 font-medium">{{ order.phone }}</p>
                  </div>
                </td>
                <td class="py-3.5 text-slate-500">{{ new Date(order.createdAt).toLocaleDateString('vi-VN') }}</td>
                <td class="py-3.5">
                  <span class="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                    {{ order.paymentMethod === 'COD' ? 'COD' : (order.paymentMethod === 'EWALLET' ? 'Ví điện tử' : 'Chuyển khoản') }}
                  </span>
                  <span :class="['ml-1.5 text-[9px] font-bold', order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-amber-600']">
                    {{ order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán' }}
                  </span>
                </td>
                <td class="py-3.5 font-bold text-slate-900">{{ formatCurrency(order.total) }}</td>
                <td class="py-3.5">
                  <span :class="['px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide', getStatusBadgeStyle(order.orderStatus)]">
                    {{ getStatusLabel(order.orderStatus) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { reportService } from '@/services/report.service'
import { inventoryService } from '@/services/inventory.service'
import { useToast } from 'vue-toastification'
import { formatCurrency, getStatusLabel } from '@/utils/helpers'
import type { DashboardStats, Order, Product } from '@/types'

const stats = ref<DashboardStats | null>(null)
const recentOrders = ref<Order[]>([])
const bestSelling = ref<Product[]>([])
const lowStockItems = ref<any[]>([])
const loading = ref(true)
const toast = useToast()

onMounted(async () => {
  try {
    const res = await reportService.getDashboard()
    stats.value = res.data.stats
    recentOrders.value = res.data.recentOrders
    bestSelling.value = res.data.bestSellingProducts
    
    // Load low stock items for dashboard notifications (Low Stock Alert)
    const lowStockRes = await inventoryService.getLowStock()
    lowStockItems.value = lowStockRes.data
    if (lowStockItems.value.length > 0) {
      toast.warning(`Cảnh báo: Có ${lowStockItems.value.length} sản phẩm sắp hết hàng (tồn kho < minStock)!`, {
        timeout: 6000
      })
    }
  } catch (err) {
    console.error('Error fetching dashboard stats or low stock items', err)
  } finally {
    loading.value = false
  }
})

// Specific status badge mapping requested in design screenshots
function getStatusBadgeStyle(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-100 text-amber-800 border border-amber-200'
    case 'CONFIRMED':
      return 'bg-red-100 text-red-800 border border-red-200'
    case 'SHIPPING':
      return 'bg-blue-100 text-blue-800 border border-blue-200'
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-800 border border-slate-200'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}
</script>
