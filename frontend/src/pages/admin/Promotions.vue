<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
      <div class="space-y-1">
        <h2 class="text-lg font-extrabold text-slate-900">Quản lý mã khuyến mãi</h2>
        <p class="text-xs text-slate-500 font-medium">Tạo mã giảm giá theo phần trăm hoặc số tiền cố định, quy định giá trị đơn hàng tối thiểu.</p>
      </div>
      <button
        @click="openCreateForm"
        type="button"
        class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span>Tạo mã giảm giá</span>
      </button>
    </div>

    <!-- FilterBar -->
    <FilterBar
      v-model="promoQuery"
      placeholder="Tìm kiếm mã giảm giá theo mã hoặc tên chương trình..."
    />

    <!-- Promotions DataTable -->
    <DataTable
      :columns="columns"
      :items="filteredPromotions"
      :loading="loading"
      empty-text="Chưa có mã giảm giá nào."
      empty-subtext="Không tìm thấy mã giảm giá nào phù hợp."
    >
      <!-- Coupon Code -->
      <template #cell(code)="{ row }">
        <span class="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
          {{ row.code }}
        </span>
      </template>

      <!-- Details -->
      <template #cell(details)="{ row }">
        <div>
          <p class="font-bold text-slate-800">{{ row.name }}</p>
          <p class="text-xs text-blue-700 font-extrabold mt-0.5">
            {{ row.discountType === 'PERCENT' ? `Giảm ${row.discountValue}%` : `Giảm ${formatCurrency(row.discountValue)}` }}
          </p>
        </div>
      </template>

      <!-- Min Order Value -->
      <template #cell(minOrderValue)="{ row }">
        <span class="font-semibold text-slate-700">{{ formatCurrency(row.minOrderValue) }}</span>
      </template>

      <!-- Usage Limit -->
      <template #cell(usage)="{ row }">
        <span class="text-xs text-slate-600 font-semibold">{{ row.usedCount }} / {{ row.usageLimit }}</span>
      </template>

      <!-- StatusBadge -->
      <template #cell(status)="{ row }">
        <StatusBadge
          :status="row.status ? 'ACTIVE' : 'INACTIVE'"
          :label="row.status ? 'Đang chạy' : 'Ngừng chạy'"
        />
      </template>

      <!-- Actions -->
      <template #cell(actions)="{ row }">
        <button
          type="button"
          @click="deletePromotion(row._id)"
          class="text-red-500 hover:text-red-700 font-bold cursor-pointer"
        >
          Xóa
        </button>
      </template>
    </DataTable>

    <!-- Create Promotion FormModal -->
    <FormModal
      v-model="showForm"
      title="Tạo mã giảm giá mới"
      subtitle="Thiết lập thể lệ và hạn mức cho chương trình ưu đãi"
      size="lg"
      confirm-text="Tạo mã ngay"
      cancel-text="Hủy bỏ"
      :loading="saving"
      @confirm="handleSubmit"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="text-xs font-bold text-slate-700">Mã giảm giá (Coupon Code) *</label>
          <input
            v-model="form.code"
            type="text"
            required
            placeholder="Ví dụ: CHAOMUNG2026"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626] font-mono uppercase tracking-wider font-bold"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700">Tên chương trình *</label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="Ví dụ: Giảm giá ngày hè..."
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700">Mô tả chi tiết</label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Mô tả điều kiện áp dụng cho khách hàng..."
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-bold text-slate-700">Loại giảm giá *</label>
            <select
              v-model="form.discountType"
              class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
            >
              <option value="PERCENT">Phần trăm (%)</option>
              <option value="FIXED">Số tiền cố định (VNĐ)</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-slate-700">Mức giảm *</label>
            <input
              v-model.number="form.discountValue"
              type="number"
              required
              min="1"
              :max="form.discountType === 'PERCENT' ? 100 : undefined"
              class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626] font-bold"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-bold text-slate-700">Đơn hàng tối thiểu (VNĐ)</label>
            <input
              v-model.number="form.minOrderValue"
              type="number"
              min="0"
              class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
            />
          </div>
          <div v-if="form.discountType === 'PERCENT'">
            <label class="text-xs font-bold text-slate-700">Giảm tối đa (VNĐ)</label>
            <input
              v-model.number="form.maxDiscountAmount"
              type="number"
              min="0"
              placeholder="Để trống nếu không giới hạn"
              class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-bold text-slate-700">Giới hạn số lần dùng</label>
            <input
              v-model.number="form.usageLimit"
              type="number"
              min="1"
              class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
            />
          </div>
          <div>
            <label class="text-xs font-bold text-slate-700">Giới hạn mỗi khách hàng</label>
            <input
              v-model.number="form.limitPerUser"
              type="number"
              min="1"
              class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-bold text-slate-700">Ngày bắt đầu *</label>
            <input
              v-model="form.startDate"
              type="date"
              required
              class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
            />
          </div>
          <div>
            <label class="text-xs font-bold text-slate-700">Ngày kết thúc *</label>
            <input
              v-model="form.endDate"
              type="date"
              required
              class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
            />
          </div>
        </div>
      </form>
    </FormModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { promotionService } from '@/services/promotion.service'
import { formatCurrency } from '@/utils/helpers'
import type { Promotion } from '@/types'
import FilterBar from '@/components/FilterBar.vue'
import DataTable, { type TableColumn } from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import FormModal from '@/components/FormModal.vue'

const toast = useToast()

const promotions = ref<Promotion[]>([])
const loading = ref(true)
const saving = ref(false)
const showForm = ref(false)
const promoQuery = ref('')

const columns: TableColumn[] = [
  { key: 'code', label: 'MÃ GIẢM GIÁ' },
  { key: 'details', label: 'CHI TIẾT ƯU ĐÃI' },
  { key: 'minOrderValue', label: 'ĐƠN TỐI THIỂU' },
  { key: 'usage', label: 'ĐÃ DÙNG / GIỚI HẠN' },
  { key: 'status', label: 'TRẠNG THÁI' },
  { key: 'actions', label: 'THAO TÁC', align: 'right' },
]

const form = reactive({
  code: '',
  name: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: 10,
  minOrderValue: 0,
  maxDiscountAmount: undefined as number | undefined,
  usageLimit: 100,
  limitPerUser: 1,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
})

onMounted(fetchPromotions)

async function fetchPromotions() {
  loading.value = true
  try {
    const res: any = await promotionService.getAll()
    promotions.value = Array.isArray(res.data) ? res.data : (res.data?.data || [])
  } catch (err) {
    toast.error('Lỗi khi tải danh sách mã giảm giá')
  } finally {
    loading.value = false
  }
}

const filteredPromotions = computed(() => {
  if (!promoQuery.value) return promotions.value
  const q = promoQuery.value.toLowerCase().trim()
  return promotions.value.filter(p => {
    const code = (p.code || '').toLowerCase()
    const name = (p.name || '').toLowerCase()
    return code.includes(q) || name.includes(q)
  })
})

function openCreateForm() {
  showForm.value = true
}

async function handleSubmit() {
  if (!form.code || !form.name) {
    toast.warning('Vui lòng điền mã và tên chương trình')
    return
  }
  saving.value = true
  try {
    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
    }
    await promotionService.create(payload)
    toast.success('Tạo mã giảm giá thành công!')
    showForm.value = false
    fetchPromotions()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Không thể tạo mã giảm giá')
  } finally {
    saving.value = false
  }
}

async function deletePromotion(id: string) {
  if (!confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) return
  try {
    await promotionService.delete(id)
    toast.success('Đã xóa mã giảm giá')
    fetchPromotions()
  } catch (err) {
    toast.error('Xóa mã giảm giá thất bại')
  }
}
</script>
