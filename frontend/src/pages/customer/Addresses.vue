<template>
  <div class="max-w-4xl mx-auto px-4 py-8 space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-6">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">SỔ ĐỊA CHỈ</h1>
        <p class="text-sm text-slate-500">Quản lý các địa chỉ giao hàng của bạn để thanh toán nhanh hơn.</p>
      </div>
      <button
        @click="openAddForm"
        class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-2.5 px-5 rounded-xl transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-500/10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Thêm địa chỉ mới
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && addresses.length === 0" class="py-12 flex justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#dc2626]"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="addresses.length === 0 && !showForm" class="bg-white border border-slate-100 rounded-3xl p-12 text-center space-y-4">
      <div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
      </div>
      <div class="space-y-1">
        <h3 class="font-bold text-slate-800 text-base">Chưa có địa chỉ nào</h3>
        <p class="text-xs text-slate-400 max-w-sm mx-auto">Vui lòng thêm địa chỉ nhận hàng đầu tiên để tiết kiệm thời gian khi thanh toán.</p>
      </div>
    </div>

    <!-- Address Form (Create/Edit inline or modal-like block) -->
    <div v-if="showForm" class="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      <h3 class="text-lg font-extrabold text-slate-800 border-b border-slate-100 pb-3">
        {{ editingId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới' }}
      </h3>
      <form @submit.prevent="saveAddress" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="text-xs font-bold text-slate-700">Tên người nhận</label>
          <input
            v-model="form.recipientName"
            type="text"
            required
            placeholder="Nguyễn Văn A"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
          />
        </div>
        <div>
          <label class="text-xs font-bold text-slate-700">Số điện thoại</label>
          <input
            v-model="form.phone"
            type="text"
            required
            placeholder="0901234567"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
          />
        </div>
        <div>
          <label class="text-xs font-bold text-slate-700">Nhãn địa chỉ (ví dụ: Nhà riêng, Văn phòng)</label>
          <input
            v-model="form.label"
            type="text"
            required
            placeholder="Nhà riêng"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
          />
        </div>
        <div>
          <label class="text-xs font-bold text-slate-700">Tỉnh / Thành phố</label>
          <input
            v-model="form.province"
            type="text"
            required
            placeholder="Thành phố Hồ Chí Minh"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
          />
        </div>
        <div>
          <label class="text-xs font-bold text-slate-700">Quận / Huyện</label>
          <input
            v-model="form.district"
            type="text"
            required
            placeholder="Quận 1"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
          />
        </div>
        <div>
          <label class="text-xs font-bold text-slate-700">Phường / Xã</label>
          <input
            v-model="form.ward"
            type="text"
            required
            placeholder="Phường Bến Nghé"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
          />
        </div>
        <div class="md:col-span-2">
          <label class="text-xs font-bold text-slate-700">Địa chỉ chi tiết (Số nhà, tên đường...)</label>
          <input
            v-model="form.detail"
            type="text"
            required
            placeholder="123 Nguyễn Huệ"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
          />
        </div>
        <div class="md:col-span-2 flex items-center gap-2">
          <input
            v-model="form.isDefault"
            type="checkbox"
            id="isDefault"
            class="rounded border-slate-300 text-[#dc2626] focus:ring-[#dc2626] h-4 w-4 cursor-pointer"
          />
          <label for="isDefault" class="text-xs font-bold text-slate-700 cursor-pointer">Đặt làm địa chỉ mặc định</label>
        </div>

        <div class="md:col-span-2 flex gap-3 justify-end pt-4">
          <button
            type="button"
            @click="showForm = false"
            class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-5 rounded-xl transition-all text-sm cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            :disabled="formLoading"
            class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-2.5 px-6 rounded-xl transition-all text-sm disabled:bg-slate-300 cursor-pointer"
          >
            {{ formLoading ? 'Đang lưu...' : 'Lưu lại' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Address List -->
    <div v-if="addresses.length > 0" class="grid grid-cols-1 gap-4">
      <div
        v-for="addr in addresses"
        :key="addr._id"
        class="bg-white border rounded-3xl p-6 shadow-sm transition-all hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
        :class="addr.isDefault ? 'border-red-500 ring-1 ring-red-500/20' : 'border-slate-100'"
      >
        <div class="space-y-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-black uppercase bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
              {{ addr.label }}
            </span>
            <span v-if="addr.isDefault" class="text-xs font-black uppercase bg-red-50 text-[#dc2626] border border-red-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
              Mặc định
            </span>
          </div>
          <div class="space-y-1">
            <h4 class="font-extrabold text-slate-800 text-base flex items-center gap-2">
              {{ addr.recipientName }}
              <span class="text-slate-300 font-normal">|</span>
              <span class="text-slate-500 text-sm font-semibold">{{ addr.phone }}</span>
            </h4>
            <p class="text-slate-600 text-sm">
              {{ addr.detail }}, {{ addr.ward }}, {{ addr.district }}, {{ addr.province }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            v-if="!addr.isDefault"
            @click="setDefaultAddress(addr._id)"
            class="text-xs font-bold text-slate-600 hover:text-[#dc2626] bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            Đặt làm mặc định
          </button>
          <button
            @click="openEditForm(addr)"
            class="text-xs font-bold text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            Sửa
          </button>
          <button
            @click="deleteAddress(addr._id)"
            class="text-xs font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/utils/api'

interface Address {
  _id: string
  label: string
  recipientName: string
  phone: string
  province: string
  district: string
  ward: string
  detail: string
  isDefault: boolean
}

const toast = useToast()
const loading = ref(false)
const formLoading = ref(false)
const showForm = ref(false)
const editingId = ref<string | null>(null)
const addresses = ref<Address[]>([])

const initialForm = {
  label: '',
  recipientName: '',
  phone: '',
  province: '',
  district: '',
  ward: '',
  detail: '',
  isDefault: false,
}

const form = ref({ ...initialForm })

async function fetchAddresses() {
  loading.value = true
  try {
    const res = await api.get('/addresses')
    addresses.value = res.data.data || res.data
  } catch (err: any) {
    toast.error('Lỗi tải sổ địa chỉ')
  } finally {
    loading.value = false
  }
}

function openAddForm() {
  editingId.value = null
  form.value = { ...initialForm }
  showForm.value = true
}

function openEditForm(addr: Address) {
  editingId.value = addr._id
  form.value = { ...addr }
  showForm.value = true
}

async function saveAddress() {
  formLoading.value = true
  try {
    if (editingId.value) {
      await api.put(`/addresses/${editingId.value}`, form.value)
      toast.success('Cập nhật địa chỉ thành công')
    } else {
      await api.post('/addresses', form.value)
      toast.success('Thêm địa chỉ mới thành công')
    }
    showForm.value = false
    fetchAddresses()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Lỗi lưu địa chỉ')
  } finally {
    formLoading.value = false
  }
}

async function setDefaultAddress(id: string) {
  try {
    await api.put(`/addresses/${id}/default`)
    toast.success('Đã thay đổi địa chỉ mặc định')
    fetchAddresses()
  } catch (err: any) {
    toast.error('Lỗi thiết lập địa chỉ')
  }
}

async function deleteAddress(id: string) {
  if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return
  try {
    await api.delete(`/addresses/${id}`)
    toast.success('Đã xóa địa chỉ')
    fetchAddresses()
  } catch (err: any) {
    toast.error('Lỗi xóa địa chỉ')
  }
}

onMounted(() => {
  fetchAddresses()
})
</script>
