<template>
  <!-- Offline Network Banner -->
  <div
    v-if="!isOnline"
    class="fixed top-0 inset-x-0 z-[9999] bg-amber-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-md animate-pulse"
  >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 flex-shrink-0">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
    <span>Bạn đang ở chế độ ngoại tuyến. Một số tính năng có thể bị gián đoạn.</span>
  </div>

  <!-- FE-01: Auth Hydration Splash / Loading State -->
  <div
    v-if="!authStore.isHydrated"
    class="fixed inset-0 z-[9998] bg-white flex flex-col items-center justify-center p-6 space-y-6"
  >
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-red-500/30 animate-pulse">
        TT
      </div>
      <div>
        <h1 class="text-xl font-black text-slate-900 tracking-tight">TRƯỜNG THÀNH</h1>
        <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Bookstore & Stationery</p>
      </div>
    </div>
    <div class="flex items-center gap-3 text-slate-500 text-xs font-semibold">
      <svg class="animate-spin h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Đang kiểm tra phiên làm việc...</span>
    </div>
  </div>

  <ErrorBoundary v-else>
    <router-view />
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import { useOnline } from '@vueuse/core'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import ErrorBoundary from '@/components/ErrorBoundary.vue'

const authStore = useAuthStore()
const toast = useToast()
const isOnline = useOnline()
let socket: Socket | null = null

// Watch online/offline transitions
watch(isOnline, (online, prev) => {
  if (prev === false && online === true) {
    toast.success('Đã khôi phục kết nối mạng!')
  }
})

function connectSocket() {
  if (socket) {
    socket.disconnect()
  }

  const apiBase = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const socketUrl = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase
  socket = io(`${socketUrl}/notifications`, {
    transports: ['websocket'],
    withCredentials: true,
  })

  socket.on('notification_received', (data: any) => {
    toast.info(`${data.title}: ${data.message}`, {
      timeout: 6000,
    })
    window.dispatchEvent(new CustomEvent('notification_received', { detail: data }))
  })
}

function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

watch(() => authStore.isAuthenticated, (val) => {
  if (val) {
    connectSocket()
  } else {
    disconnectSocket()
  }
})

onMounted(async () => {
  window.addEventListener('auth-session-expired', authStore.clearSession)
  if (!authStore.isHydrated) {
    await authStore.hydrateAuth().catch(() => undefined)
  }
  if (authStore.isAuthenticated) {
    connectSocket()
  }
})

onUnmounted(() => {
  window.removeEventListener('auth-session-expired', authStore.clearSession)
  disconnectSocket()
})
</script>
