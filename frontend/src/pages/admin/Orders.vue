<template>
  <div class="space-y-6">
    <!-- Header (Matches Screenshot) -->
    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
      <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Quản lý đơn hàng</h2>
      <p class="text-[11px] text-slate-400 font-semibold">Theo dõi, kiểm tra thanh toán và cập nhật trạng thái đơn hàng của khách hàng.</p>
    </div>

    <!-- Tab Filters (Matches Screenshot: active red pill) -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="selectTab(tab.value)"
        :class="[
          currentTab === tab.value
            ? 'bg-[#dc2626] text-white shadow-xs'
            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200',
          'px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      <!-- Orders List (Matches Screenshot) -->
      <div class="xl:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div v-if="loading" class="p-8 animate-pulse space-y-4">
          <div v-for="n in 5" :key="n" class="h-12 bg-slate-100 rounded-xl w-full"></div>
        </div>

        <div v-else-if="filteredOrders.length === 0" class="p-16 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">
          Không có đơn hàng nào trong trạng thái này.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th class="py-4 px-5">MÃ ĐƠN</th>
                <th class="py-4 px-5">KHÁCH HÀNG</th>
                <th class="py-4 px-5">NGÀY ĐẶT</th>
                <th class="py-4 px-5">THANH TOÁN</th>
                <th class="py-4 px-5">TỔNG TIỀN</th>
                <th class="py-4 px-5">TRẠNG THÁI</th>
                <th class="py-4 px-5 text-right">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-150 font-medium text-slate-800">
              <tr
                v-for="order in filteredOrders"
                :key="order._id"
                @click="selectOrder(order)"
                class="hover:bg-slate-50/50 cursor-pointer transition-colors"
                :class="[selectedOrder?._id === order._id ? 'bg-red-50/40' : '']"
              >
                <!-- Code -->
                <td class="py-4 px-5 font-mono text-[10px] font-bold text-slate-900">{{ order.orderCode }}</td>
                <!-- Customer info -->
                <td class="py-4 px-5">
                  <p class="font-bold text-slate-800 leading-tight">{{ order.customerName || 'Vãng lai' }}</p>
                  <p class="text-[9px] text-slate-400 font-medium mt-0.5">{{ order.phone }}</p>
                </td>
                <!-- Order date -->
                <td class="py-4 px-5 text-slate-500">{{ formatDate(order.createdAt) }}</td>
                <!-- Payment method and status stacked (Matches Screenshot) -->
                <td class="py-4 px-5">
                  <p class="text-[10px] text-slate-800 font-extrabold">{{ order.paymentMethod === 'COD' ? 'COD' : 'Chuyển khoản' }}</p>
                  <p :class="['text-[9px] font-semibold mt-0.5', order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600']">
                    {{ order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán' }}
                  </p>
                </td>
                <!-- Total -->
                <td class="py-4 px-5 font-bold text-slate-900">{{ formatCurrency(order.total) }}</td>
                <!-- Status -->
                <td class="py-4 px-5">
                  <span :class="['px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide', getStatusBadgeStyle(order.orderStatus)]">
                    {{ getStatusLabel(order.orderStatus) }}
                  </span>
                </td>
                <!-- Actions -->
                <td class="py-4 px-5 text-right">
                  <button @click.stop="selectOrder(order)" class="text-[#dc2626] hover:text-red-700 font-extrabold cursor-pointer">
                    Chi tiết
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Order Detail / Edit Panel -->
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Chi tiết đơn hàng</h3>

        <div v-if="!selectedOrder" class="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-wider">
          Chọn một đơn hàng để xem chi tiết và cập nhật trạng thái.
        </div>

        <div v-else class="space-y-5">
          <!-- Codes and statuses -->
          <div class="space-y-2 text-xs">
            <div class="flex justify-between items-center">
              <span class="text-slate-400 font-bold">Mã đơn hàng:</span>
              <span class="font-mono font-bold text-slate-800">{{ selectedOrder.orderCode }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400 font-bold">Thanh toán:</span>
              <span :class="['px-2 py-0.5 rounded text-[9px] font-extrabold', selectedOrder.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100']">
                {{ selectedOrder.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán' }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400 font-bold">Phương thức:</span>
              <span class="font-extrabold text-slate-800">{{ selectedOrder.paymentMethod === 'COD' ? 'COD' : 'Chuyển khoản' }}</span>
            </div>
          </div>

          <!-- Address and contact -->
          <div class="border-t border-slate-150 pt-4 space-y-2 text-xs">
            <h4 class="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Thông tin giao hàng</h4>
            <p class="text-slate-600 font-medium"><span class="font-bold text-slate-700">Tên:</span> {{ selectedOrder.customerName }}</p>
            <p class="text-slate-600 font-medium"><span class="font-bold text-slate-700">SĐT:</span> {{ selectedOrder.phone }}</p>
            <p class="text-slate-600 font-medium"><span class="font-bold text-slate-700">Email:</span> {{ selectedOrder.customerEmail }}</p>
            <p class="text-slate-600 font-medium"><span class="font-bold text-slate-700">Địa chỉ:</span> {{ selectedOrder.shippingAddress }}</p>
            <p v-if="selectedOrder.note" class="text-slate-600 font-medium"><span class="font-bold text-slate-700">Ghi chú:</span> {{ selectedOrder.note }}</p>
          </div>

          <!-- Items ordered -->
          <div class="border-t border-slate-150 pt-4 space-y-3">
            <h4 class="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Sản phẩm đặt mua</h4>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              <div v-for="(item, idx) in selectedOrder.items" :key="idx" class="flex justify-between items-center text-xs">
                <span class="truncate max-w-[160px] font-bold text-slate-700">{{ item.name }} x{{ item.quantity }}</span>
                <span class="font-bold text-slate-800">{{ formatCurrency(item.price * item.quantity) }}</span>
              </div>
            </div>
          </div>

          <!-- Summary pricing -->
          <div class="border-t border-slate-150 pt-4 space-y-2 text-xs font-semibold">
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
            <div class="border-t border-slate-150 pt-2 flex justify-between text-sm">
              <span class="font-extrabold text-slate-800">Tổng cộng:</span>
              <span class="font-black text-red-600 text-base">{{ formatCurrency(selectedOrder.total) }}</span>
            </div>
          </div>

          <!-- Update Order Status Form -->
          <div class="border-t border-slate-150 pt-4 space-y-3">
            <label class="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Cập nhật trạng thái đơn hàng</label>
            <div class="flex gap-2">
              <select
                v-model="newStatus"
                class="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:bg-white text-slate-700 transition-all font-semibold"
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
                class="bg-[#dc2626] hover:bg-red-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
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
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { orderService } from '@/services/order.service'
import { formatCurrency, formatDate, getStatusLabel } from '@/utils/helpers'
import type { Order } from '@/types'

const toast = useToast()

const orders = ref<Order[]>([])
const loading = ref(true)

const selectedOrder = ref<Order | null>(null)
const newStatus = ref('')
const updatingStatus = ref(false)

const currentTab = ref('ALL')

const tabs = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xác nhận' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'SHIPPING', label: 'Đang giao' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' }
]

onMounted(fetchOrders)

async function fetchOrders() {
  loading.value = true
  try {
    const res = await orderService.getAll()
    orders.value = res.data.data
    if (orders.value.length > 0 && !selectedOrder.value) {
      selectOrder(orders.value[0])
    }
  } catch (err) {
    toast.error('Lỗi khi tải danh sách đơn hàng')
  } finally {
    loading.value = false
  }
}

const filteredOrders = computed(() => {
  if (currentTab.value === 'ALL') return orders.value
  return orders.value.filter(o => o.orderStatus === currentTab.value)
})

function selectTab(tabVal: string) {
  currentTab.value = tabVal
  // Automatically select first element of new tab
  if (filteredOrders.value.length > 0) {
    selectOrder(filteredOrders.value[0])
  } else {
    selectedOrder.value = null
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

<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
