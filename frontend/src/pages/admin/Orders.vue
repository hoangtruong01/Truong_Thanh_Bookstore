<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
      <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Quản lý đơn hàng</h2>
      <p class="text-[11px] text-slate-400 font-semibold">Theo dõi, kiểm tra thanh toán và cập nhật trạng thái đơn hàng của khách hàng.</p>
    </div>

    <!-- FilterBar with tabs and search -->
    <FilterBar
      v-model="orderQuery"
      :tabs="tabs"
      v-model:activeTab="currentTab"
      placeholder="Tìm kiếm theo mã đơn, tên khách hàng, số điện thoại..."
      @tab-change="onTabChange"
    />

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      <!-- Orders List (DataTable) -->
      <div class="xl:col-span-2">
        <DataTable
          :columns="columns"
          :items="filteredOrders"
          :loading="loading"
          clickable
          :selected-row-key="selectedOrder?._id"
          empty-text="Chưa có đơn hàng nào."
          empty-subtext="Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại."
          @row-click="selectOrder"
        >
          <!-- Order Code -->
          <template #cell(orderCode)="{ row }">
            <span class="font-mono text-[10px] font-bold text-slate-900">{{ row.orderCode }}</span>
          </template>

          <!-- Customer info -->
          <template #cell(customer)="{ row }">
            <div>
              <p class="font-bold text-slate-800 leading-tight">{{ row.customerName || 'Vãng lai' }}</p>
              <p class="text-[9px] text-slate-400 font-medium mt-0.5">{{ row.phone }}</p>
            </div>
          </template>

          <!-- Created Date -->
          <template #cell(createdAt)="{ row }">
            <span class="text-slate-500">{{ formatDate(row.createdAt) }}</span>
          </template>

          <!-- Payment -->
          <template #cell(payment)="{ row }">
            <div>
              <p class="text-[10px] text-slate-800 font-extrabold">{{ getStatusLabel(row.paymentMethod) }}</p>
              <p :class="['text-[9px] font-semibold mt-0.5', row.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600']">
                {{ row.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán' }}
              </p>
            </div>
          </template>

          <!-- Total -->
          <template #cell(total)="{ row }">
            <span class="font-bold text-slate-900">{{ formatCurrency(row.total) }}</span>
          </template>

          <!-- StatusBadge -->
          <template #cell(orderStatus)="{ row }">
            <StatusBadge :status="row.orderStatus" type="order" />
          </template>

          <!-- Action -->
          <template #cell(actions)="{ row }">
            <button
              type="button"
              @click.stop="selectOrder(row)"
              class="text-[#dc2626] hover:text-red-700 font-extrabold cursor-pointer"
            >
              Chi tiết
            </button>
          </template>
        </DataTable>
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
              <StatusBadge :status="selectedOrder.paymentStatus" type="payment" />
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400 font-bold">Phương thức:</span>
              <span class="font-extrabold text-slate-800">{{ getStatusLabel(selectedOrder.paymentMethod) }}</span>
            </div>
          </div>

          <!-- Customer info block -->
          <div class="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs space-y-1.5">
            <p class="font-extrabold text-slate-900">{{ selectedOrder.customerName || 'Khách vãng lai' }}</p>
            <p class="text-slate-600">SĐT: {{ selectedOrder.phone }}</p>
            <p v-if="selectedOrder.customerEmail" class="text-slate-600">Email: {{ selectedOrder.customerEmail }}</p>
            <p class="text-slate-500 text-[11px] leading-relaxed pt-1 border-t border-slate-200/60 mt-2">
              <span class="font-bold">Địa chỉ:</span> {{ selectedOrder.shippingAddress }}
            </p>
            <p v-if="selectedOrder.note" class="text-amber-800 text-[11px] bg-amber-50 p-2 rounded-lg mt-2 border border-amber-200/60">
              <span class="font-bold">Ghi chú:</span> {{ selectedOrder.note }}
            </p>
          </div>

          <!-- Order Items list -->
          <div class="space-y-3">
            <h4 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Danh sách sản phẩm ({{ selectedOrder.items?.length || 0 }})</h4>
            <div class="max-h-48 overflow-y-auto space-y-2 pr-1">
              <div
                v-for="(item, idx) in selectedOrder.items"
                :key="idx"
                class="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0"
              >
                <div class="min-w-0 pr-2">
                  <p class="font-bold text-slate-800 truncate">{{ item.name }}</p>
                  <p class="text-[10px] text-slate-400">{{ formatCurrency(item.price) }} × {{ item.quantity }}</p>
                </div>
                <span class="font-bold text-slate-900 whitespace-nowrap">{{ formatCurrency(item.price * item.quantity) }}</span>
              </div>
            </div>

            <!-- Price Breakdown -->
            <div class="border-t border-slate-100 pt-3 space-y-1 text-xs">
              <div class="flex justify-between text-slate-500">
                <span>Tạm tính</span>
                <span class="font-bold text-slate-800">{{ formatCurrency(selectedOrder.subtotal || selectedOrder.total) }}</span>
              </div>
              <div v-if="selectedOrder.shippingFee" class="flex justify-between text-slate-500">
                <span>Phí vận chuyển</span>
                <span class="font-bold text-slate-800">{{ formatCurrency(selectedOrder.shippingFee) }}</span>
              </div>
              <div v-if="selectedOrder.discount" class="flex justify-between text-red-600">
                <span>Giảm giá Voucher</span>
                <span class="font-bold">-{{ formatCurrency(selectedOrder.discount) }}</span>
              </div>
              <div v-if="selectedOrder.loyaltyDiscount" class="flex justify-between text-amber-600">
                <span>Điểm thưởng ({{ selectedOrder.loyaltyPointsUsed }} điểm)</span>
                <span class="font-bold">-{{ formatCurrency(selectedOrder.loyaltyDiscount) }}</span>
              </div>
              <div class="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                <span>Tổng tiền</span>
                <span class="text-[#dc2626] font-black">{{ formatCurrency(selectedOrder.total) }}</span>
              </div>
            </div>
          </div>

          <!-- Status Update Action -->
          <div class="border-t border-slate-100 pt-4 space-y-3">
            <label class="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Cập nhật trạng thái</label>
            <div class="flex gap-2">
              <select
                v-model="newStatus"
                class="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
              >
                <option value="PENDING">Chờ xác nhận</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="PROCESSING">Đang đóng gói</option>
                <option value="SHIPPING">Đang giao hàng</option>
                <option value="DELIVERED">Đã giao thành công</option>
                <option value="COMPLETED">Hoàn thành đơn</option>
                <option value="RETURNED">Hoàn trả đơn</option>
                <option value="CANCELLED">Hủy đơn hàng</option>
              </select>
              <button
                type="button"
                @click="updateStatus"
                :disabled="updatingStatus || newStatus === selectedOrder.orderStatus"
                class="bg-[#dc2626] hover:bg-red-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {{ updatingStatus ? '...' : 'Lưu' }}
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
import FilterBar, { type FilterTab } from '@/components/FilterBar.vue'
import DataTable, { type TableColumn } from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const toast = useToast()

const orders = ref<Order[]>([])
const loading = ref(true)

const selectedOrder = ref<Order | null>(null)
const newStatus = ref('')
const updatingStatus = ref(false)
const orderQuery = ref('')

const currentTab = ref('ALL')

const tabs: FilterTab[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xác nhận' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'PROCESSING', label: 'Đang đóng gói' },
  { value: 'SHIPPING', label: 'Đang giao' },
  { value: 'DELIVERED', label: 'Đã giao' },
  { value: 'RETURNED', label: 'Hoàn trả' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

const columns: TableColumn[] = [
  { key: 'orderCode', label: 'MÃ ĐƠN' },
  { key: 'customer', label: 'KHÁCH HÀNG' },
  { key: 'createdAt', label: 'NGÀY ĐẶT' },
  { key: 'payment', label: 'THANH TOÁN' },
  { key: 'total', label: 'TỔNG TIỀN' },
  { key: 'orderStatus', label: 'TRẠNG THÁI' },
  { key: 'actions', label: 'HÀNH ĐỘNG', align: 'right' },
]

onMounted(fetchOrders)

async function fetchOrders() {
  loading.value = true
  try {
    const res: any = await orderService.getAll()
    orders.value = Array.isArray(res.data) ? res.data : (res.data?.data || [])
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
  let list = orders.value
  if (currentTab.value !== 'ALL') {
    list = list.filter(o => o.orderStatus === currentTab.value)
  }
  if (!orderQuery.value) return list
  const q = orderQuery.value.toLowerCase().trim()
  return list.filter(o => {
    const code = (o.orderCode || '').toLowerCase()
    const name = (o.customerName || '').toLowerCase()
    const phone = (o.phone || '').toLowerCase()
    return code.includes(q) || name.includes(q) || phone.includes(q)
  })
})

function onTabChange(tabVal: string) {
  currentTab.value = tabVal
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
    selectedOrder.value.orderStatus = newStatus.value as any
    fetchOrders()
  } catch (err: any) {
    toast.error(err.message || 'Cập nhật trạng thái thất bại')
  } finally {
    updatingStatus.value = false
  }
}
</script>
