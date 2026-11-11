<template>
  <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
    <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">Thông tin giao nhận</h3>

    <!-- Address Selection from Address Book -->
    <div v-if="isAuthenticated && addresses.length > 0" class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 mb-4">
      <label class="text-xs font-bold text-slate-700 block">Chọn nhanh từ Sổ địa chỉ</label>
      <select
        v-model="selectedAddressId"
        class="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
        @change="emit('address-change')"
      >
        <option value="" disabled>-- Chọn địa chỉ --</option>
        <option v-for="addr in addresses" :key="addr._id" :value="addr._id">
          [{{ addr.label }}] {{ addr.recipientName }} - {{ addr.phone }} ({{ addr.detail }}, {{ addr.ward }}, {{ addr.district }}, {{ addr.province }})
        </option>
      </select>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="sm:col-span-2">
        <label class="text-xs font-bold text-slate-700">Họ và tên người nhận</label>
        <input
          v-model="fullName"
          type="text"
          required
          placeholder="Nguyễn Văn A"
          maxlength="100"
          class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
        />
      </div>
      <div>
        <label class="text-xs font-bold text-slate-700">Số điện thoại</label>
        <input
          v-model="phone"
          type="tel"
          required
          placeholder="09xx xxx xxx"
          maxlength="10"
          class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
          :class="{ 'border-red-300 ring-1 ring-red-300': phone && !phoneValid }"
          @input="onPhoneInput"
        />
        <p v-if="phone && !phoneValid" class="text-[10px] text-red-500 mt-1 font-medium">
          Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0
        </p>
      </div>
      <div>
        <label class="text-xs font-bold text-slate-700">Địa chỉ Email</label>
        <input
          v-model="email"
          type="email"
          required
          placeholder="customer@example.com"
          maxlength="100"
          class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
        />
      </div>
      <div class="sm:col-span-2">
        <label class="text-xs font-bold text-slate-700">Địa chỉ giao hàng chi tiết</label>
        <input
          v-model="address"
          type="text"
          required
          placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
          maxlength="200"
          class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
        />
      </div>
      <div class="sm:col-span-2">
        <label class="text-xs font-bold text-slate-700">Ghi chú đơn hàng (Tùy chọn)</label>
        <textarea
          v-model="note"
          rows="3"
          placeholder="Ví dụ: Giao giờ hành chính, gọi điện trước khi giao..."
          maxlength="500"
          class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Address } from '@/types'

/**
 * Shipping recipient form + address-book picker. The page owns every field (v-model) and
 * applies the picked address on `address-change`; phone validity is decided by the page.
 */
defineProps<{
  addresses: Address[]
  isAuthenticated: boolean
  phoneValid: boolean
}>()

const emit = defineEmits<{
  'address-change': []
}>()

const selectedAddressId = defineModel<string>('selectedAddressId', { default: '' })
const fullName = defineModel<string>('fullName', { default: '' })
const phone = defineModel<string>('phone', { default: '' })
const email = defineModel<string>('email', { default: '' })
const address = defineModel<string>('address', { default: '' })
const note = defineModel<string>('note', { default: '' })

// UX-06: digits only
function onPhoneInput(e: Event) {
  const input = e.target as HTMLInputElement
  input.value = input.value.replace(/\D/g, '')
  phone.value = input.value
}
</script>
