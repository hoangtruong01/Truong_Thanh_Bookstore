<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <span>🏢</span>
          <span>Quản Lý Nhiều Kho & Chuyển Kho</span>
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Hệ thống đa kho phân tán: Kho tổng, Cửa hàng, Kho Online và Kho cách ly hàng lỗi (INV-02)
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          v-if="activeTab === 'warehouses'"
          class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
          @click="openCreateWarehouseModal"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Thêm Kho Mới
        </button>

        <button
          v-if="activeTab === 'transfers'"
          class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
          @click="openCreateTransferModal"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Lập Phiếu Chuyển Kho
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="border-b border-slate-200 dark:border-slate-800">
      <nav class="flex space-x-6">
        <button
          :class="activeTab === 'warehouses' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'"
          class="py-3 px-1 border-b-2 text-xs transition-colors flex items-center gap-2 cursor-pointer"
          @click="activeTab = 'warehouses'"
        >
          <span>📦</span>
          <span>Danh Sách Kho Hàng</span>
          <span class="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
            {{ warehouses.length }}
          </span>
        </button>

        <button
          :class="activeTab === 'transfers' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'"
          class="py-3 px-1 border-b-2 text-xs transition-colors flex items-center gap-2 cursor-pointer"
          @click="activeTab = 'transfers'"
        >
          <span>🔄</span>
          <span>Phiếu Chuyển Kho (Stock Transfers)</span>
          <span class="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
            {{ transfers.length }}
          </span>
        </button>

        <button
          :class="activeTab === 'quarantine' ? 'border-rose-600 text-rose-600 dark:text-rose-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'"
          class="py-3 px-1 border-b-2 text-xs transition-colors flex items-center gap-2 cursor-pointer"
          @click="activeTab = 'quarantine'"
        >
          <span>🚫</span>
          <span>Kho Cách Ly & Hàng Lỗi</span>
          <span class="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
            {{ quarantineWarehouses.length }}
          </span>
        </button>
      </nav>
    </div>

    <!-- TAB 1: Danh sách kho hàng -->
    <div v-if="activeTab === 'warehouses' || activeTab === 'quarantine'" class="space-y-4">
      <div v-if="loading" class="p-8">
        <SkeletonLoader :count="4" />
      </div>

      <div v-else-if="displayedWarehouses.length === 0">
        <EmptyState
          title="Chưa có kho hàng nào"
          description="Khởi tạo kho tổng hoặc kho chi nhánh để bắt đầu quản lý tồn kho đa điểm."
        />
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="wh in displayedWarehouses"
          :key="wh._id"
          class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
        >
          <div>
            <div class="flex items-start justify-between gap-3">
              <div>
                <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md font-mono" :class="getWarehouseBadgeClass(wh.type)">
                  {{ formatWarehouseType(wh.type) }}
                </span>
                <h3 class="text-base font-bold text-slate-900 dark:text-white mt-2">
                  {{ wh.name }}
                </h3>
                <span class="text-xs font-mono text-slate-400 font-bold">{{ wh.code }}</span>
              </div>
              <span
                class="w-3 h-3 rounded-full flex-shrink-0"
                :class="wh.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'"
                :title="wh.isActive ? 'Đang hoạt động' : 'Tạm khóa'"
              ></span>
            </div>

            <p class="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">
              📍 {{ wh.address || 'Chưa cập nhật địa chỉ kho' }}
            </p>

            <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-center">
              <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5">
                <span class="text-[10px] text-slate-400 font-bold uppercase block">Bán Được</span>
                <span class="text-xs font-black" :class="(wh.type !== 'QUARANTINE' && wh.type !== 'DAMAGED') ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
                  {{ (wh.type !== 'QUARANTINE' && wh.type !== 'DAMAGED') ? '✓ Khả dụng' : '✗ Cách ly' }}
                </span>
              </div>
              <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5">
                <span class="text-[10px] text-slate-400 font-bold uppercase block">Trạng Thái</span>
                <span class="text-xs font-black text-slate-700 dark:text-slate-300">
                  {{ wh.isActive ? 'Hoạt động' : 'Đã đóng' }}
                </span>
              </div>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2">
            <button
              class="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
              @click="viewWarehouseStock(wh)"
            >
              Xem Tồn Kho
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: Phiếu Chuyển Kho (Stock Transfers) -->
    <div v-if="activeTab === 'transfers'" class="space-y-4">
      <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                <th class="py-3 px-4">Mã Phiếu</th>
                <th class="py-3 px-4">Kho Xuất</th>
                <th class="py-3 px-4">Kho Nhập</th>
                <th class="py-3 px-4 text-center">Số Mặt Hàng</th>
                <th class="py-3 px-4">Trạng Thái</th>
                <th class="py-3 px-4">Ngày Tạo</th>
                <th class="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-if="transfersLoading">
                <td colspan="7" class="p-6 text-center text-slate-400">Đang tải danh sách phiếu chuyển...</td>
              </tr>
              <tr v-else-if="transfers.length === 0">
                <td colspan="7" class="p-8 text-center text-slate-400">Chưa có phiếu chuyển kho nào.</td>
              </tr>
              <tr
                v-for="tf in transfers"
                v-else
                :key="tf._id"
                class="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td class="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {{ tf.code || tf.transferCode }}
                </td>
                <td class="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                  {{ tf.fromWarehouse?.name || tf.sourceWarehouse?.name || 'Kho nguồn' }}
                </td>
                <td class="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                  {{ tf.toWarehouse?.name || tf.destinationWarehouse?.name || 'Kho đích' }}
                </td>
                <td class="py-3 px-4 text-center font-bold">
                  {{ tf.items?.length || 0 }} SKU
                </td>
                <td class="py-3 px-4">
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase" :class="getTransferStatusClass(tf.status)">
                    {{ formatTransferStatus(tf.status) }}
                  </span>
                </td>
                <td class="py-3 px-4 text-slate-400 font-mono text-[11px]">
                  {{ formatDate(tf.createdAt) }}
                </td>
                <td class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <!-- Actions depending on state machine -->
                    <button
                      v-if="tf.status === 'DRAFT'"
                      class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold rounded-md text-[11px] transition-colors cursor-pointer"
                      @click="approveTransfer(tf)"
                    >
                      Duyệt
                    </button>
                    <button
                      v-if="tf.status === 'APPROVED'"
                      class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold rounded-md text-[11px] transition-colors cursor-pointer"
                      @click="shipTransfer(tf)"
                    >
                      Xuất Kho
                    </button>
                    <button
                      v-if="tf.status === 'IN_TRANSIT'"
                      class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded-md text-[11px] transition-colors cursor-pointer"
                      @click="receiveTransfer(tf)"
                    >
                      Nhận Hàng
                    </button>
                    <button
                      v-if="tf.status === 'DRAFT' || tf.status === 'APPROVED'"
                      class="px-2.5 py-1 text-rose-600 hover:text-rose-800 font-medium text-[11px] hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                      @click="cancelTransfer(tf)"
                    >
                      Hủy
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL 1: Thêm Kho Mới -->
    <FormModal
      v-model="showCreateWarehouseModal"
      title="Thêm Kho Hàng Mới"
      @submit="submitCreateWarehouse"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mã Kho (Code)</label>
          <input
            v-model="warehouseForm.code"
            type="text"
            required
            placeholder="VD: WH-MAIN, WH-STORE-01, WH-QUARANTINE"
            class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono font-bold"
          />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tên Kho Hàng</label>
          <input
            v-model="warehouseForm.name"
            type="text"
            required
            placeholder="VD: Kho Tổng Nhà Sách, Kho Chi Nhánh 1, Kho Hàng Lỗi..."
            class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phân Loại Kho</label>
          <select
            v-model="warehouseForm.type"
            class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            @change="handleWarehouseTypeChange"
          >
            <option value="MAIN">Kho Tổng (Main Central Warehouse)</option>
            <option value="STORE">Kho Cửa Hàng / Điểm Bán (Store)</option>
            <option value="ONLINE">Kho Bán Trực Tuyến (E-commerce)</option>
            <option value="QUARANTINE">Kho Cách Ly / Chờ Kiểm Tra (Quarantine)</option>
            <option value="DAMAGED">Kho Hàng Hỏng / Đổi Trả Lỗi (Damaged)</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Địa Chỉ Kho</label>
          <textarea
            v-model="warehouseForm.address"
            rows="2"
            placeholder="Số nhà, đường, phường xã, quận huyện..."
            class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          ></textarea>
        </div>
      </div>
    </FormModal>

    <!-- MODAL 2: Lập Phiếu Chuyển Kho (WH-P1-03 Canonical Contract) -->
    <FormModal
      v-model="showCreateTransferModal"
      title="Lập Phiếu Chuyển Kho Hàng"
      @submit="submitCreateTransfer"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kho Xuất (Nguồn) <span class="text-rose-500">*</span></label>
            <select
              v-model="transferForm.fromWarehouse"
              required
              class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="" disabled>-- Chọn kho xuất --</option>
              <option v-for="w in warehouses" :key="w._id" :value="w._id">
                {{ w.name }} ({{ w.code }})
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kho Nhập (Đích) <span class="text-rose-500">*</span></label>
            <select
              v-model="transferForm.toWarehouse"
              required
              class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="" disabled>-- Chọn kho nhập --</option>
              <option v-for="w in warehouses" :key="w._id" :value="w._id">
                {{ w.name }} ({{ w.code }})
              </option>
            </select>
          </div>
        </div>

        <!-- Product selection item -->
        <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <span class="text-xs font-bold text-slate-700 dark:text-slate-300 block">Sản Phẩm Điều Chuyển <span class="text-rose-500">*</span></span>
          <div class="grid grid-cols-3 gap-2">
            <div class="col-span-2">
              <label class="block text-[11px] font-medium text-slate-500 mb-1">Mã ID Sản Phẩm (MongoDB ID)</label>
              <input
                v-model="transferForm.productId"
                type="text"
                required
                placeholder="VD: 60c72b2f9b1d8b001c8e4d21"
                class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label class="block text-[11px] font-medium text-slate-500 mb-1">Số Lượng</label>
              <input
                v-model.number="transferForm.requestedQty"
                type="number"
                min="1"
                required
                class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>
          </div>
          <div>
            <label class="block text-[11px] font-medium text-slate-500 mb-1">Ghi Chú Mặt Hàng</label>
            <input
              v-model="transferForm.itemNote"
              type="text"
              placeholder="VD: Chuyển bổ sung theo nhu cầu chi nhánh..."
              class="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ghi Chú Chung Phiếu Chuyển</label>
          <input
            v-model="transferForm.note"
            type="text"
            placeholder="Lý do điều chuyển, mã lệnh điều vận..."
            class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
      </div>
    </FormModal>

    <!-- MODAL 3: Xem Tồn Kho Chi Tiết -->
    <div
      v-if="showStockModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
    >
      <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 class="text-sm font-black text-slate-900 dark:text-white">
            Tồn Kho Chi Tiết: {{ selectedWarehouse?.name }} ({{ selectedWarehouse?.code }})
          </h3>
          <button
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
            @click="showStockModal = false"
          >
            ✕
          </button>
        </div>

        <div v-if="stockLoading" class="p-4 text-center text-xs text-slate-400">
          Đang tải dữ liệu tồn kho...
        </div>
        <div v-else-if="warehouseStockList.length === 0" class="p-8 text-center text-xs text-slate-400">
          Kho hàng hiện chưa có sản phẩm nào được lưu trữ.
        </div>
        <div v-else class="max-h-80 overflow-y-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-500">
              <tr>
                <th class="py-2 px-3">Sản phẩm</th>
                <th class="py-2 px-3">SKU</th>
                <th class="py-2 px-3 text-right">Tồn Hiện Tại</th>
                <th class="py-2 px-3 text-right">Khả Dụng</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="item in warehouseStockList" :key="item._id">
                <td class="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{{ item.product?.title || 'Sách' }}</td>
                <td class="py-2.5 px-3 font-mono text-slate-400">{{ item.product?.sku || '-' }}</td>
                <td class="py-2.5 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400">{{ item.quantity }}</td>
                <td class="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{{ item.availableQuantity ?? item.quantity }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end pt-2">
          <button
            class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            @click="showStockModal = false"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import warehouseService, { type Warehouse, type StockTransfer } from '@/services/warehouse.service'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import EmptyState from '@/components/EmptyState.vue'
import FormModal from '@/components/FormModal.vue'
import { useToast } from 'vue-toastification'

const toast = useToast()

const activeTab = ref<'warehouses' | 'transfers' | 'quarantine'>('warehouses')
const loading = ref(false)
const transfersLoading = ref(false)

const warehouses = ref<Warehouse[]>([])
const transfers = ref<StockTransfer[]>([])

const quarantineWarehouses = computed(() => {
  return warehouses.value.filter(w => w.type === 'QUARANTINE' || w.type === 'DAMAGED')
})

const displayedWarehouses = computed(() => {
  if (activeTab.value === 'quarantine') {
    return quarantineWarehouses.value
  }
  return warehouses.value
})

// Modal states
const showCreateWarehouseModal = ref(false)
const showCreateTransferModal = ref(false)
const showStockModal = ref(false)

const selectedWarehouse = ref<Warehouse | null>(null)
const warehouseStockList = ref<any[]>([])
const stockLoading = ref(false)

const warehouseForm = ref({
  code: '',
  name: '',
  type: 'MAIN' as Warehouse['type'],
  address: '',
})

const transferForm = ref({
  fromWarehouse: '',
  toWarehouse: '',
  note: '',
  productId: '',
  requestedQty: 1,
  itemNote: '',
})

function handleWarehouseTypeChange() {
  // Warehouse type determines sellable status automatically on backend
}

async function fetchWarehouses() {
  loading.value = true
  try {
    const res = await warehouseService.getAll({ limit: 100 })
    warehouses.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (err: any) {
    toast.error('Không thể tải danh sách kho: ' + (err.response?.data?.message || err.message))
  } finally {
    loading.value = false
  }
}

async function fetchTransfers() {
  transfersLoading.value = true
  try {
    const res = await warehouseService.getTransfers({ limit: 50 })
    transfers.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (err: any) {
    console.error('Failed to load transfers:', err)
  } finally {
    transfersLoading.value = false
  }
}

function openCreateWarehouseModal() {
  warehouseForm.value = {
    code: '',
    name: '',
    type: 'MAIN',
    address: '',
  }
  showCreateWarehouseModal.value = true
}

function openCreateTransferModal() {
  transferForm.value = {
    fromWarehouse: '',
    toWarehouse: '',
    note: '',
    productId: '',
    requestedQty: 1,
    itemNote: '',
  }
  showCreateTransferModal.value = true
}

async function submitCreateWarehouse() {
  try {
    await warehouseService.create({
      code: warehouseForm.value.code.trim().toUpperCase(),
      name: warehouseForm.value.name.trim(),
      type: warehouseForm.value.type,
      address: warehouseForm.value.address.trim(),
    })
    toast.success('Khởi tạo kho hàng mới thành công!')
    showCreateWarehouseModal.value = false
    await fetchWarehouses()
  } catch (err: any) {
    toast.error('Lỗi tạo kho: ' + (err.response?.data?.message || err.message))
  }
}

async function submitCreateTransfer() {
  if (transferForm.value.fromWarehouse === transferForm.value.toWarehouse) {
    toast.error('Kho xuất và kho nhập không được trùng nhau!')
    return
  }
  if (!transferForm.value.fromWarehouse || !transferForm.value.toWarehouse) {
    toast.error('Vui lòng chọn cả kho xuất và kho nhập!')
    return
  }
  if (!transferForm.value.productId.trim()) {
    toast.error('Vui lòng nhập ID sản phẩm cần chuyển!')
    return
  }
  if (Number(transferForm.value.requestedQty) <= 0) {
    toast.error('Số lượng chuyển kho phải lớn hơn 0!')
    return
  }

  try {
    await warehouseService.createTransfer({
      fromWarehouse: transferForm.value.fromWarehouse,
      toWarehouse: transferForm.value.toWarehouse,
      note: transferForm.value.note || undefined,
      items: [
        {
          product: transferForm.value.productId.trim(),
          requestedQty: Number(transferForm.value.requestedQty),
          note: transferForm.value.itemNote || undefined,
        },
      ],
    })
    toast.success('Lập phiếu chuyển kho thành công!')
    showCreateTransferModal.value = false
    await fetchTransfers()
  } catch (err: any) {
    toast.error('Lỗi tạo phiếu chuyển: ' + (err.response?.data?.message || err.message))
  }
}

async function viewWarehouseStock(wh: Warehouse) {
  selectedWarehouse.value = wh
  showStockModal.value = true
  stockLoading.value = true
  try {
    const res = await warehouseService.getStock(wh._id)
    warehouseStockList.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (_err: any) {
    toast.error('Không thể tải tồn kho chi tiết')
  } finally {
    stockLoading.value = false
  }
}

async function approveTransfer(tf: StockTransfer) {
  const code = tf.code || tf.transferCode || tf._id
  try {
    await warehouseService.approveTransfer(tf._id)
    toast.success(`Đã duyệt phiếu chuyển ${code}`)
    await fetchTransfers()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Lỗi duyệt phiếu')
  }
}

async function shipTransfer(tf: StockTransfer) {
  const code = tf.code || tf.transferCode || tf._id
  try {
    await warehouseService.shipTransfer(tf._id)
    toast.success(`Đã xuất kho cho phiếu ${code}`)
    await fetchTransfers()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Lỗi xuất kho')
  }
}

async function receiveTransfer(tf: StockTransfer) {
  const code = tf.code || tf.transferCode || tf._id
  if (!confirm(`Xác nhận nhập kho thực tế cho phiếu ${code}?`)) return
  try {
    const receivePayload = {
      items: (tf.items || []).map((it: any) => ({
        product:
          typeof it.product === 'object' && it.product?._id
            ? it.product._id
            : String(it.product),
        receivedQty: Number(it.requestedQty || it.quantity || 1),
        note: it.note,
      })),
      note: 'Xác nhận nhập kho hàng đủ theo phiếu',
    }
    await warehouseService.receiveTransfer(tf._id, receivePayload)
    toast.success(`Đã xác nhận nhập kho thành công cho phiếu ${code}`)
    await fetchTransfers()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Lỗi nhận hàng')
  }
}

async function cancelTransfer(tf: StockTransfer) {
  const reason = prompt('Nhập lý do hủy phiếu chuyển:')
  if (reason === null) return
  try {
    await warehouseService.cancelTransfer(tf._id, reason)
    toast.info(`Đã hủy phiếu chuyển ${tf.transferCode}`)
    await fetchTransfers()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Lỗi hủy phiếu')
  }
}

function formatWarehouseType(type: string): string {
  const map: Record<string, string> = {
    MAIN: 'Kho Tổng',
    STORE: 'Kho Cửa Hàng',
    ONLINE: 'Kho Online',
    QUARANTINE: 'Kho Cách Ly',
    DAMAGED: 'Kho Hàng Lỗi',
  }
  return map[type] || type
}

function getWarehouseBadgeClass(type: string): string {
  switch (type) {
    case 'MAIN': return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
    case 'STORE': return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
    case 'ONLINE': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
    case 'QUARANTINE': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
    case 'DAMAGED': return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function formatTransferStatus(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'Bản Nháp',
    APPROVED: 'Đã Duyệt',
    IN_TRANSIT: 'Đang Vận Chuyển',
    COMPLETED: 'Đã Nhập Kho',
    CANCELLED: 'Đã Hủy',
  }
  return map[status] || status
}

function getTransferStatusClass(status: string): string {
  switch (status) {
    case 'DRAFT': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    case 'APPROVED': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
    case 'IN_TRANSIT': return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
    case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    case 'CANCELLED': return 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  fetchWarehouses()
  fetchTransfers()
})
</script>
