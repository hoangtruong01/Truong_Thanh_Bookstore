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

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const socketUrl = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase
  const userId = authStore.user?._id

  socket = io(`${socketUrl}/notifications`, {
    query: {
      userId: userId || '',
    },
    transports: ['websocket'],
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
  if (authStore.isAuthenticated) {
    connectSocket()
  }
})

onUnmounted(() => {
  disconnectSocket()
})
</script>
