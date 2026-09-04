<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="space-y-1">
        <h2 class="text-lg font-extrabold text-slate-900">Báo cáo & Thống kê doanh thu</h2>
        <p class="text-xs text-slate-500 font-medium">Theo dõi dữ liệu kinh doanh, tăng trưởng doanh số thực tế và cơ cấu doanh thu theo danh mục.</p>
      </div>

      <!-- Quick Range Filter Buttons (FE-02) -->
      <div class="inline-flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
        <button
          v-for="preset in rangePresets"
          :key="preset.value"
          @click="selectPreset(preset.value)"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all',
            selectedRange === preset.value
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>

    <!-- Error Alert with Retry -->
    <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between text-xs text-red-700">
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>{{ errorMessage }}</span>
      </div>
      <button
        @click="loadAllReports"
        class="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors"
      >
        Thử lại
      </button>
    </div>

    <!-- Date Range Picker & KPI Cards Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      <!-- Date Picker Card -->
      <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Khoảng ngày tùy chọn</h3>
          <span v-if="selectedRange !== 'custom'" class="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">Đang lọc nhanh</span>
        </div>
        <div class="space-y-3">
          <div>
            <label class="text-[11px] font-bold text-slate-700">Từ ngày</label>
            <input
              v-model="startDate"
              type="date"
              @change="onCustomDateChange"
              class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label class="text-[11px] font-bold text-slate-700">Đến ngày</label>
            <input
              v-model="endDate"
              type="date"
              @change="onCustomDateChange"
              class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            @click="applyCustomDateFilter"
            class="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-xs uppercase tracking-wider shadow-md shadow-blue-500/20"
          >
            Lọc theo ngày
          </button>
        </div>
      </div>

      <!-- Real Dynamic KPI Cards with Actual Growth (FE-02) -->
      <div class="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <!-- Revenue Card -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng doanh thu kỳ lọc</span>
              <!-- Real dynamic growth rate badge -->
              <span
                v-if="summaryKpis && summaryKpis.revenueGrowthRate !== null && summaryKpis.revenueGrowthRate !== undefined"
                :class="[
                  'text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1',
                  summaryKpis.revenueGrowthRate >= 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                ]"
              >
                <span>{{ summaryKpis.revenueGrowthRate >= 0 ? '↑ +' : '↓ ' }}{{ summaryKpis.revenueGrowthRate }}%</span>
              </span>
              <span v-else class="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                Kỳ trước: N/A
              </span>
            </div>
            <div v-if="loading" class="h-8 bg-slate-100 rounded-lg w-3/4 mt-3 animate-pulse"></div>
            <p v-else class="text-2xl font-black text-blue-700 mt-2">{{ formatCurrency(totalRevenue) }}</p>
          </div>
          <p class="text-[11px] text-slate-400 font-medium mt-3">Đã khấu trừ hoàn trả và đơn hủy</p>
        </div>

        <!-- Orders Count Card -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Đơn hàng thành công</span>
              <!-- Real dynamic growth rate badge -->
              <span
                v-if="summaryKpis && summaryKpis.ordersGrowthRate !== null && summaryKpis.ordersGrowthRate !== undefined"
                :class="[
                  'text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1',
                  summaryKpis.ordersGrowthRate >= 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                ]"
              >
                <span>{{ summaryKpis.ordersGrowthRate >= 0 ? '↑ +' : '↓ ' }}{{ summaryKpis.ordersGrowthRate }}%</span>
              </span>
              <span v-else class="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                Kỳ trước: N/A
              </span>
            </div>
            <div v-if="loading" class="h-8 bg-slate-100 rounded-lg w-1/2 mt-3 animate-pulse"></div>
            <p v-else class="text-2xl font-black text-slate-800 mt-2">{{ totalOrdersCount }}</p>
          </div>
          <p class="text-[11px] text-slate-400 font-medium mt-3">AOV ước tính: {{ formatCurrency(estimatedAov) }}</p>
        </div>

        <!-- Total Discount Card -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div>
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng voucher & giảm giá</span>
            <div v-if="loading" class="h-8 bg-slate-100 rounded-lg w-2/3 mt-3 animate-pulse"></div>
            <p v-else class="text-2xl font-black text-red-600 mt-2">{{ formatCurrency(totalDiscount) }}</p>
          </div>
          <p class="text-[11px] text-slate-400 font-medium mt-3">Tiết kiệm cho khách hàng</p>
        </div>
      </div>
    </div>

    <!-- Category Revenue Breakdown (FE-02 Integration) -->
    <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 class="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Cơ cấu doanh thu theo danh mục sản phẩm</h3>
          <p class="text-[11px] text-slate-400 font-medium">Tính toán từ chi tiết các sản phẩm trong đơn hàng thành công (không hardcode).</p>
        </div>
        <span class="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
          {{ categoryRevenueList.length }} danh mục có phát sinh
        </span>
      </div>

      <div v-if="loading" class="p-6 space-y-3">
        <div v-for="n in 3" :key="n" class="h-10 bg-slate-100 rounded-xl animate-pulse"></div>
      </div>

      <div v-else-if="categoryRevenueList.length === 0" class="py-8 text-center text-slate-400 text-xs font-medium">
        Chưa có phát sinh doanh thu danh mục trong kỳ thống kê.
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="cat in categoryRevenueList"
          :key="cat.category"
          class="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between hover:border-blue-300 transition-colors"
        >
          <div class="min-w-0 pr-3">
            <p class="text-xs font-bold text-slate-800 truncate">{{ cat.category || 'Chưa phân loại' }}</p>
            <p class="text-[10px] text-slate-400 font-medium mt-0.5">Tỷ trọng: {{ calculateShare(cat.revenue) }}%</p>
          </div>
          <div class="text-right flex-shrink-0">
            <span class="text-sm font-black text-slate-900">{{ formatCurrency(cat.revenue) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Daily Breakdown Table -->
    <div class="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
      <div class="bg-slate-50 border-b border-slate-150 py-4 px-6 flex items-center justify-between">
        <h3 class="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Chi tiết doanh thu theo ngày</h3>
        <span class="text-xs font-bold text-slate-500">{{ reportData.length }} ngày ghi nhận</span>
      </div>

      <!-- Loading Skeleton -->
      <div v-if="loading" class="p-8 space-y-4">
        <div v-for="n in 4" :key="n" class="h-12 bg-slate-100 rounded-xl w-full animate-pulse"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="reportData.length === 0" class="p-16 text-center space-y-3">
        <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-xl">
          📊
        </div>
        <p class="text-sm font-bold text-slate-700">Không có dữ liệu đơn hàng</p>
        <p class="text-xs text-slate-400 font-medium">Không tìm thấy đơn hàng thành công nào trong khoảng thời gian đã chọn.</p>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-150 bg-slate-50/50">
              <th class="py-4 px-6">Ngày</th>
              <th class="py-4 px-6">Số lượng đơn hàng</th>
              <th class="py-4 px-6">Doanh thu tạm tính</th>
              <th class="py-4 px-6">Đã giảm giá</th>
              <th class="py-4 px-6">Doanh thu thực tế</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
            <tr v-for="row in reportData" :key="row._id" class="hover:bg-slate-50/50 transition-colors">
              <td class="py-4 px-6 font-bold text-slate-900">{{ row._id }}</td>
              <td class="py-4 px-6 font-bold text-slate-800">{{ row.count }}</td>
              <td class="py-4 px-6">{{ formatCurrency(row.subtotal) }}</td>
              <td class="py-4 px-6 text-red-500 font-semibold">-{{ formatCurrency(row.discount) }}</td>
              <td class="py-4 px-6 font-black text-blue-700">{{ formatCurrency(row.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { reportService } from '@/services/report.service'
import { formatCurrency } from '@/utils/helpers'

const toast = useToast()

const reportData = ref<any[]>([])
const categoryRevenueList = ref<{ category: string; revenue: number }[]>([])
const summaryKpis = ref<any>(null)

const loading = ref(true)
const errorMessage = ref('')

type RangeOption = 'day' | 'week' | 'month' | 'year' | 'custom'
const selectedRange = ref<RangeOption>('month')

const rangePresets: { label: string; value: 'day' | 'week' | 'month' | 'year' }[] = [
  { label: 'Hôm nay', value: 'day' },
  { label: '7 ngày qua', value: 'week' },
  { label: 'Tháng này', value: 'month' },
  { label: 'Năm nay', value: 'year' },
]

const startDate = ref('')
const endDate = ref('')

function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function updateDateRangeByPreset(preset: 'day' | 'week' | 'month' | 'year') {
  const now = new Date()
  const end = new Date(now)
  let start = new Date(now)

  if (preset === 'day') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (preset === 'week') {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (preset === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (preset === 'year') {
    start = new Date(now.getFullYear(), 0, 1)
  }

  startDate.value = getLocalDateString(start)
  endDate.value = getLocalDateString(end)
}

function selectPreset(preset: 'day' | 'week' | 'month' | 'year') {
  selectedRange.value = preset
  updateDateRangeByPreset(preset)
  loadAllReports()
}

function onCustomDateChange() {
  selectedRange.value = 'custom'
}

function applyCustomDateFilter() {
  selectedRange.value = 'custom'
  loadAllReports()
}

async function loadAllReports() {
  loading.value = true
  errorMessage.value = ''

  try {
    const rangeParam = selectedRange.value !== 'custom' ? selectedRange.value : undefined

    const [revenueRes, summaryRes, catRes] = await Promise.all([
      reportService.getRevenue(startDate.value, endDate.value),
      reportService.getSummary(rangeParam),
      reportService.getCategoryRevenue().catch(() => ({ data: [] })),
    ])

    reportData.value = revenueRes.data || []
    if (summaryRes?.data?.kpis) {
      summaryKpis.value = summaryRes.data.kpis
    }
    categoryRevenueList.value = catRes?.data || summaryRes?.data?.categoryRevenue || []
  } catch (err: any) {
    errorMessage.value = 'Lỗi khi tải dữ liệu báo cáo từ máy chủ. Vui lòng thử lại!'
    toast.error('Lỗi khi tải báo cáo doanh thu')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  updateDateRangeByPreset('month')
  loadAllReports()
})

const totalRevenue = computed(() => {
  return reportData.value.reduce((sum, row) => sum + (row.total || 0), 0)
})

const totalOrdersCount = computed(() => {
  return reportData.value.reduce((sum, row) => sum + (row.count || 0), 0)
})

const totalDiscount = computed(() => {
  return reportData.value.reduce((sum, row) => sum + (row.discount || 0), 0)
})

const estimatedAov = computed(() => {
  if (totalOrdersCount.value === 0) return 0
  return Math.round(totalRevenue.value / totalOrdersCount.value)
})

function calculateShare(revenue: number): string {
  if (!totalRevenue.value || totalRevenue.value <= 0) return '0.0'
  return ((revenue / totalRevenue.value) * 100).toFixed(1)
}
</script>
