<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-250 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showPopup && popup"
        class="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs select-none"
        role="dialog"
        aria-modal="true"
        :aria-label="popup.title || 'Quảng cáo mở website'"
        @click.self="onBackdropClick"
      >
        <!-- Modal Container with scale animation -->
        <Transition
          enter-active-class="transition-all duration-250 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-2"
        >
          <div
            v-if="showPopup"
            class="relative w-full max-w-[92vw] sm:max-w-[620px] md:max-w-[760px] lg:max-w-[850px] flex flex-col items-center"
          >
            <!-- Close Button -->
            <div
              v-if="isCloseable"
              class="w-full flex justify-end pb-2 sm:pb-3"
            >
              <button
                ref="closeBtnRef"
                type="button"
                class="group w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/20 hover:bg-white text-white hover:text-slate-900 backdrop-blur-md border border-white/30 shadow-lg flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white active:scale-95"
                aria-label="Đóng quảng cáo"
                title="Đóng quảng cáo (ESC)"
                @click="closePopup"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2.5"
                  stroke="currentColor"
                  class="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:rotate-90 duration-200"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Ad Content Box -->
            <div
              class="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900/30 border border-white/15 shadow-2xl backdrop-blur-xs flex flex-col items-center"
              :class="{ 'cursor-pointer': hasLink }"
              @click="handleContentClick"
            >
              <!-- Ad Image with responsive picture support -->
              <picture class="w-full flex justify-center">
                <source
                  v-if="popup.mobileImageUrl"
                  media="(max-width: 639px)"
                  :srcset="popup.mobileImageUrl"
                />
                <img
                  :src="popup.imageUrl"
                  :alt="popup.altText || popup.title || 'Quảng cáo'"
                  class="w-full h-auto max-h-[68vh] sm:max-h-[72vh] object-contain transition-transform duration-300 hover:scale-[1.01]"
                  loading="eager"
                  @error="handleImageError"
                />
              </picture>
            </div>

            <!-- CTA Button Bar (if link or custom CTA provided) -->
            <div
              v-if="hasLink || popup.ctaLabel"
              class="mt-3 sm:mt-4 flex items-center justify-center w-full"
            >
              <button
                ref="ctaBtnRef"
                type="button"
                class="bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] text-white font-black text-sm sm:text-base px-8 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-xl shadow-red-950/40 hover:shadow-red-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-2 cursor-pointer border border-red-400/30 tracking-wide focus:outline-none focus:ring-2 focus:ring-white"
                @click="handleCtaClick"
              >
                <span>{{ popup.ctaLabel || 'MỞ / XEM NGAY' }}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2.5"
                  stroke="currentColor"
                  class="w-4 h-4 sm:w-5 sm:h-5"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { bannerService } from '@/services/banner.service'

interface PopupBanner {
  _id: string
  title: string
  imageUrl: string
  mobileImageUrl?: string | null
  altText?: string
  linkUrl?: string
  targetType?: string
  targetRef?: string
  position: string
  frequency?: 'EVERY_VISIT' | 'ONCE_PER_SESSION' | 'ONCE_PER_DAY'
  startAt?: string | null
  endAt?: string | null
  ctaLabel?: string
  closeable?: boolean
  delayMs?: number
  allowedRouteNames?: string[]
  isActive: boolean
  updatedAt?: string
}

interface Props {
  previewMode?: boolean
  previewData?: PopupBanner | null
}

const props = withDefaults(defineProps<Props>(), {
  previewMode: false,
  previewData: null,
})

const route = useRoute()
const router = useRouter()
const showPopup = ref(false)
const popup = ref<PopupBanner | null>(null)
let previousOverflow = ''
let lastFocusedElement: HTMLElement | null = null
let delayTimer: ReturnType<typeof setTimeout> | null = null

const closeBtnRef = ref<HTMLButtonElement | null>(null)
const ctaBtnRef = ref<HTMLButtonElement | null>(null)

const EXCLUDED_ROUTE_NAMES = [
  'Cart',
  'Checkout',
  'MyOrders',
  'OrderTracking',
  'Login',
  'Register',
]

function isRouteExcluded(): boolean {
  if (props.previewMode) return false
  const name = String(route?.name || '')
  const path = String(route?.path || '')
  if (EXCLUDED_ROUTE_NAMES.includes(name)) return true
  if (
    path.startsWith('/checkout') ||
    path.startsWith('/cart') ||
    path.startsWith('/admin')
  ) {
    return true
  }
  return false
}

function clearPendingTimer() {
  if (delayTimer) {
    clearTimeout(delayTimer)
    delayTimer = null
  }
}

watch(
  () => route?.path,
  () => {
    if (isRouteExcluded()) {
      clearPendingTimer()
      if (showPopup.value) {
        closePopup()
      }
    }
  },
)

const isCloseable = computed(() => {
  return popup.value?.closeable !== false
})

const hasLink = computed(() => {
  const p = popup.value
  if (!p) return false
  if (p.targetType && p.targetType !== 'NONE') return true
  const link = p.linkUrl?.trim()
  return Boolean(link && isSafeUrl(link))
})

function isSafeUrl(url: string): boolean {
  if (!url) return false
  const trimmed = url.trim()
  const lower = trimmed.toLowerCase()
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:')
  ) {
    return false
  }
  return (
    trimmed.startsWith('/') ||
    lower.startsWith('http://') ||
    lower.startsWith('https://')
  )
}

function getVietnamDateString(): string {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000
  const vnTime = new Date(utcMs + 7 * 3600000)
  return vnTime.toISOString().slice(0, 10)
}

function shouldShowByFrequency(banner: PopupBanner): boolean {
  if (props.previewMode) return true
  const freq = banner.frequency || 'EVERY_VISIT'
  if (freq === 'EVERY_VISIT') {
    return true
  }

  const bannerId = banner._id
  const version = banner.updatedAt || 'v1'

  if (freq === 'ONCE_PER_SESSION') {
    try {
      const sessionKey = `entry_ad_seen_${bannerId}_${version}`
      if (sessionStorage.getItem(sessionKey)) {
        return false
      }
    } catch {
      return true
    }
  }

  if (freq === 'ONCE_PER_DAY') {
    try {
      const todayStr = getVietnamDateString()
      const dayKey = `entry_ad_seen_${bannerId}_${todayStr}`
      if (localStorage.getItem(dayKey)) {
        return false
      }
    } catch {
      return true
    }
  }

  return true
}

function markSeen(banner: PopupBanner) {
  if (props.previewMode) return
  const freq = banner.frequency || 'EVERY_VISIT'
  const bannerId = banner._id
  const version = banner.updatedAt || 'v1'

  if (freq === 'ONCE_PER_SESSION') {
    try {
      const sessionKey = `entry_ad_seen_${bannerId}_${version}`
      sessionStorage.setItem(sessionKey, '1')
    } catch {
      // Ignore private browsing storage quota exceptions
    }
  }

  if (freq === 'ONCE_PER_DAY') {
    try {
      const todayStr = getVietnamDateString()
      const dayKey = `entry_ad_seen_${bannerId}_${todayStr}`
      localStorage.setItem(dayKey, '1')
    } catch {
      // Ignore private browsing storage quota exceptions
    }
  }
}

function lockScroll() {
  if (typeof document !== 'undefined') {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
}

function unlockScroll() {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = previousOverflow || ''
  }
}

function openModal(data: PopupBanner) {
  popup.value = data
  if (typeof document !== 'undefined') {
    lastFocusedElement = document.activeElement as HTMLElement | null
  }
  showPopup.value = true
  lockScroll()

  if (!props.previewMode && data._id) {
    bannerService.recordImpression(data._id).catch(() => {})
  }

  setTimeout(() => {
    if (closeBtnRef.value) {
      closeBtnRef.value.focus()
    } else if (ctaBtnRef.value) {
      ctaBtnRef.value.focus()
    }
  }, 50)
}

function closePopup() {
  if (!isCloseable.value) return
  clearPendingTimer()
  if (popup.value && !props.previewMode) {
    markSeen(popup.value)
  }
  showPopup.value = false
  unlockScroll()

  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    try {
      lastFocusedElement.focus()
    } catch {
      // Focus restoration fallback
    }
  }
}

function onBackdropClick() {
  if (isCloseable.value) {
    closePopup()
  }
}

function handleContentClick() {
  if (hasLink.value) {
    navigateLink()
  }
}

function handleCtaClick() {
  if (hasLink.value) {
    navigateLink()
  } else {
    closePopup()
  }
}

function navigateLink() {
  const p = popup.value
  if (!p) return

  if (!props.previewMode && p._id) {
    bannerService.recordClick(p._id).catch(() => {})
    markSeen(p)
  }

  showPopup.value = false
  unlockScroll()

  const targetType = p.targetType || 'INTERNAL_PATH'
  const targetRef = p.targetRef?.trim()
  const link = p.linkUrl?.trim()

  if (targetType === 'PRODUCT' && targetRef) {
    router.push(`/products/${targetRef}`)
    return
  }
  if (targetType === 'LANDING_PAGE' && targetRef) {
    router.push(`/t/${targetRef}`)
    return
  }
  if (targetType === 'CATEGORY' && targetRef) {
    router.push(`/products?category=${encodeURIComponent(targetRef)}`)
    return
  }
  if (targetType === 'EXTERNAL_HTTPS' && (link || targetRef)) {
    const url = link || targetRef || ''
    if (url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
    return
  }
  if (targetType === 'NONE') {
    return
  }

  if (link && isSafeUrl(link)) {
    if (link.startsWith('/')) {
      router.push(link)
    } else {
      window.open(link, '_blank', 'noopener,noreferrer')
    }
  }
}

function handleImageError() {
  clearPendingTimer()
  showPopup.value = false
  unlockScroll()
}

function handleKeydown(e: KeyboardEvent) {
  if (!showPopup.value) return
  if (e.key === 'Escape' && isCloseable.value) {
    e.preventDefault()
    closePopup()
    return
  }

  if (e.key === 'Tab') {
    const focusable = [closeBtnRef.value, ctaBtnRef.value].filter(
      Boolean,
    ) as HTMLElement[]
    if (focusable.length < 2) return
    const firstEl = focusable[0]
    const lastEl = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      }
    } else {
      if (document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }
  }
}

async function loadActivePopup() {
  if (isRouteExcluded()) return

  if (props.previewMode && props.previewData) {
    openModal(props.previewData)
    return
  }

  try {
    const res = await bannerService.getActivePopup()
    const data = res?.data ?? res
    if (!data || !data.imageUrl) {
      return
    }

    const now = Date.now()
    if (data.startAt && new Date(data.startAt).getTime() > now) {
      return
    }
    if (data.endAt && new Date(data.endAt).getTime() < now) {
      return
    }

    if (!shouldShowByFrequency(data)) {
      return
    }

    clearPendingTimer()
    const delay = typeof data.delayMs === 'number' ? data.delayMs : 0
    if (delay > 0) {
      delayTimer = setTimeout(() => {
        if (!isRouteExcluded()) {
          openModal(data)
        }
      }, delay)
    } else {
      openModal(data)
    }
  } catch {
    showPopup.value = false
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown)
  }
  loadActivePopup()
})

onUnmounted(() => {
  clearPendingTimer()
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
  unlockScroll()
})
</script>
