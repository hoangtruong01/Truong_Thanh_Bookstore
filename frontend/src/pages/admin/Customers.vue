<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-1">
      <h2 class="text-lg font-extrabold text-slate-900">Quản lý khách hàng</h2>
      <p class="text-xs text-slate-500 font-medium">Theo dõi hoạt động mua sắm, thống kê số lượng đơn và tổng mức chi tiêu của từng khách hàng.</p>
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

      <!-- Order count cell -->
      <template #cell(orderCount)="{ row }">
        <span class="font-bold text-slate-800">{{ row.orderCount || 0 }}</span>
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
    </DataTable>
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

const columns: TableColumn[] = [
  { key: 'fullName', label: 'Họ và tên' },
  { key: 'phone', label: 'Số điện thoại' },
  { key: 'orderCount', label: 'Số đơn hàng đã đặt' },
  { key: 'totalSpend', label: 'Tổng chi tiêu' },
  { key: 'status', label: 'Trạng thái tài khoản' },
]

onMounted(fetchCustomers)

async function fetchCustomers() {
  loading.value = true
  try {
    const res: any = await customerService.getAll()
    customers.value = Array.isArray(res.data) ? res.data : (res.data?.data || [])
  } catch (err) {
    toast.error('Lỗi khi tải thông tin khách hàng')
  } finally {
    loading.value = false
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
