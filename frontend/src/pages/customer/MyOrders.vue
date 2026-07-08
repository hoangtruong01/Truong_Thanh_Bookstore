<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-extrabold text-slate-900">Đơn hàng của tôi</h1>
      <router-link to="/products" class="text-xs font-bold text-[#dc2626] hover:underline flex items-center gap-1">
        &larr; Tiếp tục mua sắm
      </router-link>
    </div>

    <!-- Not Authenticated State -->
    <div v-if="!authStore.isAuthenticated" class="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-6">
      <div class="w-20 h-20 bg-red-50 text-[#dc2626] rounded-full flex items-center justify-center mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0V10.5m-3.75 3h16.5a1.5 1.5 0 0 1 1.5 1.5v5.25a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5v-5.25a1.5 1.5 0 0 1 1.5-1.5Z" />
        </svg>
      </div>
      <div class="space-y-2">
        <h3 class="text-lg font-bold text-slate-800">Yêu cầu đăng nhập</h3>
        <p class="text-slate-400 text-sm max-w-xs mx-auto">Vui lòng đăng nhập tài khoản để xem danh sách đơn hàng đã mua.</p>
      </div>
      <router-link to="/login?redirect=/my-orders" class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-3 px-8 rounded-xl transition-colors inline-block text-sm">
        Đăng nhập ngay
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="space-y-4">
      <div v-for="n in 3" :key="n" class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 animate-pulse">
        <div class="flex justify-between items-center">
          <div class="h-4 bg-slate-200 rounded w-1/4"></div>
          <div class="h-4 bg-slate-200 rounded w-1/6"></div>
        </div>
        <div class="h-10 bg-slate-100 rounded"></div>
      </div>
    </div>

    <!-- Empty Orders State -->
    <div v-else-if="orders.length === 0" class="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-6">
      <div class="w-20 h-20 bg-red-50 text-[#dc2626] rounded-full flex items-center justify-center mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H3.75A1.125 1.125 0 0 0 2.625 3.375v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-3a3.375 3.375 0 0 0-3.375-3.375H12" />
        </svg>
      </div>
      <div class="space-y-2">
        <h3 class="text-lg font-bold text-slate-800">Bạn chưa có đơn hàng nào</h3>
        <p class="text-slate-400 text-sm max-w-xs mx-auto">Khám phá hàng ngàn sản phẩm văn phòng phẩm chính hãng tại Trường Thành Bookstore.</p>
      </div>
      <router-link to="/products" class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-3 px-8 rounded-xl transition-colors inline-block text-sm">
        Mua sắm ngay
      </router-link>
    </div>

    <!-- Orders List -->
    <div v-else class="space-y-6">
      <div v-for="order in orders" :key="order._id" class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <!-- Order Header -->
        <div class="bg-slate-50/50 border-b border-slate-100 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mã đơn hàng</p>
              <p class="text-sm font-mono font-bold text-slate-900">{{ order.orderCode }}</p>
            </div>
            <span :class="['px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide', getStatusBadgeStyle(order.orderStatus)]">
              {{ getStatusLabel(order.orderStatus) }}
            </span>
          </div>

          <div class="text-left sm:text-right">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ngày đặt hàng</p>
            <p class="text-xs font-bold text-slate-700">{{ formatDate(order.createdAt) }}</p>
          </div>
        </div>

        <!-- Order Items -->
        <div class="p-4 sm:p-6 divide-y divide-slate-100">
          <div v-for="item in order.items" :key="item.product" class="flex gap-4 py-4 first:pt-0 last:pb-0">
            <div class="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
              <img :src="item.image || 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'" class="w-full h-full object-cover" />
            </div>
            <div class="flex-grow min-w-0 flex flex-col justify-between">
              <div>
                <h4 class="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">{{ item.name }}</h4>
                <p class="text-[10px] text-slate-400 font-semibold mt-1">Số lượng: {{ item.quantity }}</p>
              </div>
              <div class="text-xs font-bold text-slate-800">
                {{ formatCurrency(item.price) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Order Footer -->
        <div class="border-t border-slate-100 p-4 sm:p-6 bg-slate-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="text-xs text-slate-500 space-y-1">
            <p><strong>Người nhận:</strong> {{ order.customerName || authStore.user?.fullName }} ({{ order.phone }})</p>
            <p><strong>Địa chỉ:</strong> {{ order.shippingAddress }}</p>
            <p>
              <strong>Thanh toán:</strong>
              <span class="font-bold text-slate-700 ml-1">
                {{ order.paymentMethod === 'COD' ? 'COD' : (order.paymentMethod === 'EWALLET' ? 'Ví điện tử' : 'Chuyển khoản') }}
              </span>
              <span :class="['ml-2 text-[10px] font-black', order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-amber-600']">
                ({{ order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán' }})
              </span>
            </p>
          </div>

          <div class="flex flex-col items-end gap-3 flex-shrink-0">
            <div class="flex items-baseline gap-1.5">
              <span class="text-xs font-bold text-slate-500">Tổng tiền:</span>
              <span class="text-base font-black text-[#dc2626]">{{ formatCurrency(order.total) }}</span>
            </div>

            <!-- Cancel Button (Only for PENDING orders) -->
            <button
              v-if="order.orderStatus === 'PENDING'"
              @click="cancelOrder(order._id)"
              class="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Hủy đơn hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { orderService } from '@/services/order.service'
import { formatCurrency, getStatusLabel, formatDate } from '@/utils/helpers'
import type { Order } from '@/types'
import { useSeoMeta } from '@/composables/useSeoMeta'

useSeoMeta({
  title: 'Đơn hàng của tôi',
  description: 'Xem và theo dõi tình trạng đơn hàng của bạn tại Trường Thành Stationery.',
})

const authStore = useAuthStore()
const toast = useToast()

const orders = ref<Order[]>([])
const loading = ref(true)

async function fetchOrders() {
  if (!authStore.isAuthenticated) return
  loading.value = true
  try {
    const res = await orderService.getMyOrders()
    orders.value = Array.isArray(res.data) ? res.data : (res.data?.data || [])
  } catch (err: any) {
    console.error('Failed to load my orders', err)
    toast.error('Không thể tải lịch sử đơn hàng')
  } finally {
    loading.value = false
  }
}

async function cancelOrder(id: string) {
  if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return
  try {
    await orderService.cancel(id)
    toast.success('Hủy đơn hàng thành công')
    await fetchOrders()
  } catch (err: any) {
    toast.error(err.message || 'Hủy đơn hàng thất bại')
  }
}

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

onMounted(() => {
  fetchOrders()
})
</script>
