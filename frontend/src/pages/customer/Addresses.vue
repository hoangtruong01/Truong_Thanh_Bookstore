<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
      <div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-red-50 text-[#dc2626] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">SỔ ĐỊA CHỈ NHẬN HÀNG</h1>
        </div>
        <p class="text-xs sm:text-sm text-slate-500 mt-1">Quản lý danh sách địa chỉ giao hàng để đặt hàng nhanh chóng và thuận tiện nhất.</p>
      </div>
      <button
        @click="openAddForm"
        class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-2.5 px-5 rounded-xl transition-all text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-500/15 active:scale-[0.98]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Thêm địa chỉ mới
      </button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading && addresses.length === 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="i in 2" :key="i" class="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 animate-pulse">
        <div class="h-5 bg-slate-200 rounded w-1/3"></div>
        <div class="h-4 bg-slate-200 rounded w-2/3"></div>
        <div class="h-4 bg-slate-200 rounded w-full"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="addresses.length === 0 && !showForm" class="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-xs">
      <div class="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto text-[#dc2626]">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-8 h-8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
      </div>
      <div class="space-y-1">
        <h3 class="font-extrabold text-slate-800 text-base">Bạn chưa có địa chỉ nhận hàng nào</h3>
        <p class="text-xs text-slate-400 max-w-md mx-auto">Thêm địa chỉ giao hàng đầu tiên để tự động điền vào đơn hàng trong quá trình thanh toán.</p>
      </div>
      <button
        @click="openAddForm"
        class="inline-flex items-center gap-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Tạo địa chỉ ngay
      </button>
    </div>

    <!-- Address Form Modal / Card -->
    <div v-if="showForm" class="bg-white border border-red-200/60 rounded-3xl p-6 sm:p-8 shadow-lg shadow-red-500/5 space-y-6 ring-1 ring-red-500/10">
      <div class="flex items-center justify-between border-b border-slate-100 pb-4">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-[#dc2626]"></span>
          <h3 class="text-lg font-black text-slate-900">
            {{ editingId ? 'Cập nhật địa chỉ nhận hàng' : 'Thêm địa chỉ nhận hàng mới' }}
          </h3>
        </div>
        <button
          @click="showForm = false"
          class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="saveAddress" class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <div>
          <label class="text-xs font-bold text-slate-700 block mb-1">
            Tên người nhận <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.recipientName"
            type="text"
            required
            maxlength="100"
            placeholder="Ví dụ: Nguyễn Văn A"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white transition-all"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700 block mb-1">
            Số điện thoại nhận hàng <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.phone"
            type="tel"
            required
            maxlength="10"
            @input="onPhoneInput"
            placeholder="09xx xxx xxx"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white transition-all"
            :class="{ 'border-red-300 ring-1 ring-red-300': form.phone && !isPhoneValid }"
          />
          <p v-if="form.phone && !isPhoneValid" class="text-[10px] text-red-500 mt-1 font-semibold">
            Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0 (VD: 0901234567)
          </p>
        </div>

        <div class="sm:col-span-2">
          <label class="text-xs font-bold text-slate-700 block mb-1">
            Nhãn địa chỉ <span class="text-red-500">*</span>
          </label>
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <button
              type="button"
              v-for="preset in ['Nhà riêng', 'Văn phòng', 'Công ty', 'Khác']"
              :key="preset"
              @click="form.label = preset"
              class="text-xs font-semibold px-3 py-1 rounded-lg border transition-all cursor-pointer"
              :class="form.label === preset ? 'bg-red-50 text-[#dc2626] border-red-200 font-bold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'"
            >
              {{ preset }}
            </button>
          </div>
          <input
            v-model="form.label"
            type="text"
            required
            maxlength="50"
            placeholder="Nhập hoặc chọn nhãn (Nhà riêng, Văn phòng...)"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white transition-all"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700 block mb-1">
            Tỉnh / Thành phố <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.province"
            type="text"
            required
            maxlength="100"
            placeholder="Ví dụ: TP. Hồ Chí Minh"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white transition-all"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700 block mb-1">
            Quận / Huyện <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.district"
            type="text"
            required
            maxlength="100"
            placeholder="Ví dụ: Quận 1"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white transition-all"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700 block mb-1">
            Phường / Xã <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.ward"
            type="text"
            required
            maxlength="100"
            placeholder="Ví dụ: Phường Bến Nghé"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white transition-all"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700 block mb-1">
            Địa chỉ chi tiết (Số nhà, tên đường...) <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.detail"
            type="text"
            required
            maxlength="200"
            placeholder="Ví dụ: 123 Nguyễn Huệ, Tòa nhà A"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white transition-all"
          />
        </div>

        <div class="sm:col-span-2 flex items-center gap-2.5 pt-2">
          <input
            v-model="form.isDefault"
            type="checkbox"
            id="isDefault"
            class="rounded border-slate-300 text-[#dc2626] focus:ring-[#dc2626] h-4 w-4 cursor-pointer accent-[#dc2626]"
          />
          <label for="isDefault" class="text-xs font-bold text-slate-700 cursor-pointer select-none">
            Đặt làm địa chỉ nhận hàng mặc định
          </label>
        </div>

        <div class="sm:col-span-2 flex gap-3 justify-end pt-4 border-t border-slate-100">
          <button
            type="button"
            @click="showForm = false"
            class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-5 rounded-xl transition-all text-xs uppercase tracking-wider cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            :disabled="formLoading || !isPhoneValid"
            class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-2.5 px-6 rounded-xl transition-all text-xs uppercase tracking-wider disabled:bg-slate-300 disabled:shadow-none cursor-pointer shadow-md shadow-red-500/15"
          >
            {{ formLoading ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Thêm địa chỉ') }}
          </button>
        </div>
      </form>
    </div>

    <!-- Address Cards Grid -->
    <div v-if="addresses.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
      <div
        v-for="addr in addresses"
        :key="addr._id"
        class="bg-white border rounded-3xl p-6 shadow-sm transition-all hover:shadow-md relative flex flex-col justify-between group"
        :class="addr.isDefault ? 'border-red-500 ring-2 ring-red-500/15 bg-gradient-to-br from-white to-red-50/20' : 'border-slate-200/80 hover:border-slate-300'"
      >
        <div class="space-y-3">
          <!-- Top Tags -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-black uppercase bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg tracking-wider">
                {{ addr.label }}
              </span>
              <span
                v-if="addr.isDefault"
                class="text-[11px] font-black uppercase bg-red-500 text-white px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-xs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
                </svg>
                Mặc định
              </span>
            </div>

            <!-- Fast Action icons -->
            <div class="flex items-center gap-1">
              <button
                @click="openEditForm(addr)"
                class="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-all cursor-pointer"
                title="Chỉnh sửa"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
              </button>
              <button
                @click="deleteAddress(addr._id)"
                class="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                title="Xóa"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Recipient Name & Phone -->
          <div>
            <h4 class="font-extrabold text-slate-900 text-base flex items-center gap-2">
              {{ addr.recipientName }}
              <span class="text-slate-300 font-normal">|</span>
              <span class="text-slate-600 text-sm font-semibold">{{ addr.phone }}</span>
            </h4>
          </div>

          <!-- Address Text -->
          <p class="text-slate-600 text-sm leading-relaxed">
            <span class="font-medium text-slate-800">{{ addr.detail }}</span>, {{ addr.ward }}, {{ addr.district }}, {{ addr.province }}
          </p>
        </div>

        <!-- Footer Action -->
        <div class="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            v-if="!addr.isDefault"
            @click="setDefaultAddress(addr._id)"
            class="text-xs font-bold text-slate-600 hover:text-[#dc2626] bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
            Thiết lập làm mặc định
          </button>
          <span v-else class="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
              <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd" />
            </svg>
            Địa chỉ giao hàng chính
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { addressService } from '@/services/address.service'
import type { Address } from '@/types'
import { useSeoMeta } from '@/composables/useSeoMeta'

useSeoMeta({
  title: 'Sổ địa chỉ nhận hàng',
  description: 'Quản lý danh sách địa chỉ giao hàng tại Trường Thành Bookstore.',
})

const toast = useToast()
const loading = ref(false)
const formLoading = ref(false)
const showForm = ref(false)
const editingId = ref<string | null>(null)
const addresses = ref<Address[]>([])

const initialForm = {
  label: 'Nhà riêng',
  recipientName: '',
  phone: '',
  province: '',
  district: '',
  ward: '',
  detail: '',
  isDefault: false,
}

const form = ref({ ...initialForm })

const isPhoneValid = computed(() => {
  if (!form.value.phone) return false
  return /^0\d{9}$/.test(form.value.phone.trim())
})

function onPhoneInput(e: Event) {
  const input = e.target as HTMLInputElement
  input.value = input.value.replace(/\D/g, '')
  form.value.phone = input.value
}

async function fetchAddresses() {
  loading.value = true
  try {
    addresses.value = await addressService.getAll()
  } catch (err: any) {
    toast.error('Lỗi khi tải danh sách sổ địa chỉ')
  } finally {
    loading.value = false
  }
}

function openAddForm() {
  editingId.value = null
  form.value = { ...initialForm, isDefault: addresses.value.length === 0 }
  showForm.value = true
}

function openEditForm(addr: Address) {
  editingId.value = addr._id
  form.value = {
    label: addr.label,
    recipientName: addr.recipientName,
    phone: addr.phone,
    province: addr.province,
    district: addr.district,
    ward: addr.ward,
    detail: addr.detail,
    isDefault: addr.isDefault,
  }
  showForm.value = true
}

async function saveAddress() {
  if (!isPhoneValid.value) {
    toast.error('Vui lòng nhập số điện thoại Việt Nam hợp lệ (10 chữ số)')
    return
  }

  formLoading.value = true
  try {
    if (editingId.value) {
      await addressService.update(editingId.value, form.value)
      toast.success('Cập nhật địa chỉ nhận hàng thành công!')
    } else {
      await addressService.create(form.value)
      toast.success('Thêm địa chỉ nhận hàng mới thành công!')
    }
    showForm.value = false
    await fetchAddresses()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Lỗi khi lưu thông tin địa chỉ')
  } finally {
    formLoading.value = false
  }
}

async function setDefaultAddress(id: string) {
  try {
    await addressService.setDefault(id)
    toast.success('Đã chuyển đổi địa chỉ mặc định thành công!')
    await fetchAddresses()
  } catch (err: any) {
    toast.error('Lỗi khi thiết lập địa chỉ mặc định')
  }
}

async function deleteAddress(id: string) {
  if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ nhận hàng này không?')) return
  try {
    await addressService.delete(id)
    toast.success('Đã xóa địa chỉ thành công!')
    await fetchAddresses()
  } catch (err: any) {
    toast.error('Lỗi khi xóa địa chỉ')
  }
}

onMounted(() => {
  fetchAddresses()
})
</script>

