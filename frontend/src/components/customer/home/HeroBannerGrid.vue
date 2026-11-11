<template>
  <!-- Section 1: Hero Banner Grid (Fahasa-style) -->
  <div class="bg-[#f5f5fa] py-3 md:py-4">
    <div class="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6">
      <!-- Top Row: Sidebar Left + Main Slider + Sidebar Right -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-3 lg:h-[380px]">
        <!-- Sidebar Left -->
        <div class="hidden lg:block lg:col-span-3 h-full">
          <a
            v-if="sidebarLeft"
            :href="sidebarLeft.linkUrl || '#'"
            class="block w-full h-full rounded-xl overflow-hidden group"
          >
            <img
              :src="sidebarLeft.imageUrl"
              :alt="sidebarLeft.title"
              class="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
            />
          </a>
          <div
            v-else
            class="w-full h-full rounded-xl bg-gradient-to-br from-orange-100 via-amber-50 to-orange-50 flex flex-col items-center justify-center p-4 text-center border border-orange-200/40"
          >
            <span class="text-3xl mb-2">📚</span>
            <span class="text-xs font-black text-orange-800 uppercase tracking-wide">Sách giáo khoa</span>
            <span class="text-[10px] text-orange-600/70 mt-1 font-semibold">Đầy đủ các cấp</span>
          </div>
        </div>

        <!-- Main Slider -->
        <div class="lg:col-span-6 relative rounded-xl overflow-hidden group h-full">
          <!-- Skeleton Loader -->
          <div v-if="loading" class="w-full h-full bg-slate-200 rounded-xl animate-pulse"></div>

          <template v-else>
            <!-- Slider Track -->
            <div
              v-if="mainSliderBanners.length > 0"
              class="relative w-full h-full"
            >
              <div
                v-for="(banner, idx) in mainSliderBanners"
                :key="banner._id || idx"
                class="absolute inset-0 transition-opacity duration-700 ease-in-out"
                :class="heroSlideIndex === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'"
              >
                <a :href="banner.linkUrl || '#'" class="block w-full h-full">
                  <!-- First slide is the LCP image: load it eagerly with high priority; later slides wait. -->
                  <img
                    :src="banner.imageUrl"
                    :alt="banner.title"
                    :loading="idx === 0 ? 'eager' : 'lazy'"
                    :fetchpriority="idx === 0 ? 'high' : 'auto'"
                    decoding="async"
                    class="w-full h-full object-cover rounded-xl"
                  />
                </a>
              </div>

              <!-- Prev/Next Arrows -->
              <button
                v-if="mainSliderBanners.length > 1"
                class="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer backdrop-blur-xs"
                @click="heroSlidePrev"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                v-if="mainSliderBanners.length > 1"
                class="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer backdrop-blur-xs"
                @click="heroSlideNext"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              <!-- Dots -->
              <div v-if="mainSliderBanners.length > 1" class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                <button
                  v-for="(_, idx) in mainSliderBanners"
                  :key="idx"
                  class="h-2 rounded-full transition-all duration-300 cursor-pointer"
                  :class="heroSlideIndex === idx ? 'bg-white w-6 shadow-md' : 'bg-white/50 w-2 hover:bg-white/70'"
                  @click="heroSlideGoTo(idx)"
                ></button>
              </div>
            </div>

            <!-- Fallback when no main slider banners -->
            <div
              v-else
              class="w-full h-full rounded-xl bg-gradient-to-br from-[#e11d24] via-rose-500 to-[#fb5607] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden"
            >
              <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle, #fff 1px, transparent 1px); background-size: 16px 16px;"></div>
              <h2 class="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight relative z-10 leading-tight">
                Khởi nguồn<br/><span class="italic">Sự Sáng Tạo</span>
              </h2>
              <p class="text-white/80 text-xs sm:text-sm mt-3 max-w-md relative z-10 font-medium">
                Khám phá bộ sưu tập dụng cụ học tập & văn phòng phẩm Trường Thành
              </p>
              <router-link
                to="/products"
                class="mt-5 bg-white text-[#e11d24] font-extrabold py-2.5 px-6 rounded-full text-sm hover:bg-slate-50 transition-all relative z-10 shadow-lg"
              >
                Mua sắm ngay →
              </router-link>
            </div>
          </template>
        </div>

        <!-- Sidebar Right (2 stacked banners) -->
        <div class="hidden lg:flex lg:col-span-3 flex-col gap-3 h-full">
          <!-- Right Top -->
          <a
            v-if="sidebarRightTop"
            :href="sidebarRightTop.linkUrl || '#'"
            class="block flex-1 rounded-xl overflow-hidden group"
          >
            <img
              :src="sidebarRightTop.imageUrl"
              :alt="sidebarRightTop.title"
              class="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
            />
          </a>
          <div
            v-else
            class="flex-1 rounded-xl bg-gradient-to-br from-blue-50 to-sky-100 flex flex-col items-center justify-center p-4 text-center border border-blue-200/40"
          >
            <span class="text-2xl mb-1">🎓</span>
            <span class="text-xs font-black text-blue-800">Ưu đãi sinh viên</span>
            <span class="text-[10px] text-blue-600/70 mt-0.5 font-semibold">Giảm đến 25%</span>
          </div>

          <!-- Right Bottom -->
          <a
            v-if="sidebarRightBottom"
            :href="sidebarRightBottom.linkUrl || '#'"
            class="block flex-1 rounded-xl overflow-hidden group"
          >
            <img
              :src="sidebarRightBottom.imageUrl"
              :alt="sidebarRightBottom.title"
              class="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
            />
          </a>
          <div
            v-else
            class="flex-1 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 flex flex-col items-center justify-center p-4 text-center border border-emerald-200/40"
          >
            <span class="text-2xl mb-1">🛡️</span>
            <span class="text-xs font-black text-emerald-800">Miễn phí vận chuyển</span>
            <span class="text-[10px] text-emerald-600/70 mt-0.5 font-semibold">Đơn từ 200k</span>
          </div>
        </div>
      </div>

      <!-- Bottom Row: 4 promo banners -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <template v-if="bottomRowBanners.length > 0">
          <a
            v-for="(banner, idx) in bottomRowBanners"
            :key="banner._id || idx"
            :href="banner.linkUrl || '#'"
            class="block rounded-xl overflow-hidden group relative aspect-[2.5/1] w-full h-full border border-slate-200/40 shadow-xs"
          >
            <img
              :src="banner.imageUrl"
              :alt="banner.title"
              class="w-full h-full object-cover object-center rounded-xl transition-transform duration-500 group-hover:scale-105"
            />
          </a>
        </template>
        <template v-else>
          <div
            v-for="(promo, idx) in defaultBottomPromos"
            :key="idx"
            class="rounded-xl overflow-hidden relative cursor-pointer group aspect-[2.5/1] w-full h-full"
          >
            <div :class="promo.gradient" class="w-full h-full aspect-[2.5/1] flex items-center justify-between p-4 rounded-xl border border-slate-200/40">
              <div class="space-y-1 text-left relative z-10">
                <span class="text-[10px] font-black uppercase tracking-wider" :class="promo.labelColor">{{ promo.label }}</span>
                <h4 class="text-sm font-black text-slate-900 leading-tight">{{ promo.title }}</h4>
                <router-link :to="promo.link" class="inline-block text-[10px] font-extrabold uppercase tracking-wider mt-1 hover:underline" :class="promo.ctaColor">
                  MUA NGAY →
                </router-link>
              </div>
              <span class="text-3xl opacity-80 select-none">{{ promo.emoji }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'

/** Active banner as returned by `GET /banners/active`, grouped by position. */
export interface HomeBanner {
  _id?: string
  imageUrl: string
  linkUrl?: string
  title?: string
}

const props = defineProps<{
  /** Banners keyed by position: main_slider, sidebar_left, sidebar_right_top, sidebar_right_bottom, bottom_row. */
  banners: Record<string, HomeBanner[] | undefined>
  loading: boolean
}>()

const SLIDE_INTERVAL_MS = 4000

const mainSliderBanners = computed(() => props.banners.main_slider || [])
const sidebarLeft = computed(() => props.banners.sidebar_left?.[0])
const sidebarRightTop = computed(() => props.banners.sidebar_right_top?.[0])
const sidebarRightBottom = computed(() => props.banners.sidebar_right_bottom?.[0])
const bottomRowBanners = computed(() => (props.banners.bottom_row || []).slice(0, 4))

const heroSlideIndex = ref(0)
let heroSlideTimer: ReturnType<typeof setInterval> | null = null

function stopHeroSlider() {
  if (heroSlideTimer) {
    clearInterval(heroSlideTimer)
    heroSlideTimer = null
  }
}

function startHeroSlider() {
  stopHeroSlider()
  if (mainSliderBanners.value.length > 1) {
    heroSlideTimer = setInterval(() => {
      heroSlideIndex.value = (heroSlideIndex.value + 1) % mainSliderBanners.value.length
    }, SLIDE_INTERVAL_MS)
  }
}

function heroSlideNext() {
  stopHeroSlider()
  if (mainSliderBanners.value.length > 0) {
    heroSlideIndex.value = (heroSlideIndex.value + 1) % mainSliderBanners.value.length
  }
  startHeroSlider()
}

function heroSlidePrev() {
  stopHeroSlider()
  if (mainSliderBanners.value.length > 0) {
    heroSlideIndex.value = (heroSlideIndex.value - 1 + mainSliderBanners.value.length) % mainSliderBanners.value.length
  }
  startHeroSlider()
}

function heroSlideGoTo(idx: number) {
  stopHeroSlider()
  heroSlideIndex.value = idx
  startHeroSlider()
}

// (Re)start autoplay whenever the slider banners arrive or change.
watch(mainSliderBanners, startHeroSlider, { immediate: true })

onUnmounted(stopHeroSlider)

const defaultBottomPromos = [
  {
    label: 'Đón hè rực rỡ',
    title: 'Sale hết cỡ',
    link: '/products?discounted=true',
    gradient: 'bg-gradient-to-r from-red-50 to-orange-50',
    labelColor: 'text-red-600',
    ctaColor: 'text-red-600',
    emoji: '🔥',
  },
  {
    label: 'Ấn bản giới hạn',
    title: 'Sách hay chọn lọc',
    link: '/products',
    gradient: 'bg-gradient-to-r from-amber-50 to-yellow-50',
    labelColor: 'text-amber-700',
    ctaColor: 'text-amber-700',
    emoji: '📖',
  },
  {
    label: 'Trang bị kỹ năng',
    title: 'Giảm đến 25%',
    link: '/products?discounted=true',
    gradient: 'bg-gradient-to-r from-emerald-50 to-teal-50',
    labelColor: 'text-emerald-700',
    ctaColor: 'text-emerald-700',
    emoji: '🎯',
  },
  {
    label: 'Foreign Books',
    title: 'Sale up to 20%',
    link: '/products',
    gradient: 'bg-gradient-to-r from-blue-50 to-indigo-50',
    labelColor: 'text-blue-700',
    ctaColor: 'text-blue-700',
    emoji: '🌍',
  },
]
</script>
