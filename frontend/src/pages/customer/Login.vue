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
            autofocus
            placeholder="name@example.com"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
          />
        </div>
        <div>
          <div class="flex justify-between items-center">
            <label class="text-xs font-bold text-slate-700">Mật khẩu</label>
          </div>
          <div class="relative mt-1">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              placeholder="••••••••"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-1 rounded"
              title="Hiện/Ẩn mật khẩu"
            >
              <!-- Eye open icon -->
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815L21 21m-3.956-3.956-3.09-3.09m0 0a3 3 0 1 0-4.367-4.367l3.438 3.438Z" />
              </svg>
              <!-- Eye closed icon -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </button>
          </div>
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
const showPassword = ref(false)

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
