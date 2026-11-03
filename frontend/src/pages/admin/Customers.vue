<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-extrabold text-slate-900">Quản Lý Khách Hàng & CRM Khách Sỉ</h2>
        <p class="text-xs text-slate-500 font-medium">
          Theo dõi hồ sơ tín dụng, phân hạng khách buôn/sỉ và kiểm soát hạn mức công nợ (ERP-UI-04 & AR-01).
        </p>
      </div>
    </div>

    <!-- Search / FilterBar -->
    <FilterBar
      v-model="customerQuery"
      placeholder="Tìm kiếm khách hàng theo tên, email, số điện thoại..."
    />

    <!-- Customer DataTable -->
    <DataTable
      :columns="columns"
      :items="filteredCustomers"
      :loading="loading"
      empty-text="Chưa có khách hàng nào."
      empty-subtext="Không tìm thấy khách hàng nào phù hợp với từ khóa tìm kiếm."
    >
      <!-- Custom FullName & Email cell -->
      <template #cell(fullName)="{ row }">
        <p class="font-bold text-slate-900">{{ row.fullName }}</p>
        <p class="text-xs text-slate-400 font-normal">{{ row.email }}</p>
      </template>

      <!-- Phone cell -->
      <template #cell(phone)="{ row }">
        <span class="font-medium text-slate-700">{{ row.phone || 'Chưa cung cấp' }}</span>
      </template>

      <!-- Tier / Phân hạng cell -->
      <template #cell(tier)="{ row }">
        <span
          class="px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wider inline-block"
          :class="{
            'bg-slate-100 text-slate-600': !row.wholesaleTier || row.wholesaleTier === 'RETAIL',
            'bg-slate-200 text-slate-800': row.wholesaleTier === 'WHOLESALE_SILVER',
            'bg-amber-100 text-amber-800 border border-amber-300': row.wholesaleTier === 'WHOLESALE_GOLD',
            'bg-purple-100 text-purple-800 border border-purple-300': row.wholesaleTier === 'WHOLESALE_DIAMOND',
          }"
        >
          {{ formatTier(row.wholesaleTier) }}
        </span>
      </template>

      <!-- Credit Limit & Exposure -->
      <template #cell(creditLimit)="{ row }">
        <div>
          <span class="font-bold text-slate-800">{{ formatCurrency(row.creditLimit || 0) }}</span>
          <span
            v-if="row.currentExposure"
            class="block text-[11px] font-semibold text-rose-600"
          >
            Nợ: {{ formatCurrency(row.currentExposure) }}
          </span>
        </div>
      </template>

      <!-- Total spend cell -->
      <template #cell(totalSpend)="{ row }">
        <span class="font-black text-blue-700">{{ formatCurrency(row.totalSpend || 0) }}</span>
      </template>

      <!-- Status cell with StatusBadge -->
      <template #cell(status)="{ row }">
        <StatusBadge
          :status="row.status"
          type="boolean"
        />
      </template>

      <!-- Actions -->
      <template #cell(actions)="{ row }">
        <div class="flex items-center gap-1.5">
          <button
            class="px-2 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            title="Cập nhật hạn mức công nợ & hạng sỉ"
            @click="openCreditModal(row)"
          >
            Hạn mức tín dụng
          </button>
          <button
            class="px-2 py-1 text-[11px] font-bold text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
            title="Đánh giá lại hạng sỉ tự động theo doanh số"
            @click="handleEvaluateTier(row._id)"
          >
            Đánh giá lại
          </button>
        </div>
      </template>
    </DataTable>

    <!-- MODAL: UPDATE CREDIT & TIER -->
    <div
      v-if="showCreditModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
    >
      <div class="bg-white border border-slate-200 rounded-3xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-900">Thiết Lập Hạn Mức Tín Dụng & Hạng Sỉ</h3>
          <button class="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer" @click="showCreditModal = false">&times;</button>
        </div>

        <div class="space-y-3 text-xs">
          <p class="text-slate-600">
            Khách hàng: <strong class="text-slate-900">{{ selectedCustomer?.fullName }}</strong> ({{ selectedCustomer?.phone || selectedCustomer?.email }})
          </p>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Phân Hạng Khách Hàng</label>
            <select
              v-model="creditForm.tier"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 font-semibold"
            >
              <option value="RETAIL">Khách Bán Lẻ (RETAIL)</option>
              <option value="WHOLESALE_SILVER">Đại Lý Bạc (WHOLESALE_SILVER)</option>
              <option value="WHOLESALE_GOLD">Đại Lý Vàng (WHOLESALE_GOLD)</option>
              <option value="WHOLESALE_DIAMOND">Đại Lý Kim Cương (WHOLESALE_DIAMOND)</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Hạn Mức Công Nợ Tối Đa (VND)</label>
            <input
              v-model.number="creditForm.creditLimit"
              type="number"
              min="0"
              step="500000"
              placeholder="0 = Không cho nợ"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 font-bold"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Thời Hạn Nợ Tối Đa (Số ngày)</label>
            <input
              v-model.number="creditForm.paymentTermDays"
              type="number"
              min="0"
              placeholder="Ví dụ: 30 ngày"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Trạng Thái Tín Dụng</label>
            <select
              v-model="creditForm.creditStatus"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 font-semibold"
            >
              <option value="ACTIVE">Hoạt Động Bình Thường (ACTIVE)</option>
              <option value="SUSPENDED">Tạm Khóa Công Nợ (SUSPENDED)</option>
              <option value="BLOCKED">Chặn Bán Nợ Hoàn Toàn (BLOCKED)</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            @click="showCreditModal = false"
          >
            Hủy
          </button>
          <button
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            :disabled="savingCredit"
            @click="submitCreditProfile"
          >
            {{ savingCredit ? 'Đang lưu...' : 'Lưu Thay Đổi' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { customerService } from '@/services/customer.service'
import { formatCurrency } from '@/utils/helpers'
import FilterBar from '@/components/FilterBar.vue'
import DataTable, { type TableColumn } from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'

const toast = useToast()

const customers = ref<any[]>([])
const loading = ref(true)
const customerQuery = ref('')

// Modal state
const showCreditModal = ref(false)
const selectedCustomer = ref<any>(null)
const savingCredit = ref(false)
const creditForm = ref<any>({
  tier: 'RETAIL',
  creditLimit: 0,
  paymentTermDays: 30,
  creditStatus: 'ACTIVE',
})

const columns: TableColumn[] = [
  { key: 'fullName', label: 'Họ và tên' },
  { key: 'phone', label: 'Số điện thoại' },
  { key: 'tier', label: 'Hạng khách hàng' },
  { key: 'creditLimit', label: 'Hạn mức / Dư nợ' },
  { key: 'totalSpend', label: 'Tổng chi tiêu' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'actions', label: 'Thao tác' },
]

onMounted(fetchCustomers)

async function fetchCustomers() {
  loading.value = true
  try {
    const res: any = await customerService.getAll()
    customers.value = Array.isArray(res.data) ? res.data : (res.data?.data || [])
  } catch {
    toast.error('Lỗi khi tải thông tin khách hàng')
  } finally {
    loading.value = false
  }
}

function formatTier(tier?: string): string {
  switch (tier) {
    case 'WHOLESALE_SILVER':
      return 'Sỉ Bạc'
    case 'WHOLESALE_GOLD':
      return 'Sỉ Vàng'
    case 'WHOLESALE_DIAMOND':
      return 'Sỉ Kim Cương'
    case 'RETAIL':
    default:
      return 'Bán Lẻ'
  }
}

function openCreditModal(customer: any) {
  selectedCustomer.value = customer
  creditForm.value = {
    tier: customer.wholesaleTier || 'RETAIL',
    creditLimit: customer.creditLimit || 0,
    paymentTermDays: customer.paymentTermDays || 30,
    creditStatus: customer.creditStatus || 'ACTIVE',
  }
  showCreditModal.value = true
}

async function submitCreditProfile() {
  if (!selectedCustomer.value?._id) return
  savingCredit.value = true
  try {
    await customerService.updateCRMProfile(selectedCustomer.value._id, creditForm.value)
    toast.success('Đã cập nhật hạn mức tín dụng và phân hạng khách hàng!')
    showCreditModal.value = false
    await fetchCustomers()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Lỗi khi cập nhật hồ sơ tín dụng')
  } finally {
    savingCredit.value = false
  }
}

async function handleEvaluateTier(id: string) {
  try {
    const res: any = await customerService.evaluateTier(id)
    toast.success(`Đã đánh giá lại hạng sỉ thành công: ${res?.recommendedTier || res?.tier || 'Cập nhật'}`)
    await fetchCustomers()
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Lỗi khi đánh giá hạng sỉ')
  }
}

const filteredCustomers = computed(() => {
  if (!customerQuery.value) return customers.value
  const q = customerQuery.value.toLowerCase().trim()
  return customers.value.filter(cust => {
    const name = (cust.fullName || '').toLowerCase()
    const email = (cust.email || '').toLowerCase()
    const phone = (cust.phone || '').toLowerCase()
    return name.includes(q) || email.includes(q) || phone.includes(q)
  })
})
</script>
