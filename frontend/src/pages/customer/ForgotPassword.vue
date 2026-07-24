<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
      <div class="text-center space-y-2">
        <router-link to="/" class="text-2xl font-black text-[#dc2626] uppercase tracking-tight">
          TRƯỜNG THÀNH
        </router-link>
        <h2 class="text-lg font-bold text-slate-800">Quên mật khẩu</h2>
        <p class="text-xs text-slate-400">Đặt lại mật khẩu của bạn thông qua mã xác thực OTP</p>
      </div>

      <!-- Step 1: Request OTP -->
      <form v-if="step === 1" @submit.prevent="handleRequestOtp" class="space-y-4">
        <div>
          <label class="text-xs font-bold text-slate-700">Địa chỉ Email</label>
          <input
            v-model="email"
            type="email"
            required
            autofocus
            placeholder="name@example.com"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center text-sm uppercase tracking-wider shadow-lg shadow-red-500/20 disabled:bg-slate-300 disabled:shadow-none cursor-pointer"
        >
          {{ loading ? 'Đang gửi...' : 'Gửi mã xác thực OTP' }}
        </button>
      </form>

      <!-- Step 2: Verify OTP & Reset Password -->
      <form v-else @submit.prevent="handleResetPassword" class="space-y-4">
        <div class="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 space-y-1">
          <p class="font-bold">Mã OTP đã được gửi!</p>
          <p>Vui lòng kiểm tra email của bạn để lấy mã OTP.</p>
          <p v-if="devOtp" class="text-red-600 font-bold">Mã OTP (Development): {{ devOtp }}</p>
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700">Mã OTP (6 số)</label>
          <input
            v-model="otp"
            type="text"
            required
            maxlength="6"
            placeholder="123456"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm tracking-widest text-center font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700">Mật khẩu mới</label>
          <input
            v-model="newPassword"
            type="password"
            required
            placeholder="••••••••"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center text-sm uppercase tracking-wider shadow-lg shadow-red-500/20 disabled:bg-slate-300 disabled:shadow-none cursor-pointer"
        >
          {{ loading ? 'Đang cập nhật...' : 'Đổi mật khẩu' }}
        </button>

        <button
          type="button"
          @click="step = 1"
          class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl transition-colors text-center text-xs"
        >
          Quay lại nhập Email
        </button>
      </form>

      <div class="text-center text-xs text-slate-500">
        Quay lại trang
        <router-link to="/login" class="text-[#dc2626] hover:underline font-bold">Đăng nhập</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { authService } from '@/services/auth.service'
import { useSeoMeta } from '@/composables/useSeoMeta'

useSeoMeta({
  title: 'Quên mật khẩu',
  description: 'Đặt lại mật khẩu tài khoản Trường Thành Stationery.',
})

const toast = useToast()
const router = useRouter()

const step = ref(1)
const email = ref('')
const otp = ref('')
const newPassword = ref('')
const loading = ref(false)
const devOtp = ref('')

async function handleRequestOtp() {
  if (!email.value) return
  loading.value = true
  try {
    const res = await authService.forgotPassword(email.value)
    toast.success('Mã OTP đã được tạo!')
    if (res.data && res.data.data && res.data.data.otp) {
      devOtp.value = res.data.data.otp
    } else if (res.data && res.data.otp) {
      devOtp.value = res.data.otp
    }
    step.value = 2
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại email.')
  } finally {
    loading.value = false
  }
}

async function handleResetPassword() {
  if (!otp.value || !newPassword.value) return
  if (newPassword.value.length < 6) {
    toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
    return
  }
  loading.value = true
  try {
    await authService.resetPassword({
      email: email.value,
      otp: otp.value,
      newPassword: newPassword.value,
    })
    toast.success('Đổi mật khẩu thành công! Hãy đăng nhập lại.')
    router.push('/login')
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Lỗi đặt lại mật khẩu.')
  } finally {
    loading.value = false
  }
}
</script>
