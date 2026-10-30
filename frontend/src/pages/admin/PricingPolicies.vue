<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Chính Sách Giá & Biên Lợi Nhuận</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Quản lý % lãi, tỷ lệ Markup / Margin, thiết lập sàn lợi nhuận (Margin Floor) bảo vệ doanh nghiệp
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition-colors text-sm"
          @click="showCreateModal = true"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Thêm Chính Sách Giá
        </button>
      </div>
    </div>

    <!-- Quick Calculator Widget (PRC-01) -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800/80 p-5 rounded-2xl border border-blue-100 dark:border-gray-700 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
            %
          </div>
          <div>
            <h2 class="text-base font-bold text-gray-900 dark:text-white">Công Cụ Tính Giá Đề Xuất (Markup vs Margin)</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Biên lãi (Margin) = (Giá bán - Vốn) / Giá bán | Tỷ lệ dôi vốn (Markup) = (Giá bán - Vốn) / Vốn
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Giá vốn sản phẩm (VND)</label>
          <input
            v-model.number="calcCost"
            type="number"
            min="0"
            step="1000"
            placeholder="VD: 80000"
            class="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
            @input="runCalculate"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
            Mục tiêu Biên Lợi Nhuận (Margin %): <span class="text-blue-600 dark:text-blue-400 font-bold">{{ calcMargin }}%</span>
          </label>
          <input
            v-model.number="calcMargin"
            type="range"
            min="1"
            max="80"
            step="0.5"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 mt-2"
            @input="onMarginSliderChange"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
            Hoặc Tỷ lệ Markup (% trên vốn): <span class="text-indigo-600 dark:text-indigo-400 font-bold">{{ calcMarkup }}%</span>
          </label>
          <input
            v-model.number="calcMarkup"
            type="range"
            min="1"
            max="200"
            step="1"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 mt-2"
            @input="onMarkupSliderChange"
          />
        </div>

        <div class="bg-white dark:bg-gray-900 p-3 rounded-xl border border-blue-200 dark:border-gray-600 flex flex-col justify-center">
          <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Giá bán đề xuất:</span>
          <span class="text-lg font-extrabold text-blue-600 dark:text-blue-400">
            {{ formatCurrency(calcProposedPrice) }}
          </span>
          <span class="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
            Lợi nhuận: +{{ formatCurrency(calcProfit) }} ({{ calcMargin }}% Margin)
          </span>
        </div>
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <div class="relative min-w-[240px]">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm kiếm chính sách..."
            class="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500"
            @input="debouncedFetch"
          />
          <svg class="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <select
          v-model="selectedScope"
          class="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500"
          @change="fetchPolicies"
        >
          <option value="">Tất cả phạm vi</option>
          <option value="GLOBAL">Toàn hệ thống (GLOBAL)</option>
          <option value="CATEGORY">Theo danh mục</option>
          <option value="PRODUCT">Theo sản phẩm</option>
          <option value="CHANNEL">Theo kênh bán</option>
          <option value="TIER">Theo hạng khách hàng</option>
        </select>
      </div>

      <div class="text-xs text-gray-500 dark:text-gray-400 font-medium">
        Tổng cộng: <strong class="text-gray-800 dark:text-gray-200">{{ total }}</strong> chính sách
      </div>
    </div>

    <!-- Policies Table -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-gray-50/80 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 text-xs uppercase font-semibold">
              <th class="py-3 px-4">Tên chính sách</th>
              <th class="py-3 px-4">Phạm vi (Scope)</th>
              <th class="py-3 px-4 text-center">Margin mục tiêu</th>
              <th class="py-3 px-4 text-center">Markup</th>
              <th class="py-3 px-4 text-center">Sàn lãi (Floor)</th>
              <th class="py-3 px-4 text-center">Chiết khấu tối đa</th>
              <th class="py-3 px-4 text-center">Ưu tiên</th>
              <th class="py-3 px-4 text-center">Trạng thái</th>
              <th class="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-if="loading" class="animate-pulse">
              <td colspan="9" class="py-8 text-center text-gray-400">Đang tải dữ liệu...</td>
            </tr>
            <tr v-else-if="policies.length === 0">
              <td colspan="9" class="py-12 text-center text-gray-400">Chưa có chính sách giá nào</td>
            </tr>
            <tr
              v-for="policy in policies"
              :key="policy._id"
              class="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors"
            >
              <td class="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                <div>{{ policy.name }}</div>
                <div v-if="policy.reason" class="text-xs text-gray-400 font-normal mt-0.5">{{ policy.reason }}</div>
              </td>
              <td class="py-3.5 px-4">
                <span :class="scopeBadgeClass(policy.scope)" class="px-2.5 py-1 rounded-full text-xs font-semibold">
                  {{ scopeLabel(policy.scope) }}
                </span>
                <span v-if="policy.category" class="block text-xs text-gray-500 mt-1 font-medium">
                  {{ policy.category.name }}
                </span>
                <span v-else-if="policy.product" class="block text-xs text-gray-500 mt-1 font-medium">
                  {{ policy.product.name }}
                </span>
                <span v-else-if="policy.channel" class="block text-xs text-gray-500 mt-1 font-medium">
                  Kênh: {{ policy.channel }}
                </span>
                <span v-else-if="policy.customerTier" class="block text-xs text-gray-500 mt-1 font-medium">
                  Hạng: {{ policy.customerTier }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-center font-bold text-blue-600 dark:text-blue-400">
                {{ policy.targetMarginPercent }}%
              </td>
              <td class="py-3.5 px-4 text-center font-medium text-gray-600 dark:text-gray-300">
                {{ policy.markupPercent ? `${policy.markupPercent}%` : '-' }}
              </td>
              <td class="py-3.5 px-4 text-center font-bold text-amber-600 dark:text-amber-400">
                {{ policy.minMarginFloor }}%
              </td>
              <td class="py-3.5 px-4 text-center font-medium text-gray-600 dark:text-gray-300">
                {{ policy.maxDiscountPercent }}%
              </td>
              <td class="py-3.5 px-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300">
                {{ policy.priority }}
              </td>
              <td class="py-3.5 px-4 text-center">
                <span
                  :class="policy.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'"
                  class="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                >
                  {{ policy.status === 'ACTIVE' ? 'Đang áp dụng' : 'Tạm ngưng' }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Chỉnh sửa"
                    @click="editPolicy(policy)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Xóa"
                    @click="deletePolicy(policy)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Create / Edit Policy -->
    <div v-if="showCreateModal || editingPolicy" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {{ editingPolicy ? 'Chỉnh Sửa Chính Sách Giá' : 'Thêm Chính Sách Giá Mới' }}
        </h3>

        <form class="space-y-4" @submit.prevent="submitPolicy">
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tên chính sách *</label>
            <input
              v-model="formData.name"
              type="text"
              required
              placeholder="VD: Biên lãi mặc định sách thiếu nhi 25%"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Phạm vi áp dụng</label>
              <select
                v-model="formData.scope"
                class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="GLOBAL">Toàn hệ thống (GLOBAL)</option>
                <option value="CATEGORY">Theo danh mục</option>
                <option value="PRODUCT">Theo sản phẩm</option>
                <option value="CHANNEL">Theo kênh bán</option>
                <option value="TIER">Theo hạng khách hàng</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
              <select
                v-model="formData.status"
                class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">Hoạt động (Áp dụng)</option>
                <option value="INACTIVE">Ngưng áp dụng</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Biên lợi nhuận mục tiêu (Margin %) *
              </label>
              <input
                v-model.number="formData.targetMarginPercent"
                type="number"
                step="0.1"
                min="0"
                max="99.9"
                required
                class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Sàn lợi nhuận tối thiểu (Floor %) *
              </label>
              <input
                v-model.number="formData.minMarginFloor"
                type="number"
                step="0.1"
                min="0"
                max="99.9"
                required
                class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Chiết khấu tối đa (%)
              </label>
              <input
                v-model.number="formData.maxDiscountPercent"
                type="number"
                min="0"
                max="100"
                class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Độ ưu tiên (Số càng lớn ưu tiên càng cao)
              </label>
              <input
                v-model.number="formData.priority"
                type="number"
                class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Ghi chú / Căn cứ phê duyệt</label>
            <input
              v-model="formData.reason"
              type="text"
              placeholder="VD: Căn cứ phê duyệt của Chủ cửa hàng ngày 30/10/2026"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium"
              @click="closeModal"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl disabled:opacity-50"
            >
              {{ saving ? 'Đang lưu...' : 'Lưu chính sách' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { pricingService, type PricePolicy } from '@/services/pricing.service';

const toast = useToast();

const loading = ref(false);
const saving = ref(false);
const policies = ref<PricePolicy[]>([]);
const total = ref(0);
const searchQuery = ref('');
const selectedScope = ref('');

// Calculator state
const calcCost = ref<number>(80000);
const calcMargin = ref<number>(20);
const calcMarkup = ref<number>(25);
const calcProposedPrice = ref<number>(100000);
const calcProfit = ref<number>(20000);

// Modal state
const showCreateModal = ref(false);
const editingPolicy = ref<PricePolicy | null>(null);
const formData = ref({
  name: '',
  scope: 'GLOBAL' as const,
  targetMarginPercent: 20,
  minMarginFloor: 10,
  maxDiscountPercent: 20,
  priority: 10,
  status: 'ACTIVE' as const,
  reason: '',
});

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
}

function onMarginSliderChange() {
  if (calcMargin.value >= 100) calcMargin.value = 99;
  calcMarkup.value = Math.round((calcMargin.value / (100 - calcMargin.value)) * 10000) / 100;
  runCalculate();
}

function onMarkupSliderChange() {
  calcMargin.value = Math.round((calcMarkup.value / (100 + calcMarkup.value)) * 10000) / 100;
  runCalculate();
}

function runCalculate() {
  if (!calcCost.value || calcCost.value <= 0) {
    calcProposedPrice.value = 0;
    calcProfit.value = 0;
    return;
  }
  const proposed = Math.round(calcCost.value / (1 - calcMargin.value / 100));
  calcProposedPrice.value = proposed;
  calcProfit.value = proposed - calcCost.value;
}

function scopeLabel(scope: string): string {
  switch (scope) {
    case 'GLOBAL': return 'Toàn shop';
    case 'CATEGORY': return 'Danh mục';
    case 'PRODUCT': return 'Sản phẩm';
    case 'CHANNEL': return 'Kênh bán';
    case 'TIER': return 'Hạng khách';
    default: return scope;
  }
}

function scopeBadgeClass(scope: string): string {
  switch (scope) {
    case 'GLOBAL': return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200';
    case 'CATEGORY': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200';
    case 'PRODUCT': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200';
    case 'CHANNEL': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200';
    case 'TIER': return 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border border-pink-200';
    default: return 'bg-gray-100 text-gray-700';
  }
}

async function fetchPolicies() {
  loading.value = true;
  try {
    const res = await pricingService.getPolicies({
      search: searchQuery.value || undefined,
      scope: selectedScope.value || undefined,
    });
    policies.value = res.data || [];
    total.value = res.total || 0;
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Không thể tải danh sách chính sách giá');
  } finally {
    loading.value = false;
  }
}

let debounceTimer: any = null;
function debouncedFetch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchPolicies, 300);
}

function editPolicy(policy: PricePolicy) {
  editingPolicy.value = policy;
  formData.value = {
    name: policy.name,
    scope: policy.scope as any,
    targetMarginPercent: policy.targetMarginPercent,
    minMarginFloor: policy.minMarginFloor,
    maxDiscountPercent: policy.maxDiscountPercent,
    priority: policy.priority,
    status: policy.status as any,
    reason: policy.reason || '',
  };
}

function closeModal() {
  showCreateModal.value = false;
  editingPolicy.value = null;
  formData.value = {
    name: '',
    scope: 'GLOBAL',
    targetMarginPercent: 20,
    minMarginFloor: 10,
    maxDiscountPercent: 20,
    priority: 10,
    status: 'ACTIVE',
    reason: '',
  };
}

async function submitPolicy() {
  saving.value = true;
  try {
    if (editingPolicy.value) {
      await pricingService.updatePolicy(editingPolicy.value._id, formData.value);
      toast.success('Cập nhật chính sách giá thành công');
    } else {
      await pricingService.createPolicy(formData.value);
      toast.success('Tạo chính sách giá thành công');
    }
    closeModal();
    fetchPolicies();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu chính sách giá');
  } finally {
    saving.value = false;
  }
}

async function deletePolicy(policy: PricePolicy) {
  if (!confirm(`Bạn có chắc muốn xóa chính sách giá "${policy.name}"?`)) return;
  try {
    await pricingService.deletePolicy(policy._id);
    toast.success('Đã xóa chính sách giá');
    fetchPolicies();
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Không thể xóa chính sách giá');
  }
}

onMounted(() => {
  runCalculate();
  fetchPolicies();
});
</script>
