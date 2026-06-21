<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
      <div class="text-center space-y-2">
        <router-link to="/" class="text-2xl font-black text-[#dc2626] uppercase tracking-tight">
          TRƯỜNG THÀNH
        </router-link>
        <h2 class="text-lg font-bold text-slate-800">Đăng nhập tài khoản</h2>
        <p class="text-xs text-slate-400">Chào mừng bạn quay lại hệ thống văn phòng phẩm</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
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
          <div class="flex justify-between items-center">
            <label class="text-xs font-bold text-slate-700">Mật khẩu</label>
          </div>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
          />
        </div>

        <button
          type="submit"
          :disabled="authStore.loading"
          class="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center text-sm uppercase tracking-wider shadow-lg shadow-red-500/20 disabled:bg-slate-300 disabled:shadow-none cursor-pointer"
        >
          {{ authStore.loading ? 'Đang xử lý...' : 'Đăng nhập' }}
        </button>
      </form>

      <div class="text-center text-xs text-slate-500">
        Chưa có tài khoản?
        <router-link to="/register" class="text-[#dc2626] hover:underline font-bold">Đăng ký ngay</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const toast = useToast()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')

async function handleLogin() {
  if (!email.value || !password.value) return
  try {
    const res = await authStore.login(email.value, password.value)
    toast.success('Đăng nhập thành công!')
    
    // Redirect logic
    if (authStore.isStaff) {
      router.push('/admin/dashboard')
    } else {
      const redirect = route.query.redirect as string
      router.push(redirect || '/')
    }
  } catch (err: any) {
    toast.error(err.message || 'Sai tài khoản hoặc mật khẩu')
  }
}
</script>
