<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-extrabold text-slate-900">Báo Giá Nhà Cung Cấp & Tối Ưu Nguồn Hàng</h2>
        <p class="text-xs text-slate-500 font-medium">
          Quản lý báo giá (Supplier Quotations / RFQ), so sánh đơn giá và đề xuất nguồn hàng mua tối ưu (PUR-02).
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Tab selector -->
        <div class="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            class="px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer"
            :class="[activeTab === 'LIST' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900']"
            @click="activeTab = 'LIST'"
          >
            Báo Giá NCC
          </button>
          <button
            class="px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer"
            :class="[activeTab === 'COMPARE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900']"
            @click="activeTab = 'COMPARE'"
          >
            So Sánh Nguồn Hàng
          </button>
        </div>

        <button
          v-if="activeTab === 'LIST'"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          @click="openCreateModal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Tạo Báo Giá NCC</span>
        </button>
      </div>
    </div>

    <!-- TAB 1: LIST OF QUOTATIONS -->
    <div v-if="activeTab === 'LIST'" class="space-y-4">
      <!-- Filter Bar -->
      <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div class="relative w-full sm:w-80">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm theo mã báo giá, ghi chú..."
            class="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
            @keyup.enter="fetchQuotations"
          />
          <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <select
            v-model="statusFilter"
            class="text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
            @change="fetchQuotations"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Nháp (DRAFT)</option>
            <option value="APPROVED">Đã duyệt (APPROVED)</option>
            <option value="REJECTED">Đã từ chối (REJECTED)</option>
            <option value="EXPIRED">Hết hiệu lực (EXPIRED)</option>
          </select>
          <button
            class="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            @click="fetchQuotations"
          >
            Lọc
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th class="p-4">Mã Báo Giá</th>
                <th class="p-4">Nhà Cung Cấp</th>
                <th class="p-4">Hiệu Lực</th>
                <th class="p-4 text-center">Số Mặt Hàng</th>
                <th class="p-4">Điều Khoản</th>
                <th class="p-4">Trạng Thái</th>
                <th class="p-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="loading" class="text-center">
                <td colspan="7" class="p-8 text-slate-400">Đang tải danh sách báo giá...</td>
              </tr>
              <tr v-else-if="quotations.length === 0" class="text-center">
                <td colspan="7" class="p-8 text-slate-400">Chưa có báo giá nào từ nhà cung cấp.</td>
              </tr>
              <tr v-for="q in quotations" :key="q._id" class="hover:bg-slate-50/80 transition-colors">
                <td class="p-4 font-bold text-blue-600">
                  {{ q.quotationCode }}
                </td>
                <td class="p-4 font-semibold text-slate-800">
                  {{ q.supplier?.name || 'NCC N/A' }}
                  <span v-if="q.supplier?.phone" class="block text-[11px] font-normal text-slate-400">{{ q.supplier.phone }}</span>
                </td>
                <td class="p-4 text-slate-600">
                  {{ formatDate(q.validFrom) }} &rarr; {{ formatDate(q.validUntil) }}
                </td>
                <td class="p-4 text-center font-bold text-slate-700">
                  {{ q.items?.length || 0 }}
                </td>
                <td class="p-4 text-slate-600">
                  {{ q.paymentTerms || 'NET30' }}
                </td>
                <td class="p-4">
                  <span
                    class="px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider"
                    :class="{
                      'bg-amber-100 text-amber-700': q.status === 'DRAFT',
                      'bg-emerald-100 text-emerald-700': q.status === 'APPROVED',
                      'bg-rose-100 text-rose-700': q.status === 'REJECTED',
                      'bg-slate-100 text-slate-600': q.status === 'EXPIRED',
                    }"
                  >
                    {{ q.status }}
                  </span>
                </td>
                <td class="p-4 text-right space-x-1">
                  <button
                    v-if="q.status === 'DRAFT'"
                    class="px-2 py-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    title="Duyệt báo giá"
                    @click="handleApprove(q._id)"
                  >
                    Duyệt
                  </button>
                  <button
                    v-if="q.status === 'DRAFT'"
                    class="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Từ chối báo giá"
                    @click="handleReject(q._id)"
                  >
                    Từ chối
                  </button>
                  <button
                    v-if="q.status === 'APPROVED'"
                    class="px-2 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Tạo đơn PO từ báo giá này"
                    @click="openCreatePOModal(q)"
                  >
                    Tạo PO
                  </button>
                  <button
                    class="px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    @click="viewDetails(q)"
                  >
                    Chi tiết
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: COMPARE SUPPLIERS -->
    <div v-else class="space-y-6">
      <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Chọn Sản Phẩm & Số Lượng Để So Sánh Nguồn Hàng</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Chọn Sản Phẩm</label>
            <select
              v-model="compareProductId"
              class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Chọn sản phẩm cần mua sắm --</option>
              <option v-for="p in productList" :key="p._id" :value="p._id">
                {{ p.title }} (SKU: {{ p.sku }})
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Số Lượng Dự Kiến Mua</label>
            <input
              v-model.number="compareQuantity"
              type="number"
              min="1"
              placeholder="Ví dụ: 100"
              class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div class="flex items-end">
            <button
              class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              :disabled="comparing || !compareProductId"
              @click="runComparison"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>{{ comparing ? 'Đang phân tích...' : 'So Sánh & Đề Xuất' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Comparison Results -->
      <div v-if="comparisonResult" class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p class="text-xs font-bold text-blue-900 uppercase">Khuyến Nghị Nguồn Hàng Tối Ưu Nhất</p>
            <p class="text-sm font-extrabold text-blue-700 mt-0.5">
              {{ comparisonResult.recommendedSupplier?.name || 'Chưa xác định' }} &mdash; Đơn giá áp dụng: {{ formatCurrency(comparisonResult.bestPrice || 0) }}
            </p>
          </div>
          <button
            v-if="comparisonResult.bestQuotationId"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            @click="createPOFromRecommendation(comparisonResult)"
          >
            Tạo Đơn PO Ngay
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(source, idx) in comparisonResult.sources || []"
            :key="idx"
            class="bg-white border rounded-2xl p-5 shadow-xs relative"
            :class="[source.isBest ? 'border-emerald-400 ring-2 ring-emerald-400/20' : 'border-slate-200']"
          >
            <span
              v-if="source.isBest"
              class="absolute top-3 right-3 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full"
            >
              Tốt nhất #1
            </span>
            <h4 class="font-bold text-slate-900 text-sm mb-1">{{ source.supplierName }}</h4>
            <p class="text-xs text-slate-500 mb-3">Mã báo giá: {{ source.quotationCode }}</p>

            <div class="space-y-2 text-xs border-t border-slate-100 pt-3">
              <div class="flex justify-between">
                <span class="text-slate-500">Đơn giá cơ sở:</span>
                <span class="font-bold text-slate-800">{{ formatCurrency(source.baseUnitPrice || 0) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Đơn giá áp dụng theo bậc:</span>
                <span class="font-extrabold text-emerald-600">{{ formatCurrency(source.applicablePrice || source.baseUnitPrice || 0) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">MOQ (Tối thiểu):</span>
                <span class="font-semibold text-slate-700">{{ source.moq || 1 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Thời gian giao:</span>
                <span class="font-semibold text-slate-700">{{ source.leadTimeDays }} ngày</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Điểm đánh giá tổng hợp:</span>
                <span class="font-black text-blue-600">{{ source.score ?? 'N/A' }} / 100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: CREATE QUOTATION -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div class="bg-white border border-slate-200 rounded-3xl shadow-xl w-full max-w-2xl p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-900">Tạo Báo Giá Nhà Cung Cấp Mới</h3>
          <button class="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer" @click="showCreateModal = false">&times;</button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Nhà Cung Cấp *</label>
            <select
              v-model="createForm.supplier"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Chọn Nhà Cung Cấp --</option>
              <option v-for="s in supplierList" :key="s._id" :value="s._id">
                {{ s.name }} ({{ s.code || 'NCC' }})
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Hiệu lực từ *</label>
              <input
                v-model="createForm.validFrom"
                type="date"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Hiệu lực đến *</label>
              <input
                v-model="createForm.validUntil"
                type="date"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Điều Khoản Thanh Toán</label>
            <input
              v-model="createForm.paymentTerms"
              type="text"
              placeholder="NET30, NET60, COD..."
              class="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <!-- Items in quotation -->
          <div class="border border-slate-200 rounded-2xl p-3 space-y-2">
            <div class="flex justify-between items-center mb-1">
              <span class="font-bold text-slate-800">Danh Mục Sản Phẩm Trong Báo Giá</span>
              <button
                type="button"
                class="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                @click="addItemRow"
              >
                + Thêm sản phẩm
              </button>
            </div>

            <div v-for="(it, idx) in createForm.items" :key="idx" class="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl">
              <div class="col-span-5">
                <select
                  v-model="it.product"
                  class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                  @change="onProductSelect(it)"
                >
                  <option value="">-- Chọn SP --</option>
                  <option v-for="p in productList" :key="p._id" :value="p._id">
                    {{ p.title }}
                  </option>
                </select>
              </div>
              <div class="col-span-2">
                <input
                  v-model.number="it.baseUnitPrice"
                  type="number"
                  placeholder="Đơn giá"
                  class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                />
              </div>
              <div class="col-span-2">
                <input
                  v-model.number="it.moq"
                  type="number"
                  placeholder="MOQ"
                  class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                />
              </div>
              <div class="col-span-2">
                <input
                  v-model.number="it.leadTimeDays"
                  type="number"
                  placeholder="Ngày giao"
                  class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                />
              </div>
              <div class="col-span-1 text-right">
                <button
                  type="button"
                  class="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                  @click="removeItemRow(idx)"
                >
                  &times;
                </button>
              </div>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Ghi Chú</label>
            <textarea
              v-model="createForm.notes"
              rows="2"
              placeholder="Ghi chú thêm về báo giá..."
              class="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            @click="showCreateModal = false"
          >
            Hủy
          </button>
          <button
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            :disabled="submitting"
            @click="submitCreateQuotation"
          >
            {{ submitting ? 'Đang lưu...' : 'Lưu Báo Giá' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: CONVERT TO PO -->
    <div
      v-if="showPOModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
    >
      <div class="bg-white border border-slate-200 rounded-3xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-900">Tạo Đơn Đặt Mua PO Từ Báo Giá</h3>
          <button class="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer" @click="showPOModal = false">&times;</button>
        </div>

        <div class="space-y-3 text-xs">
          <p class="text-slate-600">
            Mã báo giá: <strong class="text-blue-600">{{ selectedQuotation?.quotationCode }}</strong> &mdash; NCC: <strong>{{ selectedQuotation?.supplier?.name }}</strong>
          </p>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Ngày Dự Kiến Giao Hàng</label>
            <input
              v-model="poForm.expectedDeliveryDate"
              type="date"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div class="border border-slate-200 rounded-2xl p-3 space-y-2">
            <span class="font-bold text-slate-800 block mb-1">Số Lượng Đặt Hàng Theo Sản Phẩm</span>
            <div
              v-for="(it, idx) in poForm.items"
              :key="idx"
              class="flex items-center justify-between gap-3 bg-slate-50 p-2 rounded-xl"
            >
              <div class="truncate flex-1">
                <span class="font-bold text-slate-800">{{ it.productName }}</span>
                <span class="block text-[11px] text-slate-400">Đơn giá: {{ formatCurrency(it.unitPrice) }}</span>
              </div>
              <div class="w-24">
                <input
                  v-model.number="it.orderedQuantity"
                  type="number"
                  min="1"
                  class="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white text-right font-bold"
                />
              </div>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Ghi Chú Đơn Hàng PO</label>
            <input
              v-model="poForm.note"
              type="text"
              placeholder="Ghi chú đơn đặt mua..."
              class="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            @click="showPOModal = false"
          >
            Hủy
          </button>
          <button
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            :disabled="submitting"
            @click="submitCreatePO"
          >
            {{ submitting ? 'Đang tạo...' : 'Xác Nhận Tạo Đơn PO' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { quotationService, type SupplierQuotation } from '@/services/quotation.service';
import { supplierService } from '@/services/supplier.service';
import { productService } from '@/services/product.service';
import { formatCurrency, formatDate } from '@/utils/helpers';

const toast = useToast();

const activeTab = ref<'LIST' | 'COMPARE'>('LIST');
const loading = ref(false);
const quotations = ref<SupplierQuotation[]>([]);
const searchQuery = ref('');
const statusFilter = ref('');

const supplierList = ref<any[]>([]);
const productList = ref<any[]>([]);

// Comparison
const compareProductId = ref('');
const compareQuantity = ref(50);
const comparing = ref(false);
const comparisonResult = ref<any>(null);

// Create Quotation Modal
const showCreateModal = ref(false);
const submitting = ref(false);
const createForm = ref<any>({
  supplier: '',
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  paymentTerms: 'NET30',
  notes: '',
  items: [],
});

// Create PO Modal
const showPOModal = ref(false);
const selectedQuotation = ref<SupplierQuotation | null>(null);
const poForm = ref<any>({
  quotationId: '',
  expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  note: '',
  items: [],
});

onMounted(async () => {
  await Promise.all([fetchQuotations(), loadSuppliersAndProducts()]);
});

async function fetchQuotations() {
  loading.value = true;
  try {
    const res: any = await quotationService.getAll({
      search: searchQuery.value || undefined,
      status: statusFilter.value || undefined,
    });
    quotations.value = Array.isArray(res) ? res : res.data || [];
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Lỗi khi tải danh sách báo giá');
  } finally {
    loading.value = false;
  }
}

async function loadSuppliersAndProducts() {
  try {
    const [sRes, pRes]: any = await Promise.all([
      supplierService.getAll(),
      productService.getAll({ limit: 100 }),
    ]);
    supplierList.value = Array.isArray(sRes) ? sRes : sRes.data || [];
    productList.value = Array.isArray(pRes) ? pRes : (pRes.data?.products || pRes.data || []);
  } catch {
    // Non-blocking
  }
}

async function handleApprove(id: string) {
  if (!confirm('Bạn có chắc muốn duyệt báo giá này?')) return;
  try {
    await quotationService.approve(id);
    toast.success('Đã duyệt báo giá thành công!');
    await fetchQuotations();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Lỗi khi duyệt báo giá');
  }
}

async function handleReject(id: string) {
  const reason = prompt('Nhập lý do từ chối báo giá:');
  if (reason === null) return;
  try {
    await quotationService.reject(id, reason || 'Không phù hợp tiêu chí');
    toast.success('Đã từ chối báo giá');
    await fetchQuotations();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Lỗi khi từ chối báo giá');
  }
}

function openCreateModal() {
  createForm.value = {
    supplier: supplierList.value[0]?._id || '',
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    paymentTerms: 'NET30',
    notes: '',
    items: [
      {
        product: '',
        productName: '',
        sku: '',
        baseUnitPrice: 0,
        moq: 10,
        leadTimeDays: 3,
      },
    ],
  };
  showCreateModal.value = true;
}

function addItemRow() {
  createForm.value.items.push({
    product: '',
    productName: '',
    sku: '',
    baseUnitPrice: 0,
    moq: 10,
    leadTimeDays: 3,
  });
}

function removeItemRow(index: number | string) {
  const i = Number(index);
  if (createForm.value.items.length <= 1) return;
  createForm.value.items.splice(i, 1);
}

function onProductSelect(itemRow: any) {
  const p = productList.value.find((x) => x._id === itemRow.product);
  if (p) {
    itemRow.productName = p.title || p.name;
    itemRow.sku = p.sku || 'SKU';
    itemRow.baseUnitPrice = p.costPrice || p.price || 0;
  }
}

async function submitCreateQuotation() {
  if (!createForm.value.supplier) {
    toast.error('Vui lòng chọn nhà cung cấp');
    return;
  }
  if (!createForm.value.items.length || !createForm.value.items[0].product) {
    toast.error('Vui lòng chọn ít nhất 1 sản phẩm trong báo giá');
    return;
  }

  submitting.value = true;
  try {
    await quotationService.create(createForm.value);
    toast.success('Tạo báo giá nhà cung cấp thành công!');
    showCreateModal.value = false;
    await fetchQuotations();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Lỗi khi tạo báo giá');
  } finally {
    submitting.value = false;
  }
}

function openCreatePOModal(quotation: SupplierQuotation) {
  selectedQuotation.value = quotation;
  poForm.value = {
    quotationId: quotation._id,
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    note: `Tạo từ báo giá ${quotation.quotationCode}`,
    items: (quotation.items || []).map((it: any) => ({
      product: it.product?._id || it.product,
      productName: it.productName || it.product?.title || 'Sản phẩm',
      unitPrice: it.baseUnitPrice || it.unitPrice || 0,
      orderedQuantity: it.moq || 10,
    })),
  };
  showPOModal.value = true;
}

async function submitCreatePO() {
  submitting.value = true;
  try {
    const payload = {
      quotationId: poForm.value.quotationId,
      expectedDeliveryDate: poForm.value.expectedDeliveryDate,
      note: poForm.value.note,
      items: poForm.value.items.map((it: any) => ({
        product: it.product,
        orderedQuantity: Number(it.orderedQuantity) || 1,
      })),
    };
    await quotationService.createPO(payload);
    toast.success('Đã tạo đơn đặt mua PO thành công từ báo giá!');
    showPOModal.value = false;
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Lỗi khi tạo PO');
  } finally {
    submitting.value = false;
  }
}

async function runComparison() {
  if (!compareProductId.value) return;
  comparing.value = true;
  try {
    const res: any = await quotationService.compare(compareProductId.value, compareQuantity.value || 1);
    comparisonResult.value = res;
    toast.success('Đã hoàn thành so sánh và đề xuất nguồn hàng!');
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Không tìm thấy báo giá phù hợp cho sản phẩm này');
  } finally {
    comparing.value = false;
  }
}

function createPOFromRecommendation(result: any) {
  if (!result?.bestQuotationId) return;
  const q = quotations.value.find((x) => x._id === result.bestQuotationId);
  if (q) {
    openCreatePOModal(q);
  } else {
    toast.info('Vui lòng chuyển sang tab Báo Giá để lập đơn PO trực tiếp');
  }
}

function viewDetails(q: SupplierQuotation) {
  toast.info(`Báo giá ${q.quotationCode}: ${q.items?.length || 0} sản phẩm, Điều khoản: ${q.paymentTerms || 'NET30'}`);
}
</script>
