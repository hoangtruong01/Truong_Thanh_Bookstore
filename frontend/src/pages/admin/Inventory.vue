<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-1">
      <h2 class="text-lg font-extrabold text-slate-900">Quản lý kho hàng & tồn kho</h2>
      <p class="text-xs text-slate-500 font-medium">Kiểm soát mức tồn kho tối thiểu/tối đa, điều chỉnh hoặc nhập thêm hàng hóa nhanh chóng.</p>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
      <!-- Stock List Table -->
      <div class="xl:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div v-if="loading" class="p-8 animate-pulse space-y-4">
          <div v-for="n in 5" :key="n" class="h-12 bg-slate-100 rounded-xl w-full"></div>
        </div>

        <div v-else-if="stocks.length === 0" class="p-16 text-center text-slate-400 font-medium">
          Chưa có thông tin tồn kho cho sản phẩm nào.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-150 text-slate-400 font-bold text-xs uppercase tracking-wider">
                <th class="py-4 px-6">Sản phẩm</th>
                <th class="py-4 px-6">SKU</th>
                <th class="py-4 px-6">Số lượng</th>
                <th class="py-4 px-6">Định mức Min/Max</th>
                <th class="py-4 px-6">Trạng thái</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
              <tr
                v-for="stk in stocks"
                :key="stk._id"
                @click="selectStock(stk)"
                class="hover:bg-slate-50/50 cursor-pointer transition-colors"
                :class="[selectedStock?._id === stk._id ? 'bg-blue-50/40' : '']"
              >
                <td class="py-4 px-6 flex items-center gap-3">
                  <img :src="getProductImage(stk)" class="w-8 h-8 rounded-lg object-cover bg-slate-50 flex-shrink-0" />
                  <span class="font-bold text-slate-900 truncate max-w-[180px]">{{ getProductName(stk) }}</span>
                </td>
                <td class="py-4 px-6 font-mono text-xs">{{ getProductSku(stk) }}</td>
                <td class="py-4 px-6 font-bold text-slate-900">{{ stk.currentStock }}</td>
                <td class="py-4 px-6 text-xs text-slate-500 font-semibold">{{ stk.minStock }} / {{ stk.maxStock }}</td>
                <td class="py-4 px-6">
                  <span :class="['px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', getStatusColor(stk.status)]">
                    {{ getStatusLabel(stk.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick stock adjust panel -->
      <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">Điều chỉnh tồn kho</h3>

        <div v-if="!selectedStock" class="text-center py-12 text-slate-400 text-sm font-medium">
          Chọn một sản phẩm từ danh sách để thực hiện nhập/xuất hoặc điều chỉnh tồn kho.
        </div>

        <div v-else class="space-y-5">
          <div class="space-y-1">
            <h4 class="font-bold text-slate-800 text-sm">{{ getProductName(selectedStock) }}</h4>
            <p class="text-xs text-slate-400">Mã SKU: {{ getProductSku(selectedStock) }} | Hiện tại: <span class="font-bold text-slate-800">{{ selectedStock.currentStock }}</span></p>
          </div>

          <!-- Adjust Options Form -->
          <div class="space-y-4 border-t border-slate-100 pt-4">
            <div>
              <label class="text-xs font-bold text-slate-700">Loại điều chỉnh</label>
              <select
                v-model="adjustType"
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="import">Nhập kho (Import)</option>
                <option value="export">Xuất kho (Export)</option>
                <option value="adjust">Cập nhật trực tiếp số lượng</option>
              </select>
            </div>

            <div>
              <label class="text-xs font-bold text-slate-700">Số lượng điều chỉnh *</label>
              <input
                v-model.number="adjustQty"
                type="number"
                min="1"
                placeholder="Nhập số lượng..."
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label class="text-xs font-bold text-slate-700">Ghi chú / Lý do điều chỉnh</label>
              <textarea
                v-model="adjustNote"
                rows="3"
                placeholder="Ví dụ: Nhập thêm hàng mới, kiểm kê kho cuối tháng..."
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              ></textarea>
            </div>

            <button
              @click="submitAdjustment"
              :disabled="submittingAdjust"
              class="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 px-6 rounded-xl transition-colors flex items-center justify-center text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 disabled:bg-slate-300 disabled:shadow-none"
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
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { inventoryService } from '@/services/inventory.service'
import { getStatusColor, getStatusLabel } from '@/utils/helpers'
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

function selectStock(stk: Inventory) {
  selectedStock.value = stk
  adjustQty.value = 1
  adjustNote.value = ''
}

function getProductName(stk: Inventory) {
  return typeof stk.product === 'object' ? stk.product.name : 'Sản phẩm không rõ'
}

function getProductSku(stk: Inventory) {
  return typeof stk.product === 'object' ? stk.product.sku : ''
}

function getProductImage(stk: Inventory) {
  return typeof stk.product === 'object' ? stk.product.images?.[0] : ''
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
</script>
