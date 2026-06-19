<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-1">
      <h2 class="text-lg font-extrabold text-slate-900">Quản lý khách hàng</h2>
      <p class="text-xs text-slate-500 font-medium">Theo dõi hoạt động mua sắm, thống kê số lượng đơn và tổng mức chi tiêu của từng khách hàng.</p>
    </div>

    <!-- Customer Table -->
    <div class="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
      <div v-if="loading" class="p-8 animate-pulse space-y-4">
        <div v-for="n in 5" :key="n" class="h-12 bg-slate-100 rounded-xl w-full"></div>
      </div>

      <div v-else-if="customers.length === 0" class="p-16 text-center text-slate-400 font-medium">
        Chưa có khách hàng nào đăng ký hệ thống.
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
            <tr v-for="cust in customers" :key="cust._id" class="hover:bg-slate-50/50 transition-colors">
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
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { customerService } from '@/services/customer.service'
import { formatCurrency } from '@/utils/helpers'

const toast = useToast()

const customers = ref<any[]>([])
const loading = ref(true)

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
</script>
