<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
      <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Quản lý kho hàng</h2>
      <p class="text-[11px] text-slate-400 font-semibold">Kiểm soát mức kho tối thiểu/tối đa, điều chỉnh hoặc nhập thêm hàng hóa nhanh chóng.</p>
    </div>

    <!-- Tabs Switcher -->
    <div class="flex border-b border-slate-200 gap-6">
      <button
        @click="activeTab = 'stock'"
        :class="['pb-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer', activeTab === 'stock' ? 'border-[#dc2626] text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600']"
      >
        Kho hiện tại
      </button>
      <button
        @click="activeTab = 'history'"
        :class="['pb-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer', activeTab === 'history' ? 'border-[#dc2626] text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600']"
      >
        Lịch sử nhập/xuất kho
      </button>
    </div>

    <!-- Tab 1: Current Stock & Adjust Panel -->
    <div v-if="activeTab === 'stock'" class="space-y-6">
      <!-- Low Stock Warning Alert Box -->
      <div v-if="lowStockItems.length > 0" class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-2">
        <div class="flex items-center gap-2 text-amber-800">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 flex-shrink-0 text-amber-600">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <span class="text-[10px] font-extrabold uppercase tracking-wider">Cảnh báo kho thấp</span>
        </div>
        <div class="flex flex-wrap gap-2 pt-1">
          <div
            v-for="stk in lowStockItems"
            :key="stk._id"
            class="bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-700 flex items-center gap-1.5"
          >
            <span>{{ getProductName(stk) }}</span>
            <span class="text-red-600">(Còn {{ stk.currentStock }} / Tối thiểu {{ stk.minStock }} {{ getProductUnit(stk) }})</span>
          </div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <!-- Stock List DataTable -->
        <div class="xl:col-span-2">
          <DataTable
            :columns="stockColumns"
            :items="paginatedStocks"
            :loading="loading"
            clickable
            :selected-row-key="selectedStock?._id"
            pagination
            :current-page="currentPage"
            :total-items="filteredStocks.length"
            :page-size="15"
            empty-text="Chưa có thông tin kho cho sản phẩm nào."
            empty-subtext="Không tìm thấy sản phẩm phù hợp với từ khóa tìm kiếm."
            @row-click="selectStock"
            @page-change="page => currentPage = page"
          >
            <!-- Header with Search box -->
            <template #header>
              <div class="relative flex-grow">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" /></svg>
                </span>
                <input
                  v-model="stockQuery"
                  type="text"
                  placeholder="Tìm kiếm theo tên sản phẩm hoặc SKU..."
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:bg-white text-slate-700 font-semibold transition-all placeholder:text-slate-400"
                />
              </div>
            </template>

            <!-- Product Cell with Avatar / Placeholder -->
            <template #cell(product)="{ row }">
              <div class="flex items-center gap-3">
                <img v-if="getProductImage(row)" :src="getProductImage(row)" class="w-8 h-8 rounded-full object-cover bg-slate-50 flex-shrink-0" />
                <div v-else :class="['w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-[12px] flex-shrink-0 shadow-xs', getProductPlaceholder(getProductName(row)).gradient]">
                  <span class="text-[10px] uppercase font-bold">{{ getProductName(row).slice(0, 2) }}</span>
                </div>
                <div class="min-w-0">
                  <p class="font-bold text-slate-900 truncate leading-tight">{{ getProductName(row) }}</p>
                  <p class="text-[10px] text-slate-400 mt-0.5">Đơn vị: {{ getProductUnit(row) }}</p>
                </div>
              </div>
            </template>

            <!-- SKU Cell -->
            <template #cell(sku)="{ row }">
              <span class="font-mono text-[10px] font-bold text-slate-500">{{ getProductSku(row) || '-' }}</span>
            </template>

            <!-- Current Stock Cell -->
            <template #cell(stock)="{ row }">
              <span class="font-bold text-slate-900">{{ row.currentStock }} {{ getProductUnit(row) }}</span>
            </template>

            <!-- Status Cell with StatusBadge -->
            <template #cell(status)="{ row }">
              <StatusBadge
                :status="getInventoryStatusKey(row)"
                type="inventory"
                :label="getInventoryStatusLabel(row.status, row.currentStock, row.minStock)"
              />
            </template>
          </DataTable>
        </div>

        <!-- Adjust Stock Panel (Matches Screenshot) -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Điều chỉnh kho</h3>

          <div v-if="!selectedStock" class="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-wider">
            Chọn một sản phẩm từ danh sách bên trái để thực hiện điều chỉnh kho.
          </div>

          <div v-else class="space-y-6">
            <!-- Selected Product Summary Box -->
            <div class="border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex gap-4 items-center">
              <img v-if="getProductImage(selectedStock)" :src="getProductImage(selectedStock)" class="w-12 h-12 rounded-xl object-cover bg-white border border-slate-200 shadow-xs flex-shrink-0" />
              <div v-else :class="['w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-[14px] flex-shrink-0 shadow-xs', getProductPlaceholder(getProductName(selectedStock)).gradient]">
                <span class="text-xs uppercase font-bold">{{ getProductName(selectedStock).slice(0, 2) }}</span>
              </div>
              <div class="min-w-0">
                <p class="font-extrabold text-slate-900 text-sm leading-snug">{{ getProductName(selectedStock) }}</p>
                <p class="text-slate-400 text-xs font-semibold mt-0.5 font-mono">SKU: {{ getProductSku(selectedStock) || 'Chưa có SKU' }}</p>
              </div>
            </div>

            <!-- 3 Stat Badges Grid -->
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="border border-slate-200/80 rounded-xl p-2.5">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Hiện có</span>
                <span class="text-base font-extrabold text-slate-900 leading-tight block mt-0.5">{{ selectedStock.currentStock }}</span>
                <span class="text-[9px] text-slate-400 font-semibold">{{ getProductUnit(selectedStock) }}</span>
              </div>
              <div class="border border-slate-200/80 rounded-xl p-2.5">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Tối thiểu</span>
                <span class="text-base font-extrabold text-slate-900 leading-tight block mt-0.5">{{ selectedStock.minStock }}</span>
                <span class="text-[9px] text-slate-400 font-semibold">{{ getProductUnit(selectedStock) }}</span>
              </div>
              <div class="border border-slate-200/80 rounded-xl p-2.5">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Tối đa</span>
                <span class="text-base font-extrabold text-slate-900 leading-tight block mt-0.5">{{ selectedStock.maxStock }}</span>
                <span class="text-[9px] text-slate-400 font-semibold">{{ getProductUnit(selectedStock) }}</span>
              </div>
            </div>

            <!-- Form Inputs -->
            <div class="space-y-4 pt-2 border-t border-slate-100">
              <!-- Adjust Type -->
              <div>
                <label class="text-xs font-bold text-slate-700 block mb-1">Loại thao tác</label>
                <select
                  v-model="adjustType"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
                >
                  <option value="import">Nhập kho (+)</option>
                  <option value="sale">Bán hàng (-)</option>
                  <option value="return">Khách trả hàng (+)</option>
                  <option value="damage">Hư hỏng / Hao hụt (-)</option>
                  <option value="adjustment">Điều chỉnh số lượng trực tiếp</option>
                </select>
              </div>

              <!-- Quantity Input -->
              <div>
                <label class="text-xs font-bold text-slate-700 block mb-1">
                  {{ adjustType === 'adjustment' ? 'Số lượng kho mới' : 'Số lượng thay đổi' }}
                </label>
                <input
                  v-model.number="adjustQty"
                  type="number"
                  min="1"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
                />
              </div>

              <!-- Note Input -->
              <div>
                <label class="text-xs font-bold text-slate-700 block mb-1">Ghi chú thao tác</label>
                <textarea
                  v-model="adjustNote"
                  rows="3"
                  placeholder="Nhập lý do nhập/xuất hoặc số chứng từ liên quan..."
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
                ></textarea>
              </div>

              <button
                type="button"
                @click="submitAdjustment"
                :disabled="submittingAdjust || adjustQty <= 0"
                class="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {{ submittingAdjust ? 'Đang cập nhật...' : 'Xác nhận điều chỉnh' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Transaction History -->
    <div v-else class="space-y-6">
      <FilterBar
        v-model="historyQuery"
        placeholder="Tìm kiếm lịch sử theo sản phẩm, SKU, người thực hiện hoặc ghi chú..."
      />

      <DataTable
        :columns="historyColumns"
        :items="filteredTransactions"
        :loading="loadingTransactions"
        empty-text="Chưa có lịch sử giao dịch kho nào."
        empty-subtext="Không tìm thấy lịch sử phù hợp với từ khóa tìm kiếm."
      >
        <template #cell(createdAt)="{ row }">
          <span class="text-slate-500 font-semibold">{{ formatDateTime(row.createdAt) }}</span>
        </template>

        <template #cell(product)="{ row }">
          <span class="font-extrabold text-slate-800 truncate max-w-[220px] block">
            {{ row.product?.name || 'Sản phẩm đã bị xóa' }}
          </span>
        </template>

        <template #cell(sku)="{ row }">
          <span class="font-mono text-[10px] font-bold text-slate-500">{{ row.product?.sku || '-' }}</span>
        </template>

        <template #cell(type)="{ row }">
          <span :class="['px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide border', getTransactionTypeStyle(row.type)]">
            {{ getTransactionTypeLabel(row.type) }}
          </span>
        </template>

        <template #cell(quantity)="{ row }">
          <span :class="row.change >= 0 ? 'text-emerald-600' : 'text-red-600'" class="font-extrabold">
            {{ row.change >= 0 ? '+' : '' }}{{ row.change }} {{ row.product?.unit || 'cái' }}
            <small class="block text-slate-400">{{ row.stockBefore }} → {{ row.stockAfter }}</small>
          </span>
        </template>

        <template #cell(createdBy)="{ row }">
          <span class="text-slate-600 font-bold">{{ row.createdBy?.fullName || 'Hệ thống' }}</span>
        </template>

        <template #cell(note)="{ row }">
          <span class="text-slate-500 italic max-w-[150px] truncate block" :title="row.note">{{ row.note || '-' }}</span>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { inventoryService } from '@/services/inventory.service'
import type { Inventory } from '@/types'
import FilterBar from '@/components/FilterBar.vue'
import DataTable, { type TableColumn } from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const toast = useToast()

const stocks = ref<Inventory[]>([])
const loading = ref(true)

const selectedStock = ref<Inventory | null>(null)
const adjustType = ref<'import' | 'sale' | 'return' | 'adjustment' | 'damage'>('import')
const adjustQty = ref(1)
const adjustNote = ref('')
const submittingAdjust = ref(false)

const activeTab = ref<'stock' | 'history'>('stock')
const transactions = ref<any[]>([])
const loadingTransactions = ref(false)

const stockColumns: TableColumn[] = [
  { key: 'product', label: 'Sản phẩm' },
  { key: 'sku', label: 'SKU' },
  { key: 'stock', label: 'Kho' },
  { key: 'status', label: 'Trạng thái' },
]

const historyColumns: TableColumn[] = [
  { key: 'createdAt', label: 'Thời gian' },
  { key: 'product', label: 'Sản phẩm' },
  { key: 'sku', label: 'Mã SKU' },
  { key: 'type', label: 'Loại giao dịch' },
  { key: 'quantity', label: 'Số lượng' },
  { key: 'createdBy', label: 'Người thực hiện' },
  { key: 'note', label: 'Ghi chú' },
]

onMounted(() => {
  fetchStocks()
  fetchTransactions()
})

async function fetchStocks() {
  loading.value = true
  try {
    const res = await inventoryService.getAll()
    stocks.value = res.data
    if (stocks.value.length > 0 && !selectedStock.value) {
      selectStock(stocks.value[0])
    }
  } catch (err) {
    toast.error('Lỗi khi tải dữ liệu kho')
  } finally {
    loading.value = false
  }
}

async function fetchTransactions() {
  loadingTransactions.value = true
  try {
    const res = await inventoryService.getTransactions()
    transactions.value = res.data
  } catch (err) {
    toast.error('Lỗi khi tải lịch sử kho')
  } finally {
    loadingTransactions.value = false
  }
}

const stockQuery = ref('')
const historyQuery = ref('')

const filteredStocks = computed(() => {
  if (!stockQuery.value) return stocks.value
  const q = stockQuery.value.toLowerCase().trim()
  return stocks.value.filter(stk => {
    const name = getProductName(stk).toLowerCase()
    const sku = getProductSku(stk).toLowerCase()
    return name.includes(q) || sku.includes(q)
  })
})

const currentPage = ref(1)

const paginatedStocks = computed(() => {
  const start = (currentPage.value - 1) * 15
  const end = start + 15
  return filteredStocks.value.slice(start, end)
})

watch(stockQuery, () => {
  currentPage.value = 1
})

const filteredTransactions = computed(() => {
  if (!historyQuery.value) return transactions.value
  const q = historyQuery.value.toLowerCase().trim()
  return transactions.value.filter(tx => {
    const prodName = (tx.product?.name || '').toLowerCase()
    const prodSku = (tx.product?.sku || '').toLowerCase()
    const note = (tx.note || '').toLowerCase()
    const creator = (tx.createdBy?.fullName || '').toLowerCase()
    return prodName.includes(q) || prodSku.includes(q) || note.includes(q) || creator.includes(q)
  })
})

const lowStockItems = computed(() => {
  return stocks.value.filter(stk => stk.status === 'LOW_STOCK' || stk.currentStock <= stk.minStock)
})

function selectStock(stk: Inventory) {
  selectedStock.value = stk
  adjustQty.value = 1
  adjustNote.value = ''
}

function getProductName(stk: Inventory) {
  return (stk.product && typeof stk.product === 'object') ? stk.product.name : 'Sản phẩm không rõ'
}

function getProductSku(stk: Inventory) {
  return (stk.product && typeof stk.product === 'object') ? stk.product.sku : ''
}

function getProductImage(stk: Inventory) {
  return (stk.product && typeof stk.product === 'object') ? stk.product.images?.[0] : ''
}

function getProductUnit(stk: Inventory | null) {
  if (!stk) return 'cái'
  return (stk.product && typeof stk.product === 'object') ? stk.product.unit || 'cái' : 'cái'
}

async function submitAdjustment() {
  if (!selectedStock.value || adjustQty.value === 0 || (adjustType.value !== 'adjustment' && adjustQty.value < 0)) return
  
  submittingAdjust.value = true
  try {
    const prodId = typeof selectedStock.value.product === 'object' ? selectedStock.value.product._id : selectedStock.value.product
    const payload = {
      product: prodId,
      quantity: adjustQty.value,
      note: adjustNote.value,
    }

    if (adjustType.value === 'import') {
      await inventoryService.importStock(payload)
      toast.success('Nhập kho thành công!')
    } else if (adjustType.value === 'sale') {
      await inventoryService.saleStock(payload)
      toast.success('Ghi nhận bán hàng thành công!')
    } else if (adjustType.value === 'return') {
      await inventoryService.returnStock(payload)
      toast.success('Hoàn kho thành công!')
    } else if (adjustType.value === 'damage') {
      await inventoryService.damageStock(payload)
      toast.success('Ghi nhận hư hỏng thành công!')
    } else {
      await inventoryService.adjustStock(payload)
      toast.success('Điều chỉnh số lượng kho thành công!')
    }

    const oldId = selectedStock.value?._id
    await fetchStocks()
    if (oldId) {
      const updated = stocks.value.find(s => s._id === oldId)
      if (updated) {
        selectStock(updated)
      }
    }

    await fetchTransactions()
  } catch (err: any) {
    toast.error(err.message || 'Gặp lỗi trong quá trình điều chỉnh kho')
  } finally {
    submittingAdjust.value = false
  }
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function getTransactionTypeLabel(type: string) {
  if (type === 'IMPORT') return 'Nhập kho'
  if (type === 'SALE') return 'Bán hàng'
  if (type === 'RETURN') return 'Hoàn kho'
  if (type === 'DAMAGE') return 'Hư hỏng'
  return 'Điều chỉnh'
}

function getTransactionTypeStyle(type: string) {
  if (type === 'IMPORT') return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  if (type === 'SALE') return 'bg-red-50 text-red-800 border-red-200'
  if (type === 'RETURN') return 'bg-teal-50 text-teal-800 border-teal-200'
  if (type === 'DAMAGE') return 'bg-rose-50 text-rose-800 border-rose-200'
  return 'bg-blue-50 text-blue-800 border-blue-200'
}

function getInventoryStatusKey(stk: Inventory) {
  if (stk.status === 'LOW_STOCK' || stk.currentStock <= stk.minStock) {
    return 'LOW_STOCK'
  }
  if (stk.currentStock === 0) {
    return 'OUT_OF_STOCK'
  }
  return 'IN_STOCK'
}

function getInventoryStatusLabel(status: string, current: number, min: number) {
  if (status === 'LOW_STOCK' || current <= min) {
    return 'Kho thấp'
  }
  if (current === 0) {
    return 'Hết hàng'
  }
  return 'Đủ hàng'
}

function getProductPlaceholder(prodName?: string) {
  const name = (prodName || '').toLowerCase()
  if (name.includes('bút') || name.includes('viết') || name.includes('chì')) {
    return { gradient: 'bg-gradient-to-br from-red-400 to-rose-500', icon: 'pencil' }
  }
  if (name.includes('giấy') || name.includes('sổ') || name.includes('vở') || name.includes('tập') || name.includes('note')) {
    return { gradient: 'bg-gradient-to-br from-emerald-400 to-teal-500', icon: 'document' }
  }
  if (name.includes('máy tính') || name.includes('casio')) {
    return { gradient: 'bg-gradient-to-br from-indigo-400 to-purple-500', icon: 'calculator' }
  }
  return { gradient: 'bg-gradient-to-br from-pink-400 to-rose-500', icon: 'tag' }
}
</script>
