<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
      <div>
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">🎯</span>
          <h1 class="text-xl font-black text-slate-900 tracking-tight">Chiến Dịch Marketing</h1>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-700">
            {{ total }} chiến dịch
          </span>
        </div>
        <p class="text-xs text-slate-500 font-medium mt-1">
          Lập kế hoạch, quản lý vòng đời, ngân sách và theo dõi hiệu quả chuyển đổi đơn hàng
        </p>
      </div>

      <button
        class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        @click="openCreateModal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span>+ Tạo Chiến Dịch Mới</span>
      </button>
    </div>

    <!-- Filters & Search Bar -->
    <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
      <div class="flex flex-col sm:flex-row items-center gap-3">
        <!-- Search Input -->
        <div class="relative flex-1 w-full">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm theo tên, mã chiến dịch hoặc mô tả..."
            class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626] transition-all bg-white"
            @keyup.enter="fetchCampaigns"
          />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>

        <!-- Filter Status -->
        <select
          v-model="filterStatus"
          class="w-full sm:w-48 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626] cursor-pointer"
          @change="fetchCampaigns"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp (DRAFT)</option>
          <option value="IN_REVIEW">Chờ duyệt (IN_REVIEW)</option>
          <option value="APPROVED">Đã duyệt (APPROVED)</option>
          <option value="ACTIVE">Đang chạy (ACTIVE)</option>
          <option value="PAUSED">Tạm dừng (PAUSED)</option>
          <option value="EXPIRED">Đã kết thúc (EXPIRED)</option>
        </select>

        <!-- Filter Objective -->
        <select
          v-model="filterObjective"
          class="w-full sm:w-48 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626] cursor-pointer"
          @change="fetchCampaigns"
        >
          <option value="">Tất cả mục tiêu</option>
          <option value="CONVERSION">Chuyển đổi đơn hàng</option>
          <option value="TRAFFIC">Tăng lượng truy cập</option>
          <option value="AWARENESS">Nhận diện thương hiệu</option>
          <option value="SEASONAL">Mùa vụ / Tựu trường</option>
          <option value="CLEARANCE">Xả hàng tồn kho</option>
          <option value="REORDER">Mua lại / Khách cũ</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-xs">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#dc2626]"></div>
      <p class="text-xs text-slate-500 font-semibold mt-3">Đang tải danh sách chiến dịch...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="campaigns.length === 0" class="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-xs">
      <div class="text-5xl mb-3">🎯</div>
      <h3 class="text-base font-extrabold text-slate-800">Chưa có chiến dịch marketing nào</h3>
      <p class="text-xs text-slate-400 mt-1 font-medium">Bắt đầu tạo chiến dịch đầu tiên để kết nối khuyến mãi, banner và tracking</p>
      <button
        class="mt-4 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-extrabold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
        @click="openCreateModal"
      >
        + Tạo chiến dịch đầu tiên
      </button>
    </div>

    <!-- Campaign Cards Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="camp in campaigns"
        :key="camp._id"
        class="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
      >
        <!-- Card Header -->
        <div class="p-5 border-b border-slate-50 space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-black px-2 py-0.5 rounded bg-slate-100 text-slate-800 tracking-wider">
                  {{ camp.code }}
                </span>
                <span
                  class="text-[10px] font-black px-2 py-0.5 rounded-full"
                  :class="getStatusClass(camp.status)"
                >
                  {{ getStatusLabel(camp.status) }}
                </span>
              </div>
              <h2 class="text-sm font-extrabold text-slate-900 mt-1.5 line-clamp-1" :title="camp.name">
                {{ camp.name }}
              </h2>
            </div>

            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 whitespace-nowrap">
              {{ getObjectiveLabel(camp.objective) }}
            </span>
          </div>

          <p v-if="camp.description" class="text-xs text-slate-500 font-medium line-clamp-2">
            {{ camp.description }}
          </p>

          <!-- Timeline -->
          <div class="text-[11px] text-slate-500 font-medium bg-slate-50 p-2.5 rounded-xl space-y-1">
            <div class="flex items-center justify-between">
              <span>📅 Thời gian:</span>
              <span class="font-bold text-slate-700">
                {{ camp.startAt ? formatDate(camp.startAt) : 'Ngay' }} — {{ camp.endAt ? formatDate(camp.endAt) : 'Vô hạn' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span>💰 Ngân sách:</span>
              <span class="font-bold text-slate-700">
                {{ formatMoney(camp.budgetPlan?.totalBudget) }}
              </span>
            </div>
          </div>

          <!-- Channels Pills -->
          <div class="flex flex-wrap items-center gap-1.5 pt-1">
            <span
              v-for="ch in camp.channels"
              :key="ch"
              class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
            >
              {{ ch }}
            </span>
          </div>
        </div>

        <!-- Card Footer & Quick Actions -->
        <div class="p-4 bg-slate-50/50 flex items-center justify-between gap-2">
          <!-- State Transitions -->
          <div class="flex items-center gap-1">
            <button
              v-if="camp.status === 'DRAFT'"
              class="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer"
              title="Gửi chiến dịch để cấp quản lý phê duyệt"
              @click="changeStatus(camp, 'IN_REVIEW')"
            >
              Gửi duyệt
            </button>
            <button
              v-else-if="camp.status === 'IN_REVIEW'"
              class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer"
              title="Phê duyệt chiến dịch"
              @click="changeStatus(camp, 'APPROVED')"
            >
              Phê duyệt
            </button>
            <button
              v-else-if="camp.status === 'APPROVED' || camp.status === 'PAUSED'"
              class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer"
              title="Kích hoạt chạy chiến dịch"
              @click="changeStatus(camp, 'ACTIVE')"
            >
              Kích hoạt
            </button>
            <button
              v-else-if="camp.status === 'ACTIVE'"
              class="px-2.5 py-1 bg-slate-600 hover:bg-slate-700 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer"
              title="Tạm dừng chiến dịch"
              @click="changeStatus(camp, 'PAUSED')"
            >
              Tạm dừng
            </button>
          </div>

          <!-- Edit & Archive -->
          <div class="flex items-center gap-1.5">
            <button
              class="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all cursor-pointer"
              title="Sửa chiến dịch"
              @click="openEditModal(camp)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
            </button>
            <button
              class="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer"
              title="Lưu trữ chiến dịch"
              @click="archiveCampaign(camp)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Create / Edit Wizard -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" @click="showModal = false"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 rounded-t-2xl z-10 flex items-center justify-between">
          <div>
            <h2 class="text-base font-black text-slate-900">
              {{ editingCamp ? 'Sửa Chiến Dịch Marketing' : 'Tạo Chiến Dịch Marketing Mới' }}
            </h2>
            <p class="text-[11px] text-slate-400 font-medium">
              Thiết lập thông tin chiến dịch, ngân sách và kênh truyền thông
            </p>
          </div>
          <button class="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" @click="showModal = false">
            ✕
          </button>
        </div>

        <form class="p-6 space-y-4" @submit.prevent="saveCampaign">
          <!-- Code & Name -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-extrabold text-slate-700 mb-1">Mã chiến dịch (in hoa) *</label>
              <input
                v-model="form.code"
                type="text"
                :disabled="!!editingCamp"
                placeholder="VD: KHAITRUONG_2026"
                class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626] disabled:bg-slate-100"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-extrabold text-slate-700 mb-1">Tên chiến dịch *</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="VD: Khai trương tựu trường"
                class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626]"
                required
              />
            </div>
          </div>

          <!-- Objective -->
          <div>
            <label class="block text-xs font-extrabold text-slate-700 mb-1">Mục tiêu chiến dịch *</label>
            <select
              v-model="form.objective"
              class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626] bg-white cursor-pointer"
            >
              <option value="CONVERSION">🎯 Chuyển đổi đơn hàng (CONVERSION)</option>
              <option value="TRAFFIC">🚀 Tăng lượng truy cập (TRAFFIC)</option>
              <option value="AWARENESS">📢 Tăng nhận diện thương hiệu (AWARENESS)</option>
              <option value="SEASONAL">🎒 Theo mùa vụ / Mùa tựu trường (SEASONAL)</option>
              <option value="CLEARANCE">🏷️ Xả hàng tồn kho (CLEARANCE)</option>
              <option value="REORDER">🔄 Chăm sóc mua lại (REORDER)</option>
            </select>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-extrabold text-slate-700 mb-1">Mô tả / Ghi chú</label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="Mô tả mục đích, thông điệp chính của chiến dịch..."
              class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626]"
            ></textarea>
          </div>

          <!-- Channels -->
          <div>
            <label class="block text-xs font-extrabold text-slate-700 mb-1.5">Kênh phân phối</label>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="ch in channelOptions"
                :key="ch.value"
                class="flex items-center gap-1.5 px-3 py-1.5 border rounded-xl cursor-pointer text-xs font-bold transition-all"
                :class="form.channels.includes(ch.value) ? 'border-[#dc2626] bg-red-50 text-red-700' : 'border-slate-200 text-slate-600'"
              >
                <input
                  v-model="form.channels"
                  type="checkbox"
                  :value="ch.value"
                  class="accent-[#dc2626]"
                />
                <span>{{ ch.label }}</span>
              </label>
            </div>
          </div>

          <!-- Start & End Date -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-extrabold text-slate-700 mb-1">Ngày bắt đầu</label>
              <input
                v-model="form.startAt"
                type="date"
                class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626]"
              />
            </div>
            <div>
              <label class="block text-xs font-extrabold text-slate-700 mb-1">Ngày kết thúc</label>
              <input
                v-model="form.endAt"
                type="date"
                class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626]"
              />
            </div>
          </div>

          <!-- Budget -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-extrabold text-slate-700 mb-1">Tổng ngân sách dự kiến (VNĐ)</label>
              <input
                v-model.number="form.totalBudget"
                type="number"
                min="0"
                step="100000"
                placeholder="VD: 5000000"
                class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626]"
              />
            </div>
            <div>
              <label class="block text-xs font-extrabold text-slate-700 mb-1">Ngân sách hàng ngày (VNĐ)</label>
              <input
                v-model.number="form.dailyBudget"
                type="number"
                min="0"
                step="50000"
                placeholder="VD: 200000"
                class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626]"
              />
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              class="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
              @click="showModal = false"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-5 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {{ saving ? 'Đang lưu...' : (editingCamp ? 'Cập nhật' : 'Tạo chiến dịch') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { campaignService, type MarketingCampaign } from '@/services/campaign.service'

const toast = useToast()
const campaigns = ref<MarketingCampaign[]>([])
const loading = ref(false)
const saving = ref(false)
const total = ref(0)
const searchQuery = ref('')
const filterStatus = ref('')
const filterObjective = ref('')
const showModal = ref(false)
const editingCamp = ref<MarketingCampaign | null>(null)

const channelOptions = [
  { value: 'STOREFRONT', label: '🏪 Website' },
  { value: 'FACEBOOK', label: '📘 Facebook' },
  { value: 'TIKTOK', label: '🎵 TikTok' },
  { value: 'LIVESTREAM', label: '🔴 Livestream' },
  { value: 'EMAIL', label: '✉️ Email' },
  { value: 'OFFLINE', label: '🏢 Cửa hàng' },
]

const form = ref({
  code: '',
  name: '',
  objective: 'CONVERSION',
  description: '',
  channels: ['STOREFRONT'],
  startAt: '',
  endAt: '',
  totalBudget: 0,
  dailyBudget: 0,
})

function getStatusLabel(status: string) {
  switch (status) {
    case 'DRAFT': return 'Bản nháp'
    case 'IN_REVIEW': return 'Chờ duyệt'
    case 'APPROVED': return 'Đã duyệt'
    case 'ACTIVE': return 'Đang chạy'
    case 'PAUSED': return 'Tạm dừng'
    case 'EXPIRED': return 'Đã kết thúc'
    case 'ARCHIVED': return 'Lưu trữ'
    default: return status
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case 'DRAFT': return 'bg-slate-100 text-slate-700'
    case 'IN_REVIEW': return 'bg-amber-100 text-amber-800'
    case 'APPROVED': return 'bg-blue-100 text-blue-800'
    case 'ACTIVE': return 'bg-emerald-100 text-emerald-800'
    case 'PAUSED': return 'bg-orange-100 text-orange-800'
    case 'EXPIRED': return 'bg-rose-100 text-rose-800'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function getObjectiveLabel(obj: string) {
  switch (obj) {
    case 'CONVERSION': return 'Chuyển đổi'
    case 'TRAFFIC': return 'Traffic'
    case 'AWARENESS': return 'Nhận diện'
    case 'SEASONAL': return 'Mùa vụ'
    case 'CLEARANCE': return 'Xả hàng'
    case 'REORDER': return 'Mua lại'
    default: return obj
  }
}

function formatDate(dStr: string) {
  if (!dStr) return ''
  const d = new Date(dStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('vi-VN')
}

function formatMoney(num?: number) {
  if (!num) return '0 ₫'
  return num.toLocaleString('vi-VN') + ' ₫'
}

async function fetchCampaigns() {
  loading.value = true
  try {
    const res = await campaignService.getAll({
      search: searchQuery.value.trim() || undefined,
      status: filterStatus.value || undefined,
      objective: filterObjective.value || undefined,
    })
    const data = res.data?.data || res.data || {}
    campaigns.value = data.items || []
    total.value = data.total || 0
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Lỗi tải danh sách chiến dịch')
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingCamp.value = null
  form.value = {
    code: '',
    name: '',
    objective: 'CONVERSION',
    description: '',
    channels: ['STOREFRONT'],
    startAt: '',
    endAt: '',
    totalBudget: 0,
    dailyBudget: 0,
  }
  showModal.value = true
}

function openEditModal(camp: MarketingCampaign) {
  editingCamp.value = camp
  form.value = {
    code: camp.code,
    name: camp.name,
    objective: camp.objective,
    description: camp.description || '',
    channels: camp.channels || ['STOREFRONT'],
    startAt: camp.startAt ? camp.startAt.slice(0, 10) : '',
    endAt: camp.endAt ? camp.endAt.slice(0, 10) : '',
    totalBudget: camp.budgetPlan?.totalBudget || 0,
    dailyBudget: camp.budgetPlan?.dailyBudget || 0,
  }
  showModal.value = true
}

async function saveCampaign() {
  saving.value = true
  try {
    const payload: any = {
      code: form.value.code.trim().toUpperCase(),
      name: form.value.name.trim(),
      objective: form.value.objective,
      description: form.value.description.trim() || undefined,
      channels: form.value.channels,
      startAt: form.value.startAt ? new Date(form.value.startAt).toISOString() : undefined,
      endAt: form.value.endAt ? new Date(form.value.endAt).toISOString() : undefined,
      budgetPlan: {
        totalBudget: form.value.totalBudget || 0,
        dailyBudget: form.value.dailyBudget || 0,
        currency: 'VND',
      },
    }

    if (editingCamp.value) {
      await campaignService.update(editingCamp.value._id, payload)
      toast.success('Đã cập nhật chiến dịch thành công')
    } else {
      await campaignService.create(payload)
      toast.success('Đã tạo chiến dịch mới thành công')
    }
    showModal.value = false
    await fetchCampaigns()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || err?.message || 'Lỗi lưu chiến dịch')
  } finally {
    saving.value = false
  }
}

async function changeStatus(camp: MarketingCampaign, newStatus: string) {
  try {
    await campaignService.updateStatus(camp._id, newStatus)
    toast.success(`Đã chuyển trạng thái chiến dịch sang "${getStatusLabel(newStatus)}"`)
    await fetchCampaigns()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Lỗi chuyển trạng thái')
  }
}

async function archiveCampaign(camp: MarketingCampaign) {
  if (!confirm(`Bạn có chắc chắn muốn lưu trữ chiến dịch "${camp.name}"?`)) return
  try {
    await campaignService.delete(camp._id)
    toast.success('Đã lưu trữ chiến dịch thành công')
    await fetchCampaigns()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Lỗi lưu trữ chiến dịch')
  }
}

onMounted(() => {
  fetchCampaigns()
})
</script>
