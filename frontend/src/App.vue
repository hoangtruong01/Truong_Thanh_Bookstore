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
  <Transition name="splash-fade">
    <div
      v-if="!authStore.isHydrated"
      class="fixed inset-0 z-[9998] bg-gradient-to-br from-slate-50 via-white to-red-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-6 select-none overflow-hidden"
    >
      <!-- Ambient Background Glows -->
      <div class="absolute -top-32 -left-32 w-80 h-80 bg-red-500/10 dark:bg-red-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-soft"></div>
      <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 dark:bg-rose-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-soft"></div>

      <!-- Main Splash Card (Enlarged, Minimalist & Borderless Logo) -->
      <div class="relative z-10 flex flex-col items-center text-center max-w-md px-6 py-10">
        <!-- Logo: Directly rounded-full with soft halo glow, no box frame -->
        <div class="relative mb-6">
          <div class="absolute -inset-3 bg-gradient-to-tr from-red-600/30 via-rose-500/20 to-amber-500/20 rounded-full blur-xl pointer-events-none animate-pulse-soft"></div>
          <img
            src="@/assets/logo.webp"
            alt="Trường Thành Bookstore"
            class="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover shadow-2xl shadow-red-500/25 ring-4 ring-white/90 dark:ring-slate-800/90"
          />
        </div>

        <!-- Brand Titles (Enlarged Typography) -->
        <div class="space-y-2 mb-8">
          <h1 class="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
            <span>TRƯỜNG THÀNH</span>
            <span class="w-2 h-2 rounded-full bg-red-600 inline-block animate-ping"></span>
          </h1>
          <p class="text-xs sm:text-sm uppercase tracking-[0.28em] text-red-600 dark:text-red-400 font-extrabold">
            Bookstore & Stationery
          </p>
          <p class="text-sm text-slate-400 dark:text-slate-500 font-medium">
            Đồng hành cùng tri thức & sáng tạo
          </p>
        </div>

        <!-- Sleek Indeterminate Shimmer Progress Bar -->
        <div class="w-64 sm:w-72 h-1.5 bg-slate-200/90 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
          <div class="absolute inset-y-0 w-2/5 bg-gradient-to-r from-transparent via-red-600 to-transparent rounded-full animate-shimmer-slide"></div>
        </div>
      </div>
    </div>
  </Transition>

  <ErrorBoundary v-if="authStore.isHydrated">
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

<style scoped>
@keyframes shimmer-slide {
  0% {
    left: -40%;
  }
  100% {
    left: 140%;
  }
}

.animate-shimmer-slide {
  animation: shimmer-slide 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.splash-fade-enter-active,
.splash-fade-leave-active {
  transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.splash-fade-enter-from,
.splash-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
