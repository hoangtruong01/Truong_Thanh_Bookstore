<template>
  <ErrorBoundary>
    <router-view />
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

watch(() => authStore.isAuthenticated, (val) => {
  if (val) {
    connectSocket()
  } else {
    disconnectSocket()
  }
})

onMounted(() => {
  window.addEventListener('auth-session-expired', authStore.clearSession)
  authStore.fetchProfile()
    .then(() => {
      if (authStore.isAuthenticated) connectSocket()
    })
    .catch(() => undefined)
})

onUnmounted(() => {
  window.removeEventListener('auth-session-expired', authStore.clearSession)
  disconnectSocket()
})
</script>
