<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-1">
      <h2 class="text-lg font-extrabold text-slate-900">Quản lý đơn hàng</h2>
      <p class="text-xs text-slate-500 font-medium">Theo dõi, kiểm tra thanh toán và cập nhật trạng thái đơn hàng của khách hàng.</p>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
      <!-- Orders List -->
      <div class="xl:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div v-if="loading" class="p-8 animate-pulse space-y-4">
          <div v-for="n in 5" :key="n" class="h-12 bg-slate-100 rounded-xl w-full"></div>
        </div>

        <div v-else-if="orders.length === 0" class="p-16 text-center text-slate-400 font-medium">
          Chưa có đơn hàng nào trong hệ thống.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-150 text-slate-400 font-bold text-xs uppercase tracking-wider">
                <th class="py-4 px-6">Mã đơn</th>
                <th class="py-4 px-6">Khách hàng</th>
                <th class="py-4 px-6">Ngày đặt</th>
                <th class="py-4 px-6">Tổng cộng</th>
                <th class="py-4 px-6">Trạng thái</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
              <tr
                v-for="order in orders"
                :key="order._id"
                @click="selectOrder(order)"
                class="hover:bg-slate-50/50 cursor-pointer transition-colors"
                :class="[selectedOrder?._id === order._id ? 'bg-blue-50/40' : '']"
              >
                <td class="py-4 px-6 font-mono text-xs text-blue-700 font-bold">{{ order.orderCode }}</td>
                <td class="py-4 px-6">
                  <p class="font-bold text-slate-900">{{ order.customerName || 'Khách vãng lai' }}</p>
                  <p class="text-xs text-slate-400 font-normal">{{ order.phone }}</p>
                </td>
                <td class="py-4 px-6 text-xs text-slate-500">{{ formatDate(order.createdAt) }}</td>
                <td class="py-4 px-6 font-bold">{{ formatCurrency(order.total) }}</td>
                <td class="py-4 px-6">
                  <span :class="['px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', getStatusColor(order.orderStatus)]">
                    {{ getStatusLabel(order.orderStatus) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Order Detail / Edit Panel -->
      <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">Chi tiết đơn hàng</h3>

        <div v-if="!selectedOrder" class="text-center py-12 text-slate-400 text-sm font-medium">
          Chọn một đơn hàng để xem chi tiết và cập nhật trạng thái.
        </div>

        <div v-else class="space-y-6">
          <!-- Codes and statuses -->
          <div class="space-y-2">
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-400 font-medium">Mã đơn hàng:</span>
              <span class="font-mono font-bold text-slate-800">{{ selectedOrder.orderCode }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-400 font-medium">Thanh toán:</span>
              <span :class="['px-2 py-0.5 rounded text-[10px] font-bold uppercase', getStatusColor(selectedOrder.paymentStatus)]">
                {{ getStatusLabel(selectedOrder.paymentStatus) }}
              </span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-400 font-medium">Phương thức:</span>
              <span class="font-bold text-slate-800 text-xs">{{ getStatusLabel(selectedOrder.paymentMethod) }}</span>
            </div>
          </div>

          <!-- Address and contact -->
          <div class="border-t border-slate-100 pt-4 space-y-2 text-sm">
            <h4 class="font-bold text-slate-800">Thông tin giao hàng</h4>
            <p class="text-xs text-slate-500 font-medium"><span class="font-bold text-slate-700">Tên:</span> {{ selectedOrder.customerName }}</p>
            <p class="text-xs text-slate-500 font-medium"><span class="font-bold text-slate-700">SĐT:</span> {{ selectedOrder.phone }}</p>
            <p class="text-xs text-slate-500 font-medium"><span class="font-bold text-slate-700">Email:</span> {{ selectedOrder.customerEmail }}</p>
            <p class="text-xs text-slate-500 font-medium"><span class="font-bold text-slate-700">Địa chỉ:</span> {{ selectedOrder.shippingAddress }}</p>
            <p v-if="selectedOrder.note" class="text-xs text-slate-500 font-medium"><span class="font-bold text-slate-700">Ghi chú:</span> {{ selectedOrder.note }}</p>
          </div>

          <!-- Items ordered -->
          <div class="border-t border-slate-100 pt-4 space-y-3">
            <h4 class="font-bold text-slate-800 text-sm">Sản phẩm đặt mua</h4>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              <div v-for="(item, idx) in selectedOrder.items" :key="idx" class="flex justify-between items-center text-xs">
                <span class="truncate max-w-[160px] font-medium text-slate-700">{{ item.name }} x{{ item.quantity }}</span>
                <span class="font-bold text-slate-800">{{ formatCurrency(item.price * item.quantity) }}</span>
              </div>
            </div>
          </div>

          <!-- Summary pricing -->
          <div class="border-t border-slate-100 pt-4 space-y-2 text-xs font-medium">
            <div class="flex justify-between text-slate-500">
              <span>Tạm tính:</span>
              <span class="text-slate-800 font-bold">{{ formatCurrency(selectedOrder.subtotal) }}</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>Phí giao hàng:</span>
              <span class="text-slate-800 font-bold">{{ formatCurrency(selectedOrder.shippingFee) }}</span>
            </div>
            <div v-if="selectedOrder.discount > 0" class="flex justify-between text-red-500">
              <span>Khuyến mãi:</span>
              <span class="font-bold">-{{ formatCurrency(selectedOrder.discount) }}</span>
            </div>
            <div class="border-t border-slate-100 pt-2 flex justify-between text-sm">
              <span class="font-extrabold text-slate-800">Tổng cộng:</span>
              <span class="font-black text-blue-700 text-base">{{ formatCurrency(selectedOrder.total) }}</span>
            </div>
          </div>

          <!-- Update Order Status Form -->
          <div class="border-t border-slate-100 pt-4 space-y-3">
            <label class="text-xs font-bold text-slate-700">Cập nhật trạng thái đơn hàng</label>
            <div class="flex gap-2">
              <select
                v-model="newStatus"
                class="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="PENDING">Chờ xử lý</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="SHIPPING">Đang giao</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Hủy đơn</option>
              </select>
              <button
                @click="updateStatus"
                :disabled="updatingStatus"
                class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors disabled:opacity-50"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { orderService } from '@/services/order.service'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/utils/helpers'
import type { Order } from '@/types'

const toast = useToast()

const orders = ref<Order[]>([])
const loading = ref(true)

const selectedOrder = ref<Order | null>(null)
const newStatus = ref('')
const updatingStatus = ref(false)

onMounted(fetchOrders)

async function fetchOrders() {
  loading.value = true
  try {
    const res = await orderService.getAll()
    orders.value = res.data
    if (orders.value.length > 0 && !selectedOrder.value) {
      selectOrder(orders.value[0])
    }
  } catch (err) {
    toast.error('Lỗi khi tải danh sách đơn hàng')
  } finally {
    loading.value = false
  }
}

function selectOrder(order: Order) {
  selectedOrder.value = order
  newStatus.value = order.orderStatus
}

async function updateStatus() {
  if (!selectedOrder.value) return
  updatingStatus.value = true
  try {
    await orderService.updateStatus(selectedOrder.value._id, newStatus.value)
    toast.success('Cập nhật trạng thái đơn hàng thành công')
    
    // Refresh only the status on current reference
    selectedOrder.value.orderStatus = newStatus.value as any
    fetchOrders()
  } catch (err: any) {
    toast.error(err.message || 'Cập nhật trạng thái thất bại')
  } finally {
    updatingStatus.value = false
  }
}
</script>
