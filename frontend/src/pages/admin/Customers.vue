<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-1">
      <h2 class="text-lg font-extrabold text-slate-900">Quản lý khách hàng</h2>
      <p class="text-xs text-slate-500 font-medium">Theo dõi hoạt động mua sắm, thống kê số lượng đơn và tổng mức chi tiêu của từng khách hàng.</p>
    </div>

    <!-- Customer Table -->
    <div class="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
      <!-- Search box -->
      <div class="p-4 border-b border-slate-100 flex gap-4 items-center">
        <div class="relative flex-grow">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" /></svg>
          </span>
          <input
            v-model="customerQuery"
            type="text"
            placeholder="Tìm kiếm khách hàng theo tên, email, số điện thoại..."
            class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:bg-white text-slate-700 font-semibold transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div v-if="loading" class="p-8 animate-pulse space-y-4">
        <div v-for="n in 5" :key="n" class="h-12 bg-slate-100 rounded-xl w-full"></div>
      </div>

      <div v-else-if="customers.length === 0" class="p-16 text-center text-slate-400 font-medium">
        Chưa có khách hàng nào đăng ký hệ thống.
      </div>

      <div v-else-if="filteredCustomers.length === 0" class="p-16 text-center text-slate-400 font-medium">
        Không tìm thấy khách hàng nào phù hợp.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-150 text-slate-400 font-bold text-xs uppercase tracking-wider">
              <th class="py-4 px-6">Họ và tên</th>
              <th class="py-4 px-6">Số điện thoại</th>
              <th class="py-4 px-6">Số đơn hàng đã đặt</th>
              <th class="py-4 px-6">Tổng chi tiêu</th>
              <th class="py-4 px-6">Trạng thái tài khoản</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
            <tr v-for="cust in filteredCustomers" :key="cust._id" class="hover:bg-slate-50/50 transition-colors">
              <td class="py-4 px-6">
                <p class="font-bold text-slate-900">{{ cust.fullName }}</p>
                <p class="text-xs text-slate-400 font-normal">{{ cust.email }}</p>
              </td>
              <td class="py-4 px-6">{{ cust.phone || 'Chưa cung cấp' }}</td>
              <td class="py-4 px-6 font-bold text-slate-800">{{ cust.orderCount || 0 }}</td>
              <td class="py-4 px-6 font-black text-blue-700">{{ formatCurrency(cust.totalSpend || 0) }}</td>
              <td class="py-4 px-6">
                <span :class="[cust.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800', 'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider']">
                  {{ cust.status ? 'Hoạt động' : 'Đã khóa' }}
                </span>
              </td>
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
import { customerService } from '@/services/customer.service'
import { formatCurrency } from '@/utils/helpers'

const toast = useToast()

const customers = ref<any[]>([])
const loading = ref(true)
const customerQuery = ref('')

onMounted(fetchCustomers)

async function fetchCustomers() {
  loading.value = true
  try {
    const res = await customerService.getAll()
    customers.value = res.data
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
