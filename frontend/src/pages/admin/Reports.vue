<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-1">
      <h2 class="text-lg font-extrabold text-slate-900">Báo cáo & Thống kê doanh thu</h2>
      <p class="text-xs text-slate-500 font-medium">Theo dõi dữ liệu doanh số bán hàng, phí vận chuyển và số lượng đơn hàng theo khoảng thời gian.</p>
    </div>

    <!-- Date Range Picker & Aggregated stats -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      <!-- Picker -->
      <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Chọn khoảng thời gian</h3>
        <div class="space-y-3">
          <div>
            <label class="text-xs font-bold text-slate-700">Từ ngày</label>
            <input
              v-model="startDate"
              type="date"
              class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label class="text-xs font-bold text-slate-700">Đến ngày</label>
            <input
              v-model="endDate"
              type="date"
              class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            @click="fetchRevenueReport"
            class="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 px-6 rounded-xl transition-colors text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20"
          >
            Lọc báo cáo
          </button>
        </div>
      </div>

      <!-- Aggregated Cards -->
      <div class="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng doanh thu kỳ lọc</span>
          <p class="text-2xl font-black text-blue-700 mt-2">{{ formatCurrency(totalRevenue) }}</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng số đơn hàng thành công</span>
          <p class="text-2xl font-black text-slate-800 mt-2">{{ totalOrdersCount }}</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng giảm giá đã tặng</span>
          <p class="text-2xl font-black text-red-600 mt-2">{{ formatCurrency(totalDiscount) }}</p>
        </div>
      </div>
    </div>

    <!-- Daily Breakdown Table -->
    <div class="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
      <div class="bg-slate-50 border-b border-slate-150 py-4 px-6">
        <h3 class="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Chi tiết doanh thu theo ngày</h3>
      </div>

      <div v-if="loading" class="p-8 animate-pulse space-y-4">
        <div v-for="n in 3" :key="n" class="h-12 bg-slate-100 rounded-xl w-full"></div>
      </div>

      <div v-else-if="reportData.length === 0" class="p-16 text-center text-slate-400 font-medium">
        Không có dữ liệu đơn hàng thành công trong khoảng thời gian đã chọn.
      </div>

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
            <tr v-for="row in reportData" :key="row._id" class="hover:bg-slate-50/30">
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
const loading = ref(true)

const startDate = ref('')
const endDate = ref('')

function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

onMounted(() => {
  // Set default to last 30 days
  const end = new Date()
  const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  startDate.value = getLocalDateString(start)
  endDate.value = getLocalDateString(end)
  
  fetchRevenueReport()
})

async function fetchRevenueReport() {
  loading.value = true
  try {
    const res = await reportService.getRevenue(startDate.value, endDate.value)
    reportData.value = res.data
  } catch (err) {
    toast.error('Lỗi khi tải báo cáo doanh thu')
  } finally {
    loading.value = false
  }
}

const totalRevenue = computed(() => {
  return reportData.value.reduce((sum, row) => sum + (row.total || 0), 0)
})

const totalOrdersCount = computed(() => {
  return reportData.value.reduce((sum, row) => sum + (row.count || 0), 0)
})

const totalDiscount = computed(() => {
  return reportData.value.reduce((sum, row) => sum + (row.discount || 0), 0)
})
</script>
