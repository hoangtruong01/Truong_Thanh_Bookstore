<template>
  <div id="customer-notification-dropdown-container" ref="containerRef" class="relative hidden md:block">
    <button
      class="relative text-slate-700 hover:text-[#dc2626] transition-colors cursor-pointer p-1"
      title="Thông báo"
      aria-label="Thông báo"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="2"
        stroke="currentColor"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
        />
      </svg>
      <!-- Unread count badge -->
      <span
        v-if="unreadCount > 0"
        data-testid="notification-badge"
        class="absolute top-0 right-0 w-4 h-4 bg-red-600 text-[9px] font-black text-white rounded-full flex items-center justify-center border border-white"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden"
    >
      <!-- Header -->
      <div class="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <span class="text-xs font-black text-slate-800 uppercase tracking-wider">Thông báo của bạn</span>
        <button
          v-if="unreadCount > 0"
          class="text-[10px] font-extrabold text-[#dc2626] hover:underline cursor-pointer"
          @click="markAllAsRead"
        >
          Đọc tất cả
        </button>
      </div>

      <!-- List -->
      <div class="max-h-80 overflow-y-auto divide-y divide-slate-100 scrollbar-none">
        <div v-if="!authStore.isAuthenticated" class="p-6 text-center text-xs text-slate-400 font-medium">
          Vui lòng đăng nhập để xem thông báo.
        </div>
        <div v-else-if="notifications.length === 0" class="p-6 text-center text-xs text-slate-400 font-medium">
          Không có thông báo nào.
        </div>
        <div
          v-for="item in notifications"
          v-else
          :key="item._id"
          data-testid="notification-item"
          class="p-3.5 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
          :class="{ 'bg-red-50/5 font-semibold': !item.isRead }"
          @click="handleNotificationClick(item)"
        >
          <!-- Icon -->
          <div
            class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-xs"
            :class="{
              'bg-red-50 text-red-600 border border-red-100': item.type === 'order',
              'bg-orange-50 text-orange-600 border border-orange-100': item.type === 'promotion',
              'bg-amber-50 text-amber-600 border border-amber-100': item.type === 'loyalty' || item.type === 'tier',
              'bg-purple-50 text-purple-600 border border-purple-100': item.type === 'review',
              'bg-blue-50 text-blue-600 border border-blue-100': item.type === 'system',
            }"
          >
            <span v-if="item.type === 'order'">📦</span>
            <span v-else-if="item.type === 'promotion'">🎁</span>
            <span v-else-if="item.type === 'loyalty'">🪙</span>
            <span v-else-if="item.type === 'tier'">🏆</span>
            <span v-else-if="item.type === 'review'">⭐</span>
            <span v-else>🔔</span>
          </div>

          <!-- Content -->
          <div class="flex-grow min-w-0">
            <div class="flex justify-between items-baseline gap-1">
              <span class="text-xs font-bold text-slate-800 truncate">{{ item.title }}</span>
              <span class="text-[9px] text-slate-400 font-medium whitespace-nowrap">{{
                formatTimeAgo(item.createdAt)
              }}</span>
            </div>
            <p class="text-[11px] text-slate-600 leading-relaxed mt-0.5 line-clamp-2 font-medium">
              {{ item.message }}
            </p>
          </div>

          <!-- Unread dot -->
          <div v-if="!item.isRead" class="flex-shrink-0 self-center">
            <div class="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { notificationService } from '@/services/notification.service'

interface CustomerNotification {
  _id: string
  title: string
  message: string
  type?: string
  /** Read state computed by the backend for the current user (direct and broadcast). */
  isRead?: boolean
  createdAt: string
  meta?: Record<string, unknown> & { orderId?: string }
}

const emit = defineEmits<{ (e: 'open-profile'): void }>()

/** How often the unread badge is refreshed when no realtime event arrives. */
const UNREAD_POLL_MS = 30000

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const containerRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const notifications = ref<CustomerNotification[]>([])
const unreadCount = ref(0)

function toCount(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null
}

async function fetchUnreadCount() {
  if (!authStore.isAuthenticated) {
    unreadCount.value = 0
    return
  }
  try {
    const res: any = await notificationService.getUnreadCount()
    const payload = res.data?.data ?? res.data
    const count = toCount(payload?.unreadCount)
    if (count !== null) unreadCount.value = count
  } catch {
    // keep the last known count; the next poll / realtime event retries
  }
}

async function fetchNotifications() {
  if (!authStore.isAuthenticated) {
    notifications.value = []
    return
  }
  try {
    const res: any = await notificationService.getMyNotifications()
    const raw = res.data?.data || res.data
    if (Array.isArray(raw)) {
      notifications.value = raw
    } else if (raw && Array.isArray(raw.items)) {
      notifications.value = raw.items
      const count = toCount(raw.unreadCount)
      if (count !== null) unreadCount.value = count
    } else {
      notifications.value = []
    }
  } catch {
    notifications.value = []
    console.error('Failed to fetch customer notifications')
  }
}

function toggle(event: Event) {
  event.stopPropagation()
  isOpen.value = !isOpen.value
  if (isOpen.value) fetchNotifications()
}

async function markAllAsRead() {
  const unread = notifications.value.filter((n) => n && !n.isRead)
  const previousCount = unreadCount.value
  unread.forEach((n) => (n.isRead = true))
  unreadCount.value = 0
  try {
    await notificationService.markAllAsRead()
  } catch {
    unread.forEach((n) => (n.isRead = false))
    unreadCount.value = previousCount
    toast.error('Không thể đánh dấu đã đọc. Vui lòng thử lại.')
  }
}

async function markAsRead(item: CustomerNotification) {
  if (item.isRead) return
  item.isRead = true
  unreadCount.value = Math.max(0, unreadCount.value - 1)
  try {
    await notificationService.markAsRead(item._id)
  } catch {
    // Roll back silently: the user is already navigating to the target page.
    item.isRead = false
    unreadCount.value += 1
  }
}

function handleNotificationClick(item: CustomerNotification) {
  void markAsRead(item)
  isOpen.value = false

  if (item.type === 'order' || item.meta?.orderId) {
    router.push('/my-orders')
  } else if (item.type === 'loyalty' || item.type === 'tier') {
    emit('open-profile')
  } else if (item.type === 'promotion') {
    router.push('/products')
  } else if (item.type === 'review') {
    router.push('/my-orders')
  }
}

function formatTimeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'Vừa xong'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`

  const days = Math.floor(hours / 24)
  if (days === 1) return 'Hôm qua'
  return `${days} ngày trước`
}

function handleClickOutside(event: MouseEvent) {
  const el = containerRef.value
  if (el && !el.contains(event.target as Node)) isOpen.value = false
}

/** Socket events are re-dispatched on window by App.vue. */
function handleRealtimeNotification() {
  fetchUnreadCount()
  if (isOpen.value) fetchNotifications()
}

watch(
  () => authStore.isAuthenticated,
  (val) => {
    if (val) {
      fetchUnreadCount()
    } else {
      notifications.value = []
      unreadCount.value = 0
    }
  },
)

watch(
  () => route.fullPath,
  () => {
    isOpen.value = false
  },
)

let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
  window.addEventListener('notification_received', handleRealtimeNotification)
  fetchUnreadCount()
  pollTimer = setInterval(() => {
    if (authStore.isAuthenticated) fetchUnreadCount()
  }, UNREAD_POLL_MS)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
  window.removeEventListener('notification_received', handleRealtimeNotification)
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
