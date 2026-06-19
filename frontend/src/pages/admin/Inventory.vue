<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
      <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Quản lý kho hàng & tồn kho</h2>
      <p class="text-[11px] text-slate-400 font-semibold">Kiểm soát mức tồn kho tối thiểu/tối đa, điều chỉnh hoặc nhập thêm hàng hóa nhanh chóng.</p>
    </div>

    <!-- Low Stock Warning Alert Box (Matches Screenshot) -->
    <div v-if="lowStockItems.length > 0" class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-2">
      <div class="flex items-center gap-2 text-amber-800">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 flex-shrink-0 text-amber-600">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <span class="text-[10px] font-extrabold uppercase tracking-wider">Cảnh báo tồn kho thấp</span>
      </div>
      <div class="flex flex-wrap gap-2 pt-1">
        <div
          v-for="stk in lowStockItems"
          :key="stk._id"
          class="bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-700 flex items-center gap-1.5"
        >
          <span>{{ getProductName(stk) }}</span>
          <span class="text-red-600">(Còn {{ stk.currentStock }} / Tối thiểu {{ stk.minStock }})</span>
        </div>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      <!-- Stock List Table -->
      <div class="xl:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div v-if="loading" class="p-8 animate-pulse space-y-4">
          <div v-for="n in 5" :key="n" class="h-12 bg-slate-100 rounded-xl w-full"></div>
        </div>

        <div v-else-if="stocks.length === 0" class="p-16 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">
          Chưa có thông tin tồn kho cho sản phẩm nào.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th class="py-4 px-6">Sản phẩm</th>
                <th class="py-4 px-6">SKU</th>
                <th class="py-4 px-6">Tồn kho</th>
                <th class="py-4 px-6">Định mức Min/Max</th>
                <th class="py-4 px-6">Trạng thái</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-150 font-medium text-slate-800">
              <tr
                v-for="stk in stocks"
                :key="stk._id"
                @click="selectStock(stk)"
                class="hover:bg-slate-50/50 cursor-pointer transition-colors"
                :class="[selectedStock?._id === stk._id ? 'bg-red-50/40' : '']"
              >
                <!-- Image circular indicator + name -->
                <td class="py-4 px-6 flex items-center gap-3">
                  <img v-if="getProductImage(stk)" :src="getProductImage(stk)" class="w-8 h-8 rounded-full object-cover bg-slate-50 flex-shrink-0" />
                  <div v-else :class="['w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-[12px] flex-shrink-0 shadow-xs', getProductPlaceholder(getProductName(stk)).gradient]">
                    <!-- Render fallback icon matching name -->
                    <svg v-if="getProductPlaceholder(getProductName(stk)).icon === 'pencil'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 text-white/90">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                    </svg>
                    <svg v-else-if="getProductPlaceholder(getProductName(stk)).icon === 'document'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 text-white/90">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <svg v-else-if="getProductPlaceholder(getProductName(stk)).icon === 'calculator'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 text-white/90">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008ZM2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.379-3.379a.75.75 0 0 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06-1.06l-1.25-1.25Z" />
                    </svg>
                    <svg v-else-if="getProductPlaceholder(getProductName(stk)).icon === 'folder'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 text-white/90">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-19.5 0A2.25 2.25 0 0 0 4.5 15h15a2.25 2.25 0 0 0 2.25-2.25m-19.5 0v.225C2.25 14.28 3.52 15 5.04 15h13.92c1.52 0 2.79-.72 2.79-2.025v-.225M3 9V6a3 3 0 0 1 3-3h3.75a3 3 0 0 1 2.25 1.025L13.5 6h6.75A3 3 0 0 1 23 9v2.25m-20.25 0h17.5" />
                    </svg>
                    <span v-else>{{ getProductName(stk).charAt(0).toUpperCase() }}</span>
                  </div>
                  <span class="font-extrabold text-slate-800 truncate max-w-[180px] leading-tight">{{ getProductName(stk) }}</span>
                </td>
                <td class="py-4 px-6 font-mono text-[10px] font-bold text-slate-500">{{ getProductSku(stk) }}</td>
                <!-- Stock counts -->
                <td class="py-4 px-6 font-extrabold" :class="[stk.status === 'LOW_STOCK' || stk.currentStock <= stk.minStock ? 'text-[#dc2626] bg-red-50/50 rounded px-2 py-0.5' : 'text-slate-800']">
                  {{ stk.currentStock }}
                </td>
                <td class="py-4 px-6 text-slate-500 font-bold">{{ stk.minStock }} / {{ stk.maxStock }}</td>
                <td class="py-4 px-6">
                  <span :class="['px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide', getInventoryBadgeStyle(stk.status, stk.currentStock, stk.minStock)]">
                    {{ getInventoryStatusLabel(stk.status, stk.currentStock, stk.minStock) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick stock adjust panel (Matches Screenshot) -->
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Điều chỉnh tồn kho</h3>

        <div v-if="!selectedStock" class="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-wider">
          Chọn một sản phẩm từ danh sách để thực hiện nhập/xuất hoặc điều chỉnh tồn kho.
        </div>

        <div v-else class="space-y-4">
          <div class="space-y-1">
            <h4 class="font-extrabold text-slate-800 text-xs leading-tight">{{ getProductName(selectedStock) }}</h4>
            <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Mã SKU: {{ getProductSku(selectedStock) }} | Hiện tại: <span class="font-extrabold text-slate-800">{{ selectedStock.currentStock }}</span></p>
          </div>

          <!-- Adjust Options Form -->
          <div class="space-y-4 border-t border-slate-150 pt-4">
            <div>
              <label class="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Loại điều chỉnh</label>
              <select
                v-model="adjustType"
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:bg-white text-slate-700 font-semibold"
              >
                <option value="import">Nhập kho (Import)</option>
                <option value="export">Xuất kho (Export)</option>
                <option value="adjust">Cập nhật trực tiếp số lượng</option>
              </select>
            </div>

            <div>
              <label class="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Số lượng điều chỉnh *</label>
              <input
                v-model.number="adjustQty"
                type="number"
                min="1"
                placeholder="Nhập số lượng..."
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:bg-white text-slate-700 font-semibold placeholder:text-slate-400"
              />
            </div>

            <div>
              <label class="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Ghi chú / Lý do điều chỉnh</label>
              <textarea
                v-model="adjustNote"
                rows="3"
                placeholder="Ví dụ: Nhập thêm hàng mới, kiểm kê kho cuối tháng..."
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:bg-white text-slate-700 font-semibold placeholder:text-slate-400"
              ></textarea>
            </div>

            <button
              @click="submitAdjustment"
              :disabled="submittingAdjust"
              class="w-full bg-[#dc2626] hover:bg-red-700 text-white font-extrabold py-2.5 px-6 rounded-xl transition-all flex items-center justify-center text-xs uppercase tracking-wider shadow-xs disabled:bg-slate-300 disabled:shadow-none cursor-pointer"
            >
              {{ submittingAdjust ? 'Đang thực hiện...' : 'Xác nhận thay đổi' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { inventoryService } from '@/services/inventory.service'
import type { Inventory } from '@/types'

const toast = useToast()

const stocks = ref<Inventory[]>([])
const loading = ref(true)

const selectedStock = ref<Inventory | null>(null)
const adjustType = ref<'import' | 'export' | 'adjust'>('import')
const adjustQty = ref(1)
const adjustNote = ref('')
const submittingAdjust = ref(false)

onMounted(fetchStocks)

async function fetchStocks() {
  loading.value = true
  try {
    const res = await inventoryService.getAll()
    stocks.value = res.data
    if (stocks.value.length > 0 && !selectedStock.value) {
      selectStock(stocks.value[0])
    }
  } catch (err) {
    toast.error('Lỗi khi tải dữ liệu tồn kho')
  } finally {
    loading.value = false
  }
}

// Low Stock warning computation matching screenshot
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

// Product Sku helper
function getProductSku(stk: Inventory) {
  return (stk.product && typeof stk.product === 'object') ? stk.product.sku : ''
}

// Product Image helper
function getProductImage(stk: Inventory) {
  return (stk.product && typeof stk.product === 'object') ? stk.product.images?.[0] : ''
}

async function submitAdjustment() {
  if (!selectedStock.value || adjustQty.value <= 0) return
  
  submittingAdjust.value = true
  try {
    const prodId = typeof selectedStock.value.product === 'object' ? selectedStock.value.product._id : selectedStock.value.product
    const payload = {
      productId: prodId,
      quantity: adjustQty.value,
      note: adjustNote.value,
    }

    if (adjustType.value === 'import') {
      await inventoryService.importStock(payload)
      toast.success('Nhập kho thành công!')
    } else if (adjustType.value === 'export') {
      await inventoryService.exportStock(payload)
      toast.success('Xuất kho thành công!')
    } else {
      await inventoryService.adjustStock(payload)
      toast.success('Điều chỉnh số lượng tồn kho thành công!')
    }

    // Refresh stocks list
    await fetchStocks()
  } catch (err: any) {
    toast.error(err.message || 'Gặp lỗi trong quá trình điều chỉnh kho')
  } finally {
    submittingAdjust.value = false
  }
}

function getInventoryBadgeStyle(status: string, current: number, min: number) {
  if (status === 'LOW_STOCK' || current <= min) {
    return 'bg-amber-100 text-amber-800 border border-amber-200'
  }
  if (current === 0) {
    return 'bg-red-100 text-red-800 border border-red-200'
  }
  return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
}

function getInventoryStatusLabel(status: string, current: number, min: number) {
  if (status === 'LOW_STOCK' || current <= min) {
    return 'Tồn kho thấp'
  }
  if (current === 0) {
    return 'Hết hàng'
  }
  return 'Đủ hàng'
}

function getProductPlaceholder(prodName?: string) {
  const name = (prodName || '').toLowerCase()
  if (name.includes('bút') || name.includes('viết') || name.includes('chì')) {
    return {
      gradient: 'bg-gradient-to-br from-red-400 to-rose-500',
      icon: 'pencil'
    }
  }
  if (name.includes('giấy') || name.includes('sổ') || name.includes('vở') || name.includes('tập') || name.includes('note')) {
    return {
      gradient: 'bg-gradient-to-br from-emerald-400 to-teal-500',
      icon: 'document'
    }
  }
  if (name.includes('máy tính') || name.includes('casio')) {
    return {
      gradient: 'bg-gradient-to-br from-indigo-400 to-purple-500',
      icon: 'calculator'
    }
  }
  if (name.includes('hồ sơ') || name.includes('bìa') || name.includes('kẹp') || name.includes('keo') || name.includes('thước')) {
    return {
      gradient: 'bg-gradient-to-br from-blue-400 to-sky-500',
      icon: 'folder'
    }
  }
  return {
    gradient: 'bg-gradient-to-br from-pink-400 to-rose-500',
    icon: 'tag'
  }
}
</script>
