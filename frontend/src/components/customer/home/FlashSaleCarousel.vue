<template>
  <!-- Section 3: DEAL SỐC GIỜ VÀNG (Flash Sale) (Placed above Categories) -->
  <section
    :style="{
      backgroundImage: optimizedBackground(homeBackgrounds.flashSale),
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }"
    class="w-full py-16 relative overflow-hidden"
  >
    <div
      class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10"
    >
      <!-- Section Header -->
      <div
        class="reveal flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10"
      >
        <div class="space-y-2 text-left">
          <span
            class="inline-flex items-center gap-1 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider"
          >
            🔥 ĐỪNG BỎ LỠ HÔM NAY!
          </span>
          <div class="flex items-center gap-3">
            <div
              class="bg-gradient-to-br from-red-500 to-orange-600 text-white p-2.5 rounded-2xl shadow-lg rotate-12 flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2.5"
                stroke="currentColor"
                class="w-5 h-5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.753 2.481.162l5.586-5.586a1.725 1.725 0 0 0 .162-2.481l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 6h.008v.008H6V6Z"
                />
              </svg>
            </div>
            <h2
              class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
            >
              DEAL <span class="text-[#dc2626]">SỐC</span> GIỜ VÀNG
            </h2>
          </div>
          <p class="text-slate-500 text-xs sm:text-sm font-medium">
            Giảm giá đến
            <span class="text-red-600 font-extrabold">30%</span> cho dụng cụ
            học tập & văn phòng phẩm
          </p>
        </div>

        <!-- Countdown timer -->
        <div
          class="flex flex-col items-center md:items-end gap-2 shrink-0 bg-white/80 border border-orange-200/30 rounded-3xl p-4 backdrop-blur-xs"
        >
          <span
            class="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1"
          >
            ⏰ KẾT THÚC SAU:
          </span>
          <div class="flex items-center gap-2">
            <template v-for="(unit, idx) in countdownUnits" :key="unit.label">
              <span v-if="idx > 0" class="font-black text-slate-900 text-lg -mt-3">:</span>
              <div class="flex flex-col items-center">
                <div
                  class="bg-slate-900 text-white font-mono font-black text-xl px-3 py-2 rounded-xl shadow-md min-w-[42px] text-center tracking-wider leading-none"
                >
                  {{ unit.value }}
                </div>
                <span class="text-[9px] font-bold text-slate-400 mt-1 uppercase">{{ unit.label }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Products -->
      <div
        v-if="loading"
        class="responsive-flex-grid relative z-10"
      >
        <div
          v-for="n in 5"
          :key="n"
          class="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 animate-pulse"
        >
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <div v-else class="relative w-full overflow-hidden px-1">
        <!-- Slider Track -->
        <div
          class="flex flex-row transition-transform duration-700 ease-in-out"
          :style="{ transform: `translate3d(-${currentPageIndex * 100}%, 0, 0)` }"
        >
          <!-- Page Wrapper -->
          <div
            v-for="(page, pageIdx) in dealPages"
            :key="pageIdx"
            class="w-full flex-shrink-0 px-1"
          >
            <div class="responsive-flex-grid relative z-10">
              <FlashSaleCard
                v-for="(prod, n) in page"
                :key="prod._id + '-' + pageIdx + '-' + n"
                :product="prod"
                :hot="n === 0"
                @add-to-cart="emit('add-to-cart', $event)"
              />
            </div>
          </div>
        </div>

        <!-- Navigation Arrows -->
        <button
          v-if="dealPages.length > 1"
          class="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-3 rounded-full shadow-lg border border-slate-100/50 z-20 transition-all hover:scale-110 active:scale-95 cursor-pointer hidden md:flex items-center justify-center"
          aria-label="Previous page"
          @click="prevPage"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="3"
            stroke="currentColor"
            class="w-5 h-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <button
          v-if="dealPages.length > 1"
          class="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-3 rounded-full shadow-lg border border-slate-100/50 z-20 transition-all hover:scale-110 active:scale-95 cursor-pointer hidden md:flex items-center justify-center"
          aria-label="Next page"
          @click="nextPage"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="3"
            stroke="currentColor"
            class="w-5 h-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>

        <!-- Dots indicators -->
        <div v-if="dealPages.length > 1" class="flex justify-center gap-2 mt-6">
          <button
            v-for="(_, idx) in dealPages"
            :key="idx"
            class="h-2.5 rounded-full transition-all duration-300 cursor-pointer"
            :class="currentPageIndex === idx ? 'bg-[#dc2626] w-8' : 'bg-slate-300 w-2.5 hover:bg-slate-400'"
            :aria-label="'Trang ' + (idx + 1)"
            @click="setPage(idx)"
          ></button>
        </div>
      </div>

      <!-- See More Button -->
      <div class="flex justify-center pt-2 relative z-10">
        <router-link
          to="/deal-hot"
          class="bg-white border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
        >
          Xem Thêm Deal Hot
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import type { Product } from '@/types'
import { useCountdown, startOfTomorrow } from '@/composables/useCountdown'
import FlashSaleCard from './FlashSaleCard.vue'
import { buildDealPages } from './flashSale'
import { homeBackgrounds, optimizedBackground } from './homeBackgrounds'

const props = defineProps<{
  products: Product[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'add-to-cart', product: Product): void
}>()

const AUTOPLAY_MS = 5000

// "Deal ends today" timer: counts down to local midnight and rolls over by itself.
const { hours, minutes, seconds } = useCountdown(startOfTomorrow)
const countdownUnits = computed(() => [
  { label: 'Giờ', value: hours.value },
  { label: 'Phút', value: minutes.value },
  { label: 'Giây', value: seconds.value },
])

const dealPages = computed(() => buildDealPages(props.products || []))
const currentPageIndex = ref(0)
let autoplayTimer: ReturnType<typeof setInterval> | null = null

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

function startAutoplay() {
  stopAutoplay()
  if (dealPages.value.length > 1) {
    autoplayTimer = setInterval(() => {
      currentPageIndex.value = (currentPageIndex.value + 1) % dealPages.value.length
    }, AUTOPLAY_MS)
  }
}

function nextPage() {
  stopAutoplay()
  if (dealPages.value.length > 0) {
    currentPageIndex.value = (currentPageIndex.value + 1) % dealPages.value.length
  }
  startAutoplay()
}

function prevPage() {
  stopAutoplay()
  if (dealPages.value.length > 0) {
    currentPageIndex.value = (currentPageIndex.value - 1 + dealPages.value.length) % dealPages.value.length
  }
  startAutoplay()
}

function setPage(idx: number) {
  stopAutoplay()
  currentPageIndex.value = idx
  startAutoplay()
}

watch(dealPages, startAutoplay, { immediate: true })

onUnmounted(stopAutoplay)
</script>
