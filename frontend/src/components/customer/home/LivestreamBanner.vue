<template>
  <div
    v-if="activeLive && !dismissed"
    class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-4 shadow-lg border border-red-400/30 my-4"
  >
    <!-- Background Glow Elements -->
    <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

    <div class="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <!-- Left: Indicator & Title -->
      <div class="flex items-center gap-3">
        <!-- Pulsing Live Badge -->
        <div class="flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-black tracking-wide border border-white/20">
          <span class="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
          <span>🔴 LIVE</span>
        </div>

        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-extrabold uppercase tracking-wider text-amber-200">
              Trực tiếp trên {{ getPlatformLabel(activeLive.platform) }}
            </span>
          </div>
          <h3 class="text-sm font-black text-white line-clamp-1">
            {{ activeLive.title }}
          </h3>
        </div>
      </div>

      <!-- Right: Action & Close -->
      <div class="flex items-center gap-2 self-end sm:self-center">
        <a
          :href="activeLive.streamUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="bg-white hover:bg-slate-100 text-red-600 font-black text-xs px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          @click="recordLiveClick"
        >
          <span>Xem ngay</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>

        <button
          class="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white/80 hover:text-white transition-colors cursor-pointer"
          title="Ẩn thông báo"
          @click="dismissed = true"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { livestreamService, type LivestreamSession } from '@/services/livestream.service'
import { trackingService } from '@/services/tracking.service'

const activeLive = ref<LivestreamSession | null>(null)
const dismissed = ref(false)

function getPlatformLabel(platform: string) {
  switch (platform) {
    case 'FACEBOOK': return 'Facebook'
    case 'TIKTOK': return 'TikTok'
    case 'YOUTUBE': return 'YouTube'
    default: return platform
  }
}

function recordLiveClick() {
  if (!activeLive.value) return
  trackingService.track({
    eventType: 'LIVESTREAM_CLICK',
    entityType: 'livestream',
    entityId: activeLive.value._id,
    url: activeLive.value.streamUrl,
  })
}

onMounted(async () => {
  try {
    const res = await livestreamService.getActiveLive()
    activeLive.value = res.data?.data || res.data || null
  } catch {
    // Gracefully handle if no active stream or backend error
    activeLive.value = null
  }
})
</script>
