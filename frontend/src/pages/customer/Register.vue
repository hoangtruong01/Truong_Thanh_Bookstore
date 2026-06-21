<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
      <div class="text-center space-y-2">
        <router-link to="/" class="text-2xl font-black text-[#dc2626] uppercase tracking-tight">
          TRƯỜNG THÀNH
        </router-link>
        <h2 class="text-lg font-bold text-slate-800">Tạo tài khoản mới</h2>
        <p class="text-xs text-slate-400">Đăng ký để nhận những ưu đãi và mua sắm dễ dàng hơn</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="text-xs font-bold text-slate-700">Họ và tên</label>
          <input
            v-model="fullName"
            type="text"
            required
            placeholder="Nguyễn Văn A"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
          />
        </div>
        <div>
          <label class="text-xs font-bold text-slate-700">Địa chỉ Email</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="name@example.com"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
          />
        </div>
        <div>
          <label class="text-xs font-bold text-slate-700">Số điện thoại</label>
          <input
            v-model="phone"
            type="tel"
            placeholder="09xx xxx xxx"
            maxlength="10"
            @input="onPhoneInput"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
            :class="{ 'border-red-300 ring-1 ring-red-300': phone && !isPhoneValid }"
          />
          <p v-if="phone && !isPhoneValid" class="text-[10px] text-red-500 mt-1 font-medium">
            Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0
          </p>
        </div>
        <div>
          <label class="text-xs font-bold text-slate-700">Mật khẩu</label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="Tối thiểu 6 ký tự"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
          />
          <p v-if="password && password.length < 6" class="text-[10px] text-red-500 mt-1 font-medium">
            Mật khẩu phải có ít nhất 6 ký tự
          </p>
        </div>

        <button
          type="submit"
          :disabled="authStore.loading || (phone && !isPhoneValid) || (password && password.length < 6)"
          class="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center text-sm uppercase tracking-wider shadow-lg shadow-red-500/20 disabled:bg-slate-300 disabled:shadow-none cursor-pointer"
        >
          {{ authStore.loading ? 'Đang đăng ký...' : 'Đăng ký tài khoản' }}
        </button>
      </form>

      <div class="text-center text-xs text-slate-500">
        Đã có tài khoản?
        <router-link to="/login" class="text-[#dc2626] hover:underline font-bold">Đăng nhập ngay</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const toast = useToast()
const router = useRouter()

const fullName = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')

// UX-06: Phone number validation for Vietnamese format
const isPhoneValid = computed(() => {
  if (!phone.value) return true
  return /^0\d{9}$/.test(phone.value)
})

function onPhoneInput(e: Event) {
  const input = e.target as HTMLInputElement
  // Only allow digits
  input.value = input.value.replace(/\D/g, '')
  phone.value = input.value
}

async function handleRegister() {
  if (!fullName.value || !email.value || !password.value) return
  if (password.value.length < 6) {
    toast.error('Mật khẩu phải có ít nhất 6 ký tự')
    return
  }
  if (phone.value && !isPhoneValid.value) {
    toast.error('Số điện thoại không hợp lệ')
    return
  }
  try {
    await authStore.register({
      fullName: fullName.value,
      email: email.value,
      phone: phone.value || undefined,
      password: password.value,
    })
    toast.success('Đăng ký tài khoản thành công!')
    router.push('/')
  } catch (err: any) {
    toast.error(err.message || 'Lỗi đăng ký tài khoản')
  }
}
</script>
