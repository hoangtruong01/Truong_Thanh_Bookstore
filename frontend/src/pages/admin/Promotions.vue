<template>
  <div class="space-y-6">
    <!-- Header with Action -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
      <div class="space-y-1">
        <h2 class="text-lg font-extrabold text-slate-900">Quản lý mã khuyến mãi</h2>
        <p class="text-xs text-slate-500 font-medium">Tạo mã giảm giá theo phần trăm hoặc số tiền cố định, quy định giá trị đơn hàng tối thiểu.</p>
      </div>
      <button
        v-if="!showForm"
        @click="openCreateForm"
        class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        <span>Tạo mã giảm giá</span>
      </button>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
      <!-- Promotions List -->
      <div class="xl:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <!-- Search box -->
        <div class="p-4 border-b border-slate-100 flex gap-4 items-center">
          <div class="relative flex-grow">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" /></svg>
            </span>
            <input
              v-model="promoQuery"
              type="text"
              placeholder="Tìm kiếm mã giảm giá theo mã hoặc tên chương trình..."
              class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white text-slate-700 font-semibold transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div v-if="loading" class="p-8 animate-pulse space-y-4">
          <div v-for="n in 5" :key="n" class="h-12 bg-slate-100 rounded-xl w-full"></div>
        </div>

        <div v-else-if="promotions.length === 0" class="p-16 text-center text-slate-400 font-medium">
          Chưa có mã giảm giá nào trong hệ thống.
        </div>

        <div v-else-if="filteredPromotions.length === 0" class="p-16 text-center text-slate-400 font-medium">
          Không tìm thấy mã giảm giá nào phù hợp.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-150 text-slate-400 font-bold text-xs uppercase tracking-wider">
                <th class="py-4 px-6">Mã giảm giá</th>
                <th class="py-4 px-6">Chi tiết ưu đãi</th>
                <th class="py-4 px-6">Đơn tối thiểu</th>
                <th class="py-4 px-6">Đã dùng / Giới hạn</th>
                <th class="py-4 px-6">Trạng thái</th>
                <th class="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
              <tr v-for="promo in filteredPromotions" :key="promo._id" class="hover:bg-slate-50/50">
                <td class="py-4 px-6 font-mono text-xs font-bold text-slate-900 bg-slate-50/20">{{ promo.code }}</td>
                <td class="py-4 px-6">
                  <p class="font-bold text-slate-800">{{ promo.name }}</p>
                  <p class="text-xs text-blue-700 font-extrabold">
                    {{ promo.discountType === 'PERCENT' ? `Giảm ${promo.discountValue}%` : `Giảm ${formatCurrency(promo.discountValue)}` }}
                  </p>
                </td>
                <td class="py-4 px-6 font-semibold">{{ formatCurrency(promo.minOrderValue) }}</td>
                <td class="py-4 px-6 text-xs text-slate-500 font-semibold">{{ promo.usedCount }} / {{ promo.usageLimit }}</td>
                <td class="py-4 px-6">
                  <span :class="[promo.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800', 'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider']">
                    {{ promo.status ? 'Đang chạy' : 'Ngừng chạy' }}
                  </span>
                </td>
                <td class="py-4 px-6 text-right space-x-2">
                  <button @click="deletePromotion(promo._id)" class="text-red-500 hover:text-red-700 inline-block font-bold">
                    Xóa
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Creation Form Panel -->
      <div v-if="showForm" class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        <div class="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Tạo mã giảm giá mới</h3>
          <button @click="showForm = false" class="text-slate-400 hover:text-slate-600">&times;</button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="text-xs font-bold text-slate-700">Mã giảm giá (Coupon Code) *</label>
            <input
              v-model="form.code"
              type="text"
              required
              placeholder="Ví dụ: CHAOMUNG2026"
              class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-mono uppercase tracking-wider"
            />
          </div>

          <div>
            <label class="text-xs font-bold text-slate-700">Tên chương trình *</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Ví dụ: Giảm giá ngày hè..."
              class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label class="text-xs font-bold text-slate-700">Mô tả chi tiết</label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="Mô tả ưu đãi..."
              class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-slate-700">Loại giảm giá</label>
              <select
                v-model="form.discountType"
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="PERCENT">Phần trăm (%)</option>
                <option value="FIXED">Số tiền cố định (VND)</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-bold text-slate-700">Giá trị giảm giá *</label>
              <input
                v-model.number="form.discountValue"
                type="number"
                required
                min="1"
                placeholder="Nhập giá trị..."
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-slate-700">Đơn tối thiểu *</label>
              <input
                v-model.number="form.minOrderValue"
                type="number"
                required
                min="0"
                placeholder="0đ"
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-700">Lượt dùng tối đa *</label>
              <input
                v-model.number="form.usageLimit"
                type="number"
                required
                min="1"
                placeholder="1000"
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-slate-700">Ngày bắt đầu *</label>
              <input
                v-model="form.startDate"
                type="date"
                required
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-700">Ngày kết thúc *</label>
              <input
                v-model="form.endDate"
                type="date"
                required
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="submitting"
            class="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 px-6 rounded-xl transition-colors flex items-center justify-center text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 disabled:bg-slate-300 disabled:shadow-none"
          >
            {{ submitting ? 'Đang tạo...' : 'Tạo mã giảm giá' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { promotionService } from '@/services/promotion.service'
import { formatCurrency } from '@/utils/helpers'
import type { Promotion } from '@/types'

const toast = useToast()

const promotions = ref<Promotion[]>([])
const loading = ref(true)
const showForm = ref(false)
const submitting = ref(false)
const promoQuery = ref('')

const filteredPromotions = computed(() => {
  if (!promoQuery.value) return promotions.value
  const q = promoQuery.value.toLowerCase().trim()
  return promotions.value.filter(promo => {
    const code = (promo.code || '').toLowerCase()
    const name = (promo.name || '').toLowerCase()
    const desc = (promo.description || '').toLowerCase()
    return code.includes(q) || name.includes(q) || desc.includes(q)
  })
})

const form = reactive({
  code: '',
  name: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: 10,
  minOrderValue: 100000,
  startDate: '',
  endDate: '',
  usageLimit: 100,
})

onMounted(fetchPromotions)

async function fetchPromotions() {
  loading.value = true
  try {
    const res = await promotionService.getAll()
    promotions.value = res.data
  } catch (err) {
    toast.error('Lỗi khi tải danh sách khuyến mãi')
  } finally {
    loading.value = false
  }
}

function openCreateForm() {
  form.code = ''
  form.name = ''
  form.description = ''
  form.discountType = 'PERCENT'
  form.discountValue = 10
  form.minOrderValue = 100000
  form.startDate = new Date().toISOString().substring(0, 10)
  form.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
  form.usageLimit = 100
  showForm.value = true
}

async function handleSubmit() {
  submitting.value = true
  try {
    const payload = {
      ...form,
      code: form.code.toUpperCase().trim(),
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
    }
    await promotionService.create(payload)
    toast.success('Tạo mã giảm giá thành công!')
    showForm.value = false
    fetchPromotions()
  } catch (err: any) {
    toast.error(err.message || 'Lỗi khi tạo khuyến mãi')
  } finally {
    submitting.value = false
  }
}

async function deletePromotion(id: string) {
  if (!confirm('Bạn có chắc muốn xóa mã giảm giá này?')) return
  try {
    await promotionService.delete(id)
    toast.success('Xóa khuyến mãi thành công')
    fetchPromotions()
  } catch (err) {
    toast.error('Lỗi khi xóa khuyến mãi')
  }
}
</script>
