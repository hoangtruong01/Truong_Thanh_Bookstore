<template>
  <!-- Plain wrapper: it is the grid cell, so the lightbox below stays out of the gallery's space-y flow -->
  <div>
    <div class="space-y-4">
      <div class="aspect-square bg-slate-50/70 rounded-2xl overflow-hidden border border-slate-100 relative flex items-center justify-center group">
        <!-- Sliding Track -->
        <div
          v-if="images.length > 0"
          class="flex w-full h-full transition-transform duration-500 ease-in-out cursor-zoom-in"
          :style="{ transform: `translateX(-${selectedIndex * 100}%)` }"
          @click="openLightbox(selectedIndex)"
        >
          <div
            v-for="(img, idx) in images"
            :key="idx"
            class="w-full h-full flex-shrink-0 flex items-center justify-center bg-slate-50/70 relative"
          >
            <!-- Blurred background to fill empty space -->
            <img
              v-if="!brokenImages[img]"
              :src="img"
              :loading="idx === 0 ? 'eager' : 'lazy'"
              decoding="async"
              width="720"
              height="720"
              sizes="(max-width: 768px) 100vw, 50vw"
              alt=""
              aria-hidden="true"
              class="absolute inset-0 w-full h-full object-cover blur-xl opacity-[0.22] scale-125 select-none pointer-events-none"
            />

            <!-- Main product image with drop shadow -->
            <img
              v-if="!brokenImages[img]"
              :src="img"
              :loading="idx === 0 ? 'eager' : 'lazy'"
              decoding="async"
              :fetchpriority="idx === 0 ? 'high' : 'auto'"
              :alt="images.length > 1 ? `${productName} - ảnh ${idx + 1}` : productName"
              width="720"
              height="720"
              sizes="(max-width: 768px) 100vw, 50vw"
              class="w-full h-full object-contain p-4 relative z-10 filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.06)] group-hover:scale-105 transition-transform duration-300"
              @error="handleImageError(img)"
            />
            <div v-else :class="`w-full h-full ${placeholder.gradient} flex items-center justify-center`">
              <ProductPlaceholderIcon :icon="placeholder.icon" class="w-24 h-24 text-white/90" />
            </div>
          </div>
        </div>
        <div v-else :class="`w-full h-full ${placeholder.gradient} flex items-center justify-center`">
          <ProductPlaceholderIcon :icon="placeholder.icon" class="w-24 h-24 text-white/90" />
        </div>
      </div>
      <div v-if="images.length > 1" class="flex gap-3 overflow-x-auto py-1">
        <button
          v-for="(img, idx) in images"
          :key="idx"
          class="w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-slate-50"
          :class="[selectedImage === img ? 'border-[#dc2626]' : 'border-transparent opacity-70 hover:opacity-100']"
          @click="selectProductImage(img)"
        >
          <img v-if="!brokenImages[img]" :src="img" :alt="`${productName} - ảnh nhỏ ${idx + 1}`" loading="lazy" class="w-full h-full object-contain" @error="handleImageError(img)" />
          <div v-else :class="`w-full h-full ${placeholder.gradient} flex items-center justify-center text-white text-[10px] font-bold`">
            Ảnh {{ idx + 1 }}
          </div>
        </button>
      </div>
    </div>

    <!-- Image Lightbox Modal -->
    <div
      v-if="isLightboxOpen && images.length > 0"
      class="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md transition-all select-none"
      @click.self="closeLightbox"
    >
      <!-- Top controls bar -->
      <div class="w-full max-w-5xl flex items-center justify-between text-white pb-3 px-2">
        <div class="text-xs font-bold text-slate-300">
          Ảnh {{ activeLightboxIndex + 1 }} / {{ images.length }} • {{ productName }}
        </div>
        <button
          class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Đóng (ESC)"
          @click="closeLightbox"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Main Display -->
      <div class="relative w-full max-w-4xl max-h-[75vh] flex items-center justify-center">
        <!-- Prev Button -->
        <button
          v-if="images.length > 1"
          class="absolute left-2 z-10 w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
          @click="prevLightboxImage"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        <!-- Current Zoomed Image -->
        <img
          :src="images[activeLightboxIndex]"
          :alt="productName"
          class="max-h-[72vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-300"
        />

        <!-- Next Button -->
        <button
          v-if="images.length > 1"
          class="absolute right-2 z-10 w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
          @click="nextLightboxImage"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      <!-- Bottom Thumbnails Strip -->
      <div v-if="images.length > 1" class="flex gap-2.5 mt-4 overflow-x-auto max-w-xl py-2 px-4 bg-white/5 rounded-2xl backdrop-blur-xs border border-white/10">
        <button
          v-for="(thumb, tIdx) in images"
          :key="tIdx"
          class="w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-white/10 cursor-pointer"
          :class="[activeLightboxIndex === tIdx ? 'border-red-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100']"
          @click="activeLightboxIndex = tIdx"
        >
          <img :src="thumb" :alt="`${productName} - ảnh ${tIdx + 1}`" loading="lazy" class="w-full h-full object-contain p-1" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { getProductPlaceholder } from '@/utils/helpers'
import ProductPlaceholderIcon from './ProductPlaceholderIcon.vue'

const props = defineProps<{
  images?: string[] | null
  productName: string
}>()

/** Autoplay interval for the main slider (ms). */
const AUTOPLAY_MS = 3800

const images = computed<string[]>(() => (Array.isArray(props.images) ? props.images : []))
const placeholder = computed(() => getProductPlaceholder(props.productName))

const selectedImage = ref('')
const selectedIndex = computed(() => Math.max(0, images.value.indexOf(selectedImage.value)))

const brokenImages = ref<Record<string, boolean>>({})
function handleImageError(imgUrl: string) {
  brokenImages.value[imgUrl] = true
}

// Autoplay slideshow
let autoplayInterval: ReturnType<typeof setInterval> | null = null

function stopAutoplay() {
  if (autoplayInterval) {
    clearInterval(autoplayInterval)
    autoplayInterval = null
  }
}

function startAutoplay() {
  stopAutoplay()
  if (images.value.length > 1) {
    autoplayInterval = setInterval(() => {
      const list = images.value
      if (list.length === 0) return
      const idx = list.indexOf(selectedImage.value)
      selectedImage.value = list[(idx + 1) % list.length]
    }, AUTOPLAY_MS)
  }
}

function selectProductImage(img: string) {
  selectedImage.value = img
  startAutoplay()
}

// Lightbox
const isLightboxOpen = ref(false)
const activeLightboxIndex = ref(0)

function openLightbox(idx = 0) {
  if (images.value.length === 0) return
  activeLightboxIndex.value = Math.max(0, Math.min(idx, images.value.length - 1))
  isLightboxOpen.value = true
  stopAutoplay()
}

function closeLightbox() {
  isLightboxOpen.value = false
  startAutoplay()
}

function nextLightboxImage() {
  if (images.value.length === 0) return
  activeLightboxIndex.value = (activeLightboxIndex.value + 1) % images.value.length
}

function prevLightboxImage() {
  if (images.value.length === 0) return
  activeLightboxIndex.value = (activeLightboxIndex.value - 1 + images.value.length) % images.value.length
}

function handleKeydown(e: KeyboardEvent) {
  if (!isLightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  else if (e.key === 'ArrowRight') nextLightboxImage()
  else if (e.key === 'ArrowLeft') prevLightboxImage()
}

// New image set (another product) => back to the first image and restart the slideshow
watch(
  images,
  (list) => {
    selectedImage.value = list[0] || ''
    isLightboxOpen.value = false
    startAutoplay()
  },
  { immediate: true },
)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  stopAutoplay()
})
</script>
