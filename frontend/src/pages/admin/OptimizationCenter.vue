<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
      <div>
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">⚡</span>
          <h1 class="text-xl font-black text-slate-900 tracking-tight">Tối Ưu Hóa & Tăng Trưởng (Release R4)</h1>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-700">
            OPT-01 · OPT-02 · TRK-03 · MKT-03
          </span>
        </div>
        <p class="text-xs text-slate-500 font-medium mt-1">
          A/B testing, thuật toán gợi ý sản phẩm thường mua cùng, cảnh báo hàng về cho Wishlist và phễu chuyển đổi thực thu
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="activeTab === 'ab_testing'"
          class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          @click="openCreateExperimentModal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>+ Tạo Thử Nghiệm A/B</span>
        </button>

        <button
          class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          @click="refreshActiveTab"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span>Làm mới</span>
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-slate-200 gap-6 text-xs font-bold text-slate-500">
      <button
        class="pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2"
        :class="activeTab === 'ab_testing' ? 'border-[#dc2626] text-[#dc2626]' : 'border-transparent hover:text-slate-800'"
        @click="activeTab = 'ab_testing'"
      >
        <span>🧪 Thử Nghiệm A/B (OPT-01)</span>
      </button>

      <button
        class="pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2"
        :class="activeTab === 'recommendations' ? 'border-[#dc2626] text-[#dc2626]' : 'border-transparent hover:text-slate-800'"
        @click="activeTab = 'recommendations'"
      >
        <span>💡 Gợi Ý Thường Mua Cùng (MBA)</span>
      </button>

      <button
        class="pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2"
        :class="activeTab === 'remarketing' ? 'border-[#dc2626] text-[#dc2626]' : 'border-transparent hover:text-slate-800'"
        @click="activeTab = 'remarketing'"
      >
        <span>🔔 Cảnh Báo Wishlist & Remarketing (OPT-02)</span>
      </button>

      <button
        class="pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2"
        :class="activeTab === 'funnel' ? 'border-[#dc2626] text-[#dc2626]' : 'border-transparent hover:text-slate-800'"
        @click="activeTab = 'funnel'"
      >
        <span>📊 Phễu Chuyển Đổi & Doanh Thu Thực (TRK-03/MKT-03)</span>
      </button>
    </div>

    <!-- Tab 1: A/B Testing -->
    <div v-if="activeTab === 'ab_testing'" class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-100 p-4 overflow-x-auto shadow-xs">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider">
              <th class="py-3 px-4">Tên & Key</th>
              <th class="py-3 px-4">Trạng Thái</th>
              <th class="py-3 px-4">Biến Thể (Weights)</th>
              <th class="py-3 px-4 text-center">Lượt Xem</th>
              <th class="py-3 px-4 text-center">Chuyển Đổi</th>
              <th class="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="experiments.length === 0">
              <td colspan="6" class="text-center py-8 text-slate-400 font-medium">
                Chưa có thử nghiệm A/B nào. Hãy tạo thử nghiệm đầu tiên!
              </td>
            </tr>
            <tr v-for="exp in experiments" :key="exp._id" class="hover:bg-slate-50/60 transition-colors">
              <td class="py-3 px-4">
                <div class="font-bold text-slate-900">{{ exp.name }}</div>
                <div class="text-[11px] font-mono text-slate-400">{{ exp.key }}</div>
              </td>
              <td class="py-3 px-4">
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide"
                  :class="{
                    'bg-green-100 text-green-700': exp.status === 'RUNNING',
                    'bg-amber-100 text-amber-700': exp.status === 'PAUSED',
                    'bg-slate-100 text-slate-600': exp.status === 'DRAFT',
                    'bg-blue-100 text-blue-700': exp.status === 'COMPLETED',
                  }"
                >
                  {{ exp.status }}
                </span>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span
                    v-for="v in exp.variants"
                    :key="v.key"
                    class="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-mono"
                  >
                    {{ v.key }} ({{ v.weight }}%)
                  </span>
                </div>
              </td>
              <td class="py-3 px-4 text-center font-bold text-slate-700">
                {{ getTotalImpressions(exp) }}
              </td>
              <td class="py-3 px-4 text-center font-bold text-slate-700">
                {{ getTotalConversions(exp) }}
              </td>
              <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    class="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                    @click="viewExperimentResults(exp)"
                  >
                    Xem Kết Quả
                  </button>
                  <button
                    v-if="exp.status === 'DRAFT' || exp.status === 'PAUSED'"
                    class="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors cursor-pointer"
                    @click="toggleExperimentStatus(exp, 'RUNNING')"
                  >
                    Bắt Đầu
                  </button>
                  <button
                    v-else-if="exp.status === 'RUNNING'"
                    class="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                    @click="toggleExperimentStatus(exp, 'PAUSED')"
                  >
                    Tạm Dừng
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 2: Recommendations Sandbox -->
    <div v-if="activeTab === 'recommendations'" class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
        <div>
          <h2 class="text-sm font-black text-slate-900">Sandbox Kiểm Tra Thuật Toán Gợi Ý Sản Phẩm</h2>
          <p class="text-xs text-slate-500 mt-1">
            Nhập ID sản phẩm hoặc chọn sản phẩm để xem trước danh sách "Thường mua cùng nhau" (Market Basket Analysis) và "Sản phẩm tương tự"
          </p>
        </div>

        <div class="flex gap-3">
          <input
            v-model="previewProductId"
            type="text"
            placeholder="Nhập ID sản phẩm (vd: 6743b1...)..."
            class="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626]"
          />
          <button
            class="px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
            @click="fetchPreviewRecommendations"
          >
            Chạy Thử
          </button>
        </div>

        <!-- Results Display -->
        <div v-if="previewResults" class="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-3">
            <h3 class="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span>🛒</span>
              <span>Thường Mua Cùng (Co-occurrence) ({{ previewResults.frequentlyBoughtTogether?.length || 0 }})</span>
            </h3>
            <div class="space-y-2">
              <div
                v-for="item in previewResults.frequentlyBoughtTogether"
                :key="item._id"
                class="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
              >
                <div>
                  <div class="font-bold text-slate-900">{{ item.name }}</div>
                  <div class="text-[10px] text-slate-400">SKU: {{ item.sku }} · Giá: {{ formatVnd(item.price) }}</div>
                </div>
                <span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {{ item.recommendationReason }}
                </span>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span>🔗</span>
              <span>Sản Phẩm Tương Tự (Related) ({{ previewResults.related?.length || 0 }})</span>
            </h3>
            <div class="space-y-2">
              <div
                v-for="item in previewResults.related"
                :key="item._id"
                class="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
              >
                <div>
                  <div class="font-bold text-slate-900">{{ item.name }}</div>
                  <div class="text-[10px] text-slate-400">SKU: {{ item.sku }} · Giá: {{ formatVnd(item.price) }}</div>
                </div>
                <span class="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {{ item.recommendationReason }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 3: Wishlist Restock & Remarketing -->
    <div v-if="activeTab === 'remarketing'" class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <div class="text-[11px] font-bold text-slate-400 uppercase">Tổng Thông Báo Gửi</div>
          <div class="text-xl font-black text-slate-900 mt-1">{{ remarketingStats.totalDispatched || 0 }}</div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <div class="text-[11px] font-bold text-slate-400 uppercase">Hàng Về (Wishlist Restock)</div>
          <div class="text-xl font-black text-green-600 mt-1">{{ remarketingStats.byType?.restock || 0 }}</div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <div class="text-[11px] font-bold text-slate-400 uppercase">Giảm Giá (Price Drop)</div>
          <div class="text-xl font-black text-blue-600 mt-1">{{ remarketingStats.byType?.priceDrop || 0 }}</div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <div class="text-[11px] font-bold text-slate-400 uppercase">Giỏ Bỏ Quên (7-Day Capped)</div>
          <div class="text-xl font-black text-amber-600 mt-1">{{ remarketingStats.byType?.abandonedCart || 0 }}</div>
        </div>
      </div>

      <!-- Action Panel -->
      <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
        <h2 class="text-sm font-black text-slate-900">Kích Hoạt Chiến Dịch Remarketing Tuân Thủ Quy Định</h2>
        <p class="text-xs text-slate-500">
          Chỉ gửi cho khách hàng đã có tương tác thật. Tự động áp dụng giới hạn tần suất nghiêm ngặt (Frequency Cap: tối đa 1 thông điệp mỗi 7 ngày cho giỏ hàng, 1 thông điệp mỗi 24h cho hàng về) để chống spam.
        </p>

        <div class="flex flex-wrap gap-3">
          <button
            class="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            @click="triggerAbandonedCartsScan"
          >
            <span>🛒 Quét & Nhắc Giỏ Hàng Bỏ Quên</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Tab 4: Conversion Funnel & Realized Revenue -->
    <div v-if="activeTab === 'funnel'" class="space-y-6">
      <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
        <div>
          <h2 class="text-sm font-black text-slate-900">Phễu Chuyển Đổi & Doanh Thu Đặt Hàng vs Thực Thu (TRK-03)</h2>
          <p class="text-xs text-slate-500 mt-1">
            Tách biệt rõ ràng giữa Doanh số đặt hàng tạm tính (Gross Placed) và Doanh thu thực nhận sau khi đơn được thanh toán/giao thành công (Net Realized)
          </p>
        </div>

        <!-- Funnel Step Visualizer -->
        <div class="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <div class="text-[11px] font-bold text-slate-400 uppercase">1. Lượt Xem Trang</div>
            <div class="text-lg font-black text-slate-800 mt-1">{{ funnelData.pageViews || 0 }}</div>
          </div>
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <div class="text-[11px] font-bold text-slate-400 uppercase">2. Xem Sản Phẩm</div>
            <div class="text-lg font-black text-slate-800 mt-1">{{ funnelData.productViews || 0 }}</div>
          </div>
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <div class="text-[11px] font-bold text-slate-400 uppercase">3. Thêm Vào Giỏ</div>
            <div class="text-lg font-black text-slate-800 mt-1">{{ funnelData.addToCart || 0 }}</div>
          </div>
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <div class="text-[11px] font-bold text-slate-400 uppercase">4. Vào Checkout</div>
            <div class="text-lg font-black text-slate-800 mt-1">{{ funnelData.initiateCheckout || 0 }}</div>
          </div>
          <div class="p-4 rounded-xl bg-blue-50 border border-blue-100 text-center">
            <div class="text-[11px] font-bold text-blue-600 uppercase">5. Đơn Đặt (Placed)</div>
            <div class="text-lg font-black text-blue-700 mt-1">{{ funnelData.ordersPlaced || 0 }}</div>
            <div class="text-[10px] text-blue-500 font-bold">{{ formatVnd(funnelData.grossRevenuePlaced) }}</div>
          </div>
          <div class="p-4 rounded-xl bg-green-50 border border-green-100 text-center">
            <div class="text-[11px] font-bold text-green-600 uppercase">6. Thực Thu (Realized)</div>
            <div class="text-lg font-black text-green-700 mt-1">{{ funnelData.ordersRealized || 0 }}</div>
            <div class="text-[10px] text-green-600 font-bold">{{ formatVnd(funnelData.netRevenueRealized) }}</div>
          </div>
        </div>

        <!-- Rates -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div class="p-3 bg-slate-50 rounded-xl">
            <div class="text-xs text-slate-500 font-medium">Tỷ lệ Chuyển Đổi (Khách → Đơn)</div>
            <div class="text-lg font-black text-slate-800 mt-0.5">{{ funnelData.visitorToOrderRate || 0 }}%</div>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl">
            <div class="text-xs text-slate-500 font-medium">Tỷ lệ Hoàn Tất Checkout</div>
            <div class="text-lg font-black text-slate-800 mt-0.5">{{ funnelData.checkoutToOrderRate || 0 }}%</div>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl">
            <div class="text-xs text-slate-500 font-medium">Tỷ lệ Thực Thu (Realization Rate)</div>
            <div class="text-lg font-black text-green-600 mt-0.5">{{ funnelData.realizationRate || 0 }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Xem Kết Quả Thử Nghiệm -->
    <div v-if="selectedExperimentResults" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 class="text-base font-black text-slate-900">{{ selectedExperimentResults.name }}</h3>
            <p class="text-xs font-mono text-slate-400">{{ selectedExperimentResults.key }}</p>
          </div>
          <button class="text-slate-400 hover:text-slate-600 cursor-pointer" @click="selectedExperimentResults = null">
            ✕
          </button>
        </div>

        <!-- Variants Comparison Table -->
        <table class="w-full text-xs text-left">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 font-bold">
              <th class="py-2">Biến Thể</th>
              <th class="py-2 text-center">Lượt Xem</th>
              <th class="py-2 text-center">Chuyển Đổi</th>
              <th class="py-2 text-center">Tỷ Lệ (CR)</th>
              <th class="py-2 text-right">Uplift vs Control</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="v in selectedExperimentResults.variants" :key="v.key">
              <td class="py-2.5 font-bold text-slate-800">
                {{ v.name }} <span class="font-mono text-slate-400 text-[10px]">({{ v.key }})</span>
              </td>
              <td class="py-2.5 text-center">{{ v.impressions }}</td>
              <td class="py-2.5 text-center">{{ v.conversions }}</td>
              <td class="py-2.5 text-center font-bold text-slate-900">{{ v.conversionRate }}%</td>
              <td class="py-2.5 text-right font-black" :class="v.upliftVsControl >= 0 ? 'text-green-600' : 'text-red-500'">
                {{ v.upliftVsControl > 0 ? '+' : '' }}{{ v.upliftVsControl }}%
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex justify-end pt-4 border-t border-slate-100">
          <button
            class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            @click="selectedExperimentResults = null"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/utils/api';
import { useToast } from 'vue-toastification';

const toast = useToast();
const activeTab = ref<'ab_testing' | 'recommendations' | 'remarketing' | 'funnel'>('ab_testing');

// A/B Testing Data
const experiments = ref<any[]>([]);
const selectedExperimentResults = ref<any>(null);

// Recommendations Sandbox Data
const previewProductId = ref('');
const previewResults = ref<any>(null);

// Remarketing Stats
const remarketingStats = ref<any>({});

// Funnel Data
const funnelData = ref<any>({});

function formatVnd(val?: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

function getTotalImpressions(exp: any) {
  if (!exp?.metrics?.impressions) return 0;
  return Object.values(exp.metrics.impressions).reduce((sum: any, val: any) => sum + (Number(val) || 0), 0);
}

function getTotalConversions(exp: any) {
  if (!exp?.metrics?.conversions) return 0;
  return Object.values(exp.metrics.conversions).reduce((sum: any, val: any) => sum + (Number(val) || 0), 0);
}

async function fetchExperiments() {
  try {
    const res = await api.get('/marketing/ab-testing');
    experiments.value = res.data || [];
  } catch {
    experiments.value = [];
  }
}

async function viewExperimentResults(exp: any) {
  try {
    const res = await api.get(`/marketing/ab-testing/${exp._id}/results`);
    selectedExperimentResults.value = res.data;
  } catch (err: any) {
    toast.error('Không thể tải kết quả thử nghiệm');
  }
}

async function toggleExperimentStatus(exp: any, newStatus: string) {
  try {
    await api.patch(`/marketing/ab-testing/${exp._id}`, { status: newStatus });
    toast.success(`Đã chuyển trạng thái thử nghiệm sang ${newStatus}`);
    await fetchExperiments();
  } catch (err: any) {
    toast.error('Lỗi khi cập nhật trạng thái thử nghiệm');
  }
}

function openCreateExperimentModal() {
  toast.info('Vui lòng sử dụng API hoặc tạo mẫu mặc định để kích hoạt thử nghiệm mới');
}

async function fetchPreviewRecommendations() {
  if (!previewProductId.value.trim()) {
    toast.warning('Vui lòng nhập ID sản phẩm hợp lệ');
    return;
  }
  try {
    const res = await api.get(`/marketing/recommendations/product/${previewProductId.value.trim()}`);
    previewResults.value = res.data;
  } catch {
    toast.error('Không tìm thấy gợi ý cho sản phẩm này');
  }
}

async function fetchRemarketingStats() {
  try {
    const res = await api.get('/marketing/remarketing/analytics');
    remarketingStats.value = res.data || {};
  } catch {
    remarketingStats.value = {};
  }
}

async function triggerAbandonedCartsScan() {
  try {
    const res = await api.post('/marketing/remarketing/abandoned-carts', {
      minInactiveMinutes: 120,
      maxInactiveHours: 48,
    });
    toast.success(`Đã quét ${res.data?.cartsScanned || 0} giỏ hàng. Gửi thành công ${res.data?.notifiedCount || 0} thông báo!`);
    await fetchRemarketingStats();
  } catch (err: any) {
    toast.error('Lỗi khi kích hoạt remarketing');
  }
}

async function fetchFunnel() {
  try {
    const res = await api.get('/marketing/events/funnel');
    funnelData.value = res.data || {};
  } catch {
    funnelData.value = {};
  }
}

function refreshActiveTab() {
  if (activeTab.value === 'ab_testing') fetchExperiments();
  else if (activeTab.value === 'remarketing') fetchRemarketingStats();
  else if (activeTab.value === 'funnel') fetchFunnel();
}

onMounted(() => {
  fetchExperiments();
  fetchRemarketingStats();
  fetchFunnel();
});
</script>
