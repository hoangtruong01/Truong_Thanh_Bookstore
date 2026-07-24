<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex items-center justify-between mb-6">
      <router-link to="/my-orders" class="text-xs font-bold text-slate-600 hover:text-[#dc2626] flex items-center gap-1">
        &larr; Quay lại danh sách đơn hàng
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white border border-slate-200 rounded-3xl p-8 space-y-4 animate-pulse">
      <div class="h-6 bg-slate-200 rounded w-1/3"></div>
      <div class="h-4 bg-slate-100 rounded w-1/4"></div>
      <div class="h-40 bg-slate-50 rounded"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-white border border-red-200 rounded-3xl p-12 text-center space-y-4">
      <div class="text-3xl">⚠️</div>
      <h3 class="text-lg font-bold text-slate-800">{{ error }}</h3>
      <router-link to="/my-orders" class="inline-block px-5 py-2.5 bg-[#dc2626] text-white font-bold text-xs rounded-xl">
        Về danh sách đơn hàng
      </router-link>
    </div>

    <!-- Order Detail View -->
    <div v-else-if="order" class="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs space-y-6">
      <!-- Header -->
      <div class="bg-slate-50 border-b border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Chi tiết đơn hàng</span>
          <h2 class="text-xl font-mono font-black text-slate-900">#{{ order.orderCode }}</h2>
          <p class="text-xs text-slate-500 mt-0.5">Đặt ngày: {{ formatDate(order.createdAt) }}</p>
        </div>
        <div class="flex items-center gap-2">
          <span :class="['px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide', getStatusBadgeStyle(order.orderStatus)]">
            {{ getStatusLabel(order.orderStatus) }}
          </span>
          <button 
            @click="downloadInvoice"
            class="bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>📄</span>
            Tải hóa đơn PDF
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Delivery & Payment Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50/70 border border-slate-100 rounded-2xl">
          <div class="space-y-2">
            <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider">Thông tin người nhận</h4>
            <div class="text-xs text-slate-600 space-y-1">
              <p><strong>Họ tên:</strong> {{ order.customerName || 'N/A' }}</p>
              <p><strong>Số điện thoại:</strong> {{ order.phone }}</p>
              <p><strong>Email:</strong> {{ order.customerEmail || 'N/A' }}</p>
              <p><strong>Địa chỉ:</strong> {{ order.shippingAddress }}</p>
              <p v-if="order.note"><strong>Ghi chú:</strong> {{ order.note }}</p>
            </div>
          </div>

          <div class="space-y-2">
            <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider">Thanh toán & Vận chuyển</h4>
            <div class="text-xs text-slate-600 space-y-1">
              <p><strong>Phương thức:</strong> {{ getPaymentMethodLabel(order.paymentMethod) }}</p>
              <p>
                <strong>Trạng thái thanh toán:</strong>
                <span :class="['ml-1 font-bold', order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-amber-600']">
                  {{ order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán' }}
                </span>
              </p>
              <p v-if="order.promotionCode"><strong>Mã giảm giá đã dùng:</strong> <span class="font-mono text-red-600 font-bold">{{ order.promotionCode }}</span></p>
            </div>
          </div>
        </div>

        <!-- Order Tracking Timeline -->
        <div v-if="order.timeline && order.timeline.length > 0" class="p-4 border border-slate-100 bg-slate-50/20 rounded-2xl space-y-4">
          <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider">Hành trình đơn hàng</h4>
          <div class="relative pl-6 space-y-4 border-l border-slate-200 ml-3">
            <div 
              v-for="(time, idx) in [...order.timeline].reverse()" 
              :key="idx" 
              class="relative"
            >
              <!-- Timeline Dot -->
              <span 
                class="absolute -left-[30px] top-1 w-4.5 h-4.5 rounded-full border-2 bg-white flex items-center justify-center"
                :class="idx === 0 ? 'border-red-600 ring-4 ring-red-100' : 'border-slate-300'"
              >
                <span v-if="idx === 0" class="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
              </span>
              <div class="space-y-0.5">
                <span class="text-xs font-black text-slate-800 uppercase">
                  {{ getStatusLabel(time.status) }}
                </span>
                <span class="text-[10px] text-slate-400 font-medium block">
                  {{ formatDate(time.createdAt) }}
                </span>
                <p class="text-xs text-slate-600 mt-1">{{ time.note }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="space-y-3">
          <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider">Danh sách sản phẩm ({{ order.items.length }})</h4>
          <div class="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
            <div v-for="item in order.items" :key="item.product" class="p-4 flex items-center gap-4 hover:bg-slate-50/50">
              <img :src="item.image || 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'" class="w-14 h-14 object-cover rounded-xl border border-slate-100 bg-white" />
              <div class="flex-grow min-w-0">
                <h5 class="text-xs font-bold text-slate-800 truncate">{{ item.name }}</h5>
                <p class="text-[11px] text-slate-400 mt-0.5">{{ formatCurrency(item.price) }} × {{ item.quantity }}</p>
              </div>
              <div class="text-right font-bold text-xs text-slate-900">
                {{ formatCurrency(item.price * item.quantity) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Cost Calculation Summary -->
        <div class="border-t border-slate-100 pt-4 space-y-2 text-xs font-medium max-w-xs ml-auto">
          <div class="flex justify-between text-slate-500">
            <span>Tạm tính</span>
            <span class="font-bold text-slate-800">{{ formatCurrency(order.subtotal) }}</span>
          </div>
          <div class="flex justify-between text-slate-500">
            <span>Phí vận chuyển</span>
            <span class="font-bold text-slate-800">{{ order.shippingFee === 0 ? 'Miễn phí' : formatCurrency(order.shippingFee) }}</span>
          </div>
          <div v-if="order.discount > 0" class="flex justify-between text-red-500">
            <span>Giảm giá</span>
            <span class="font-bold">-{{ formatCurrency(order.discount) }}</span>
          </div>
          <div class="border-t border-slate-200 pt-2 flex justify-between text-slate-900 text-sm font-black">
            <span>Tổng cộng</span>
            <span class="text-[#dc2626]">{{ formatCurrency(order.total) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { orderService } from '@/services/order.service'
import { formatCurrency, formatDate, getStatusLabel } from '@/utils/helpers'
import api from '@/utils/api'
import type { Order } from '@/types'

const route = useRoute()
const order = ref<any | null>(null)
const loading = ref(true)
const error = ref('')

function getPaymentMethodLabel(method: string) {
  switch (method) {
    case 'COD': return 'Thanh toán khi nhận hàng (COD)'
    case 'BANK_TRANSFER': return 'Chuyển khoản ngân hàng'
    case 'EWALLET': return 'Ví điện tử'
    default: return method
  }
}

function getStatusBadgeStyle(status: string) {
  switch (status) {
    case 'PENDING': return 'bg-amber-100 text-amber-800'
    case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
    case 'SHIPPING': return 'bg-purple-100 text-purple-800'
    case 'COMPLETED': return 'bg-green-100 text-green-800'
    case 'CANCELLED': return 'bg-red-100 text-red-800'
    default: return 'bg-slate-100 text-slate-600'
  }
}

async function downloadInvoice() {
  if (!order.value) return
  try {
    const res = await api.get(`/orders/${order.value._id}/invoice`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `invoice-${order.value.orderCode}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    alert('Không thể tải hóa đơn. Vui lòng thử lại sau.')
  }
}

onMounted(async () => {
  const orderId = route.params.id as string
  if (!orderId) {
    error.value = 'Mã đơn hàng không hợp lệ'
    loading.value = false
    return
  }

  try {
    const res = await orderService.getById(orderId)
    order.value = res.data
  } catch (err: any) {
    error.value = err.message || 'Không thể tìm thấy thông tin đơn hàng'
  } finally {
    loading.value = false
  }
})
</script>
