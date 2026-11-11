<template>
  <div class="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 max-w-2xl mx-auto space-y-6 shadow-xs">
    <div class="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-10 h-10"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
    </div>

    <div class="space-y-2 text-center">
      <h2 class="text-2xl font-extrabold text-slate-800">Đặt hàng thành công!</h2>
      <p class="text-slate-500 text-sm">
        Cảm ơn quý khách đã đặt mua tại Nhà Sách Trường Thành.
      </p>
    </div>

    <!-- Tóm tắt mã đơn và thông tin thanh toán -->
    <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs">
      <div class="flex justify-between items-center pb-3 border-b border-slate-200/80">
        <span class="text-slate-500 font-medium">Mã đơn hàng:</span>
        <div class="flex items-center gap-2">
          <span class="font-mono font-black text-slate-900 text-sm">#{{ orderCode }}</span>
          <button
            type="button"
            class="text-[#dc2626] hover:underline font-bold text-[11px] cursor-pointer"
            @click="copyText(orderCode, 'Mã đơn hàng')"
          >
            Sao chép
          </button>
        </div>
      </div>

      <div class="flex justify-between items-center">
        <span class="text-slate-500 font-medium">Người nhận:</span>
        <span class="font-bold text-slate-800">{{ recipient.fullName }} ({{ recipient.phone }})</span>
      </div>

      <div class="flex justify-between items-center">
        <span class="text-slate-500 font-medium">Địa chỉ giao:</span>
        <span class="font-bold text-slate-800 text-right max-w-[320px] truncate">{{ recipient.address }}</span>
      </div>

      <div class="flex justify-between items-center">
        <span class="text-slate-500 font-medium">Phương thức:</span>
        <span class="font-bold text-slate-800">{{ paymentMethodLabel }}</span>
      </div>

      <div class="flex justify-between items-center pt-2 border-t border-slate-200/80 text-sm">
        <span class="font-black text-slate-900">Tổng thanh toán:</span>
        <span class="font-black text-[#dc2626] text-base">{{ formatCurrency(total) }}</span>
      </div>
    </div>

    <!-- Hướng dẫn chuyển khoản ngân hàng (nếu chọn BANK_TRANSFER) -->
    <div v-if="paymentMethod === 'BANK_TRANSFER'" class="bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200 rounded-2xl p-6 space-y-4">
      <div class="flex items-center gap-2">
        <span class="text-lg">🏦</span>
        <h3 class="font-extrabold text-amber-900 text-sm uppercase tracking-wide">Hướng dẫn thanh toán chuyển khoản ngân hàng</h3>
      </div>
      <p class="text-xs text-amber-800 leading-relaxed">
        Quý khách vui lòng chuyển khoản theo đúng thông tin bên dưới và ghi rõ mã đơn hàng trong nội dung chuyển khoản. Nhân viên nhà sách sẽ kiểm tra đối soát và xử lý giao hàng ngay sau khi nhận được tiền.
      </p>

      <div v-if="bankTransferConfig && bankTransferConfig.accountNumber" class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-white p-4 rounded-xl border border-amber-200">
        <div class="text-center">
          <img
            :src="vietQrUrl"
            alt="VietQR Mã Đơn Hàng"
            class="w-44 h-44 mx-auto rounded-lg border border-slate-200 p-1 shadow-xs"
          />
          <span class="text-[10.5px] text-slate-400 mt-1 block">Quét QR bằng mọi App Ngân hàng</span>
        </div>

        <div class="space-y-2 text-xs text-slate-700">
          <div>
            <span class="text-slate-400 block text-[10px] uppercase font-bold">Ngân hàng thụ hưởng</span>
            <strong class="text-slate-900">{{ bankTransferConfig.bankName || 'Ngân hàng' }}</strong>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px] uppercase font-bold">Số tài khoản</span>
            <div class="flex items-center gap-2">
              <strong class="font-mono text-slate-900 text-sm">{{ bankTransferConfig.accountNumber }}</strong>
              <button type="button" class="text-xs font-bold text-red-600 hover:underline" @click="copyText(bankTransferConfig.accountNumber, 'Số tài khoản')">Copy</button>
            </div>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px] uppercase font-bold">Chủ tài khoản</span>
            <strong class="text-slate-900">{{ bankTransferConfig.accountHolder || 'TRUONG THANH BOOKSTORE' }}</strong>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px] uppercase font-bold">Số tiền chuyển</span>
            <div class="flex items-center gap-2">
              <strong class="text-[#dc2626] font-bold text-sm">{{ formatCurrency(total) }}</strong>
              <button type="button" class="text-xs font-bold text-red-600 hover:underline" @click="copyText(total.toString(), 'Số tiền')">Copy</button>
            </div>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px] uppercase font-bold">Nội dung chuyển khoản (bắt buộc)</span>
            <div class="flex items-center gap-2">
              <strong class="font-mono text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-sm">{{ orderCode }}</strong>
              <button type="button" class="text-xs font-bold text-red-600 hover:underline" @click="copyText(orderCode, 'Nội dung chuyển khoản')">Copy</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="bg-white p-4 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
        <p>Mã đơn hàng: <strong class="font-mono text-red-600">#{{ orderCode }}</strong></p>
        <p>Số tiền cần thanh toán: <strong class="text-red-600">{{ formatCurrency(total) }}</strong></p>
        <p class="text-slate-600">Vui lòng liên hệ hotline: <strong>0982938316</strong> để được hỗ trợ hướng dẫn thông tin tài khoản chuyển khoản.</p>
      </div>
    </div>

    <!-- Thông báo cho COD -->
    <div v-else-if="paymentMethod === 'COD'" class="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800 flex items-start gap-3">
      <span class="text-lg mt-0.5">📦</span>
      <div>
        <p class="font-bold text-blue-900">{{ PAYMENT_METHOD_LABELS.COD }}</p>
        <p class="mt-0.5 text-blue-700">Đơn hàng sẽ được đóng gói và giao đến quý khách trong 2 - 4 ngày làm việc. Quý khách vui lòng chuẩn bị số tiền <strong>{{ formatCurrency(total) }}</strong> khi nhận hàng.</p>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row justify-center gap-3 pt-2">
      <router-link
        v-if="orderId"
        :to="isAuthenticated ? `/my-orders/${orderId}` : `/guest-orders/${orderId}`"
        class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-3 px-8 rounded-xl transition-colors inline-block text-sm text-center shadow-md shadow-red-500/20"
      >
        Xem tình trạng đơn hàng
      </router-link>
      <router-link to="/products" class="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-8 rounded-xl transition-colors inline-block text-sm text-center">
        Tiếp tục mua sách
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from 'vue-toastification'
import type { BankTransferConfig } from '@/services/payment.service'
import { PAYMENT_METHOD_LABELS, formatCurrency, getPaymentMethodLabel } from '@/utils/helpers'
import type { CheckoutPaymentMethod, CheckoutRecipient } from './types'

/** Order-placed screen. `total` is the server's order total (never recomputed here). */
const props = defineProps<{
  orderCode: string
  orderId: string
  recipient: CheckoutRecipient
  paymentMethod: CheckoutPaymentMethod
  total: number
  bankTransferConfig: BankTransferConfig | null
  isAuthenticated: boolean
}>()

const toast = useToast()

const paymentMethodLabel = computed(() => getPaymentMethodLabel(props.paymentMethod))

const vietQrUrl = computed(() => {
  const config = props.bankTransferConfig
  if (!config) return ''
  return `https://img.vietqr.io/image/${encodeURIComponent(config.bankName || 'MB')}-${encodeURIComponent(config.accountNumber)}-compact2.png?amount=${props.total}&addInfo=${encodeURIComponent(props.orderCode)}&accountName=${encodeURIComponent(config.accountHolder || 'TRUONG THANH BOOKSTORE')}`
})

function copyText(text: string, label: string) {
  navigator.clipboard.writeText(text)
  toast.success(`Đã sao chép ${label}!`)
}
</script>
