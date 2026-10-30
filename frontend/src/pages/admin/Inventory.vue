<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="space-y-1">
        <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Quản lý kho hàng</h2>
        <p class="text-[11px] text-slate-400 font-semibold">Kiểm soát mức kho tối thiểu/tối đa, điều chỉnh kiểm kê hoặc xuất nhập kho nhanh chóng.</p>
      </div>
      <div class="flex items-center gap-2">
        <router-link
          to="/admin/pos"
          class="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <span>⚡ Bán hàng quầy (POS)</span>
        </router-link>
        <button
          type="button"
          :disabled="reconciling"
          class="border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          @click="handleReconcile"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 text-slate-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span>{{ reconciling ? 'Đang đối soát...' : 'Đối soát kho (Audit)' }}</span>
        </button>
      </div>
    </div>

    <!-- Tabs Switcher -->
    <div class="flex border-b border-slate-200 gap-6">
      <button
        :class="['pb-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer', activeTab === 'stock' ? 'border-[#dc2626] text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600']"
        @click="activeTab = 'stock'"
      >
        Kho hiện tại
      </button>
      <button
        :class="['pb-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer', activeTab === 'history' ? 'border-[#dc2626] text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600']"
        @click="activeTab = 'history'"
      >
        Lịch sử nhập/xuất kho
      </button>
    </div>

    <!-- Tab 1: Current Stock & Adjust Panel -->
    <div v-if="activeTab === 'stock'" class="space-y-6">
      <!-- Low Stock Warning Alert Box (TT-008 & TT-017: Chỉ cảnh báo hàng còn tồn > 0 nhưng sắp hết) -->
      <div v-if="lowStockItems.length > 0" class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-2">
        <div class="flex items-center gap-2 text-amber-800">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 flex-shrink-0 text-amber-600">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <span class="text-[10px] font-extrabold uppercase tracking-wider">Cảnh báo sắp hết hàng (Dưới định mức tối thiểu)</span>
        </div>
        <div class="flex flex-wrap gap-2 pt-1">
          <div
            v-for="stk in lowStockItems"
            :key="stk._id"
            class="bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-700 flex items-center gap-1.5"
          >
            <span>{{ getProductName(stk) }}</span>
            <span class="text-red-600">(Còn {{ stk.currentStock }} / Định mức {{ stk.minStock }} {{ getProductUnit(stk) }})</span>
          </div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <!-- Stock List DataTable (TT-004 & TT-020: Server-side pagination) -->
        <div class="xl:col-span-2">
          <DataTable
            :columns="stockColumns"
            :items="stocks"
            :loading="loading"
            clickable
            :selected-row-key="selectedStock?._id"
            pagination
            :current-page="currentPage"
            :total-items="totalStocks"
            :page-size="pageSize"
            empty-text="Chưa có thông tin kho cho sản phẩm nào."
            empty-subtext="Không tìm thấy sản phẩm phù hợp với từ khóa tìm kiếm."
            @row-click="selectStock"
            @page-change="onPageChange"
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
                  @input="onSearchInput"
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

            <!-- Status Cell with StatusBadge (TT-008 & TT-017) -->
            <template #cell(status)="{ row }">
              <StatusBadge
                :status="getInventoryStatusKey(row)"
                type="inventory"
                :label="getInventoryStatusLabel(row.status, row.currentStock, row.minStock)"
              />
            </template>
          </DataTable>
        </div>

        <!-- Adjust Stock Panel (TT-001) -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Thao tác kho</h3>

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
                  <option value="adjustment">Kiểm kê kho (Số lượng thực tế)</option>
                  <option value="import">Nhập thêm kho (+)</option>
                  <option value="sale">Xuất tiêu hao / Sử dụng nội bộ (-)</option>
                  <option value="return">Khách trả hàng (+)</option>
                  <option value="damage">Hư hỏng / Hao hụt (-)</option>
                </select>
                <p v-if="adjustType === 'sale'" class="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg mt-1 font-semibold">
                  💡 Để bán lẻ cho khách và xuất hóa đơn quầy, vui lòng sử dụng chức năng <router-link to="/admin/pos" class="font-bold underline text-[#dc2626]">Bán hàng tại quầy (POS)</router-link>.
                </p>
              </div>

              <!-- Quantity Input -->
              <div>
                <label class="text-xs font-bold text-slate-700 block mb-1">
                  {{ adjustType === 'adjustment' ? 'Số lượng thực tế sau kiểm kê' : 'Số lượng thay đổi' }}
                </label>
                <input
                  v-model.number="adjustQty"
                  type="number"
                  :min="adjustType === 'adjustment' ? 0 : 1"
                  :placeholder="adjustType === 'adjustment' ? 'Nhập số lượng đếm được...' : 'Nhập số lượng...'"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
                />
              </div>

              <!-- TT-001: Live Difference Preview Box when adjusting -->
              <div v-if="adjustType === 'adjustment' && selectedStock" class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div class="flex justify-between text-slate-500 font-semibold">
                  <span>Tồn trên hệ thống:</span>
                  <span class="font-bold text-slate-800">{{ selectedStock.currentStock }} {{ getProductUnit(selectedStock) }}</span>
                </div>
                <div class="flex justify-between text-slate-500 font-semibold">
                  <span>Tồn đếm thực tế:</span>
                  <span class="font-bold text-slate-800">{{ adjustQty }} {{ getProductUnit(selectedStock) }}</span>
                </div>
                <div class="flex justify-between border-t border-slate-200 pt-1 font-bold">
                  <span>Chênh lệch điều chỉnh:</span>
                  <span :class="adjustmentDifference > 0 ? 'text-emerald-600' : adjustmentDifference < 0 ? 'text-red-600' : 'text-slate-500'">
                    {{ adjustmentDifference > 0 ? '+' : '' }}{{ adjustmentDifference }} {{ getProductUnit(selectedStock) }}
                    <small v-if="adjustmentDifference === 0" class="block font-normal text-slate-400">Không thay đổi</small>
                  </span>
                </div>
              </div>

              <!-- Note Input -->
              <div>
                <label class="text-xs font-bold text-slate-700 block mb-1">
                  {{ adjustType === 'adjustment' ? 'Lý do kiểm kê / điều chỉnh (*)' : 'Ghi chú thao tác' }}
                </label>
                <textarea
                  v-model="adjustNote"
                  rows="2"
                  :placeholder="adjustType === 'adjustment' ? 'Bắt buộc nhập lý do (ví dụ: kiểm kê tháng 10, phát hiện hao hụt...)' : 'Nhập ghi chú hoặc số chứng từ...'"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
                ></textarea>
              </div>

              <button
                type="button"
                :disabled="submittingAdjust || isSubmitDisabled"
                class="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                @click="submitAdjustment"
              >
                <svg v-if="submittingAdjust" class="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>{{ submittingAdjust ? 'Đang xử lý...' : adjustType === 'adjustment' ? 'Xác nhận kiểm kê' : 'Xác nhận thao tác' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Transaction History (TT-004: Server-side pagination & Excel export) -->
    <div v-else class="space-y-6">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <FilterBar
          v-model="historyQuery"
          placeholder="Tìm kiếm lịch sử theo sản phẩm, SKU, người thực hiện hoặc ghi chú..."
          class="flex-grow"
          @update:model-value="onHistorySearch"
        />
        <button
          type="button"
          :disabled="exportingHistory"
          class="border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 flex-shrink-0"
          @click="handleExportHistory"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-emerald-600">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          <span>{{ exportingHistory ? 'Đang xuất...' : 'Xuất Excel lịch sử' }}</span>
        </button>
      </div>

      <DataTable
        :columns="historyColumns"
        :items="transactions"
        :loading="loadingTransactions"
        pagination
        :current-page="historyPage"
        :total-items="totalTransactions"
        :page-size="historyPageSize"
        empty-text="Chưa có lịch sử giao dịch kho nào."
        empty-subtext="Không tìm thấy lịch sử phù hợp với từ khóa tìm kiếm."
        @page-change="onHistoryPageChange"
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
            <small class="block text-slate-400 font-normal">{{ row.stockBefore }} → {{ row.stockAfter }}</small>
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

    <!-- Reconciliation Modal (TT-002) -->
    <div
      v-if="showReconcileModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      @click="showReconcileModal = false"
    >
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden p-6 space-y-4" @click.stop>
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Kết quả đối soát tồn kho</h3>
          <button class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer" @click="showReconcileModal = false">✕</button>
        </div>

        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span class="text-[10px] uppercase font-bold text-slate-400 block">Tổng đã duyệt</span>
            <span class="text-xl font-extrabold text-slate-800">{{ reconcileReport?.totalChecked || 0 }}</span>
          </div>
          <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <span class="text-[10px] uppercase font-bold text-emerald-700 block">Khớp 100%</span>
            <span class="text-xl font-extrabold text-emerald-600">{{ reconcileReport?.matchedCount || 0 }}</span>
          </div>
          <div class="p-3 rounded-xl bg-red-50 border border-red-200">
            <span class="text-[10px] uppercase font-bold text-red-700 block">Lệch tồn</span>
            <span class="text-xl font-extrabold text-red-600">{{ reconcileReport?.mismatchedCount || 0 }}</span>
          </div>
        </div>

        <div v-if="reconcileReport?.discrepancies?.length > 0" class="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-50 text-[10px] uppercase font-extrabold text-slate-500 border-b border-slate-200">
              <tr>
                <th class="p-2.5">Sản phẩm</th>
                <th class="p-2.5">SKU</th>
                <th class="p-2.5 text-center">Product.stock</th>
                <th class="p-2.5 text-center">Inventory</th>
                <th class="p-2.5 text-center">Lệch</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="d in reconcileReport.discrepancies" :key="d.productId">
                <td class="p-2.5 font-bold text-slate-800">{{ d.productName }}</td>
                <td class="p-2.5 font-mono text-[10px]">{{ d.sku }}</td>
                <td class="p-2.5 text-center font-bold text-slate-700">{{ d.productStock }}</td>
                <td class="p-2.5 text-center font-bold text-slate-700">{{ d.inventoryStock }}</td>
                <td class="p-2.5 text-center font-extrabold text-red-600">{{ d.difference > 0 ? '+' : '' }}{{ d.difference }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-center py-6 text-emerald-600 font-bold text-xs bg-emerald-50/50 rounded-xl border border-emerald-100">
          Tuyệt vời! Toàn bộ sản phẩm đều khớp chính xác giữa danh mục và sổ kho.
        </div>

        <div class="flex justify-end pt-2">
          <button
            class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
            @click="showReconcileModal = false"
          >
            Đóng
          </button>
        </div>
      </div>
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

const activeTab = ref<'stock' | 'history'>('stock')

// Tab 1: Current stock state
const stocks = ref<Inventory[]>([])
const loading = ref(true)
const selectedStock = ref<Inventory | null>(null)
const adjustType = ref<'import' | 'sale' | 'return' | 'adjustment' | 'damage'>('adjustment')
const adjustQty = ref(0)
const adjustNote = ref('')
const submittingAdjust = ref(false)
const stockQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(15)
const totalStocks = ref(0)

// Tab 2: Transaction history state
const transactions = ref<any[]>([])
const loadingTransactions = ref(false)
const historyQuery = ref('')
const historyPage = ref(1)
const historyPageSize = ref(20)
const totalTransactions = ref(0)
const exportingHistory = ref(false)

// Reconcile modal state
const reconciling = ref(false)
const showReconcileModal = ref(false)
const reconcileReport = ref<any>(null)

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

// Chênh lệch tính toán trực tiếp cho form kiểm kê (TT-001)
const adjustmentDifference = computed(() => {
  if (!selectedStock.value || adjustQty.value === undefined || adjustQty.value === null) return 0
  return Number(adjustQty.value) - selectedStock.value.currentStock
})

const isSubmitDisabled = computed(() => {
  if (
    adjustQty.value === undefined ||
    adjustQty.value === null ||
    Number.isNaN(adjustQty.value)
  ) {
    return true
  }
  if (adjustType.value === 'adjustment') {
    return adjustQty.value < 0 || !adjustNote.value.trim()
  }
  return adjustQty.value <= 0
})

// TT-008 & TT-017: Chỉ báo sắp hết hàng cho sản phẩm còn tồn > 0
const lowStockItems = computed(() => {
  return stocks.value.filter(
    (stk) => stk.currentStock > 0 && (stk.status === 'LOW_STOCK' || stk.currentStock <= stk.minStock),
  )
})

let searchTimeout: any = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchStocks()
  }, 350)
}

function onPageChange(page: number) {
  currentPage.value = page
  fetchStocks()
}

async function fetchStocks() {
  loading.value = true
  try {
    const res: any = await inventoryService.getAll({
      page: currentPage.value,
      limit: pageSize.value,
      search: stockQuery.value.trim() || undefined,
    })
    const items = Array.isArray(res.data) ? res.data : (res.data?.data || [])
    stocks.value = items
    totalStocks.value = res.meta?.total ?? res.data?.total ?? items.length

    if (stocks.value.length > 0 && !selectedStock.value) {
      selectStock(stocks.value[0])
    }
  } catch {
    toast.error('Lỗi khi tải dữ liệu kho')
  } finally {
    loading.value = false
  }
}

let historySearchTimeout: any = null
function onHistorySearch() {
  clearTimeout(historySearchTimeout)
  historySearchTimeout = setTimeout(() => {
    historyPage.value = 1
    fetchTransactions()
  }, 350)
}

function onHistoryPageChange(page: number) {
  historyPage.value = page
  fetchTransactions()
}

async function fetchTransactions() {
  loadingTransactions.value = true
  try {
    const res: any = await inventoryService.getTransactions({
      page: historyPage.value,
      limit: historyPageSize.value,
      search: historyQuery.value.trim() || undefined,
    })
    const items = Array.isArray(res.data) ? res.data : (res.data?.data || [])
    transactions.value = items
    totalTransactions.value = res.meta?.total ?? res.data?.total ?? items.length
  } catch {
    toast.error('Lỗi khi tải lịch sử kho')
  } finally {
    loadingTransactions.value = false
  }
}

async function handleExportHistory() {
  exportingHistory.value = true
  try {
    const res = await inventoryService.exportTransactions({
      search: historyQuery.value.trim() || undefined,
    })
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Lich_su_kho_${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    toast.success('Đã xuất file Excel lịch sử kho thành công')
  } catch {
    toast.error('Lỗi khi xuất file Excel lịch sử kho')
  } finally {
    exportingHistory.value = false
  }
}

async function handleReconcile() {
  reconciling.value = true
  try {
    const res: any = await inventoryService.reconcile()
    reconcileReport.value = res.data?.data || res.data
    showReconcileModal.value = true
  } catch {
    toast.error('Không thể thực hiện đối soát kho vào lúc này')
  } finally {
    reconciling.value = false
  }
}

function selectStock(stk: Inventory) {
  selectedStock.value = stk
  if (adjustType.value === 'adjustment') {
    adjustQty.value = stk.currentStock
  } else {
    adjustQty.value = 1
  }
  adjustNote.value = ''
}

watch(adjustType, (newType) => {
  if (newType === 'adjustment') {
    adjustQty.value = selectedStock.value ? selectedStock.value.currentStock : 0
  } else {
    adjustQty.value = 1
  }
})

function getProductName(stk: Inventory) {
  return stk.product && typeof stk.product === 'object' ? stk.product.name : 'Sản phẩm không rõ'
}

function getProductSku(stk: Inventory) {
  return stk.product && typeof stk.product === 'object' ? stk.product.sku : ''
}

function getProductImage(stk: Inventory) {
  return stk.product && typeof stk.product === 'object' ? stk.product.images?.[0] : ''
}

function getProductUnit(stk: Inventory | null) {
  if (!stk) return 'cái'
  return stk.product && typeof stk.product === 'object' ? stk.product.unit || 'cái' : 'cái'
}

/**
 * TT-001 & TT-005: Submit thao tác kho với Idempotency Key và validation số lượng thực tế
 */
async function submitAdjustment() {
  if (!selectedStock.value) return

  if (
    adjustQty.value === undefined ||
    adjustQty.value === null ||
    Number.isNaN(adjustQty.value)
  ) {
    toast.warning('Vui lòng nhập số lượng hợp lệ')
    return
  }

  if (adjustType.value === 'adjustment') {
    if (adjustQty.value < 0) {
      toast.warning('Tồn kho thực tế không thể âm')
      return
    }
    if (!adjustNote.value.trim()) {
      toast.warning('Vui lòng nhập lý do/ghi chú điều chỉnh kiểm kê')
      return
    }
  } else if (adjustQty.value <= 0) {
    toast.warning('Số lượng thay đổi phải lớn hơn 0')
    return
  }

  submittingAdjust.value = true
  try {
    const prodId =
      typeof selectedStock.value.product === 'object'
        ? selectedStock.value.product._id
        : selectedStock.value.product

    const idempotencyKey = `${adjustType.value}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    if (adjustType.value === 'adjustment') {
      const payload = {
        product: prodId,
        newStock: adjustQty.value,
        expectedCurrentStock: selectedStock.value.currentStock,
        note: adjustNote.value.trim(),
        idempotencyKey,
      }
      await inventoryService.adjustStock(payload)
      toast.success('Điều chỉnh số lượng kho thành công!')
    } else {
      const payload = {
        product: prodId,
        quantity: adjustQty.value,
        note: adjustNote.value.trim() || undefined,
        idempotencyKey,
      }
      if (adjustType.value === 'import') {
        await inventoryService.importStock(payload)
        toast.success('Nhập kho thành công!')
      } else if (adjustType.value === 'sale') {
        await inventoryService.saleStock(payload)
        toast.success('Ghi nhận xuất bán thành công!')
      } else if (adjustType.value === 'return') {
        await inventoryService.returnStock(payload)
        toast.success('Hoàn kho thành công!')
      } else if (adjustType.value === 'damage') {
        await inventoryService.damageStock(payload)
        toast.success('Ghi nhận hư hỏng thành công!')
      }
    }

    const oldId = selectedStock.value?._id
    await fetchStocks()
    if (oldId) {
      const updated = stocks.value.find((s) => s._id === oldId)
      if (updated) {
        selectStock(updated)
      }
    }

    await fetchTransactions()
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message || 'Gặp lỗi trong quá trình điều chỉnh kho'
    toast.error(msg)
    if (err.response?.status === 409) {
      await fetchStocks()
    }
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
    year: 'numeric',
  })
}

// TT-007: Thêm nhãn cho OPENING_BALANCE
function getTransactionTypeLabel(type: string) {
  if (type === 'IMPORT') return 'Nhập kho'
  if (type === 'SALE') return 'Bán hàng'
  if (type === 'RETURN') return 'Hoàn kho'
  if (type === 'DAMAGE') return 'Hư hỏng'
  if (type === 'OPENING_BALANCE') return 'Tồn đầu kỳ'
  return 'Điều chỉnh'
}

function getTransactionTypeStyle(type: string) {
  if (type === 'IMPORT') return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  if (type === 'SALE') return 'bg-red-50 text-red-800 border-red-200'
  if (type === 'RETURN') return 'bg-teal-50 text-teal-800 border-teal-200'
  if (type === 'DAMAGE') return 'bg-rose-50 text-rose-800 border-rose-200'
  if (type === 'OPENING_BALANCE') return 'bg-purple-50 text-purple-800 border-purple-200'
  return 'bg-blue-50 text-blue-800 border-blue-200'
}

// TT-017 & TT-008: Kiểm tra tồn = 0 trước khi kiểm tra minStock
function getInventoryStatusKey(stk: Inventory) {
  if (stk.currentStock <= 0) {
    return 'OUT_OF_STOCK'
  }
  if (stk.status === 'LOW_STOCK' || stk.currentStock <= stk.minStock) {
    return 'LOW_STOCK'
  }
  return 'IN_STOCK'
}

function getInventoryStatusLabel(status: string, current: number, min: number) {
  if (current <= 0) {
    return 'Hết hàng'
  }
  if (status === 'LOW_STOCK' || current <= min) {
    return 'Sắp hết hàng'
  }
  return 'Còn hàng'
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
