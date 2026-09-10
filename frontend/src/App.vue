<template>
  <ErrorBoundary>
    <!-- App Splash Screen during initial Auth Hydration (FE-01) -->
    <div
      v-if="!authStore.isHydrated"
      class="fixed inset-0 bg-white dark:bg-slate-950 flex flex-col items-center justify-center z-50"
    >
      <div class="flex flex-col items-center space-y-4">
        <div
          class="w-12 h-12 rounded-2xl bg-[#dc2626] flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-red-500/30 animate-pulse"
        >
          T
        </div>
        <div class="space-y-1 text-center">
          <p class="text-xs font-black text-slate-800 dark:text-white tracking-widest uppercase">
            Trường Thành Bookstore
          </p>
          <div class="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-semibold">
            <span class="inline-block w-1.5 h-1.5 rounded-full bg-[#dc2626] animate-ping"></span>
            <span>Đang khôi phục phiên...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main View once Hydration completes -->
    <router-view v-else />
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import ErrorBoundary from '@/components/ErrorBoundary.vue'

const authStore = useAuthStore()
const toast = useToast()
let socket: Socket | null = null

function connectSocket() {
  if (socket) {
    socket.disconnect()
  }

  const apiBase =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:3000/api'
  const socketUrl = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase
  socket = io(`${socketUrl}/notifications`, {
    transports: ['websocket'],
    withCredentials: true,
  })

  socket.on('notification_received', (data: any) => {
    toast.info(`${data.title}: ${data.message}`, {
      timeout: 6000,
    })
    // Broadcast notification_received event to update the notification bell count
    window.dispatchEvent(new CustomEvent('notification_received', { detail: data }))
  })
}

function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

watch(
  () => authStore.isAuthenticated,
  (val) => {
    if (val) {
      connectSocket()
    } else {
      disconnectSocket()
    }
  }
)

onMounted(async () => {
  window.addEventListener('auth-session-expired', authStore.clearSession)
  // Ensure initAuth is called even if not routed through router guard
  await authStore.initAuth()
  if (authStore.isAuthenticated) {
    connectSocket()
  }
})

onUnmounted(() => {
  window.removeEventListener('auth-session-expired', authStore.clearSession)
  disconnectSocket()
})
</script>
