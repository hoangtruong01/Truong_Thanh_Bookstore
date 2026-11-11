<template>
  <div
    class="bg-white border border-slate-100/80 rounded-[2rem] p-5 space-y-4 shadow-xs hover:shadow-xl hover:border-orange-200 transition-all duration-300 relative group flex flex-col justify-between cursor-pointer"
    @click="goToDetail"
  >
    <!-- Badge -->
    <div
      class="absolute top-4 inset-x-4 flex items-center justify-between z-10 pointer-events-none"
    >
      <span
        class="bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider"
      >
        -{{ discountPercent }}%
      </span>
      <span
        v-if="hot"
        class="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-0.5"
      >
        🔥 HOT
      </span>
    </div>

    <!-- Image/Fallback -->
    <div class="block space-y-3">
      <div
        class="aspect-square bg-slate-50/50 rounded-2xl overflow-hidden flex items-center justify-center relative"
      >
        <!-- Blurred background to fill empty space -->
        <img
          v-if="hasImage"
          :src="product.images[0]"
          loading="lazy"
          decoding="async"
          width="320"
          height="320"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 240px"
          alt=""
          aria-hidden="true"
          class="absolute inset-0 w-full h-full object-cover blur-xl opacity-[0.22] scale-125 select-none pointer-events-none"
        />

        <!-- Main product image with drop shadow -->
        <img
          v-if="hasImage"
          :src="product.images[0]"
          loading="lazy"
          decoding="async"
          width="320"
          height="320"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 240px"
          class="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 relative z-10 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.06)]"
          :alt="product.name"
          @error="isImageBroken = true"
        />
        <!-- Fallback SVG -->
        <div
          v-else
          :class="[
            'w-full h-full flex items-center justify-center p-4 group-hover:scale-105 transition-transform duration-300',
            placeholder.gradient,
          ]"
        >
          <svg v-if="placeholder.icon === 'pencil'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 text-white/90">
            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
          </svg>
          <svg v-else-if="placeholder.icon === 'document'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 text-white/90">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <svg v-else-if="placeholder.icon === 'calculator'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 text-white/90">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008ZM2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.379-3.379a.75.75 0 0 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06-1.06l-1.25-1.25Z" />
          </svg>
          <svg v-else-if="placeholder.icon === 'folder'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 text-white/90">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-19.5 0A2.25 2.25 0 0 0 4.5 15h15a2.25 2.25 0 0 0 2.25-2.25m-19.5 0v.225C2.25 14.28 3.52 15 5.04 15h13.92c1.52 0 2.79-.72 2.79-2.025v-.225M3 9V6a3 3 0 0 1 3-3h3.75a3 3 0 0 1 2.25 1.025L13.5 6h6.75A3 3 0 0 1 23 9v2.25m-20.25 0h17.5" />
          </svg>
          <svg v-else-if="placeholder.icon === 'briefcase'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 text-white/90">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 .994-.806 1.8-1.8 1.8H5.55c-.994 0-1.8-.806-1.8-1.8v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.45.258-.717.258H5.184c-.267 0-.523-.093-.717-.258m16.5 0V8.706c0-1.08-.768-2.014-1.837-2.174a47.79 47.79 0 0 0-3.413-.387m-7.5 0V5.25A2.25 2.25 0 0 1 10.5 3h3a2.25 2.25 0 0 1 2.25 2.25v.819M6.75 7.5v.75m0-1.5h10.5M6.75 7.5H4.25m13 0h2.5M6.75 7.5v8.25M17.25 7.5v8.25M3 16.5h18" />
          </svg>
          <svg v-else-if="placeholder.icon === 'academic'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 text-white/90">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M12 21v-4.5" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 text-white/90">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.753 2.481.162l5.586-5.586a1.725 1.725 0 0 0 .162-2.481l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
          </svg>
        </div>
      </div>

      <!-- Product Info -->
      <div class="space-y-1.5">
        <h3
          class="text-xs sm:text-sm font-extrabold text-slate-800 line-clamp-2 hover:text-red-600 transition-colors leading-tight min-h-[36px]"
        >
          {{ product.name }}
        </h3>
        <div class="flex items-center gap-1.5 text-[10px]">
          <div class="flex items-center text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3">
              <path
                fill-rule="evenodd"
                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <span class="font-bold text-slate-700 text-[11px]">{{ Number(product.rating || 5).toFixed(1) }}</span>
          <span class="text-slate-300">|</span>
          <span class="text-slate-500 font-medium">Đã bán {{ product.sold || 0 }}</span>
        </div>
      </div>

      <!-- Price -->
      <div class="flex items-baseline gap-2 pt-1 border-t border-slate-100">
        <span class="text-sm sm:text-base font-black text-[#dc2626]">
          {{ formatCurrency(hasDiscountPrice ? product.discountPrice : product.price) }}
        </span>
        <!-- BUG-020: only strike the list price when the selling price is really lower -->
        <span
          v-if="showOriginalPrice"
          class="text-xs text-slate-400 line-through"
        >
          {{ formatCurrency(product.price) }}
        </span>
      </div>

      <!-- Stock Bar: only from real sold/stock counts -->
      <div v-if="soldProgress !== null" class="space-y-1.5 pt-1" data-testid="sold-progress">
        <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            class="bg-gradient-to-r from-orange-500 to-[#dc2626] h-full rounded-full transition-all duration-500"
            :style="{ width: `${soldProgress}%` }"
          ></div>
        </div>
        <div class="flex justify-between items-center text-[10px] font-bold text-slate-500 leading-none">
          <span>Đã bán {{ product.sold }}</span>
          <span>{{ soldProgress }}%</span>
        </div>
      </div>
    </div>

    <!-- Action Button -->
    <button
      class="w-full mt-3 bg-gradient-to-r from-orange-500 to-[#dc2626] hover:from-orange-600 hover:to-[#b91c1c] text-white font-extrabold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-[10px] uppercase tracking-wider"
      @click.stop="emit('add-to-cart', product)"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
        />
      </svg>
      <span>MUA NGAY</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { formatCurrency, getDiscountPercent, getProductPlaceholder } from '@/utils/helpers'
import type { Product } from '@/types'
import { getSoldProgress } from './flashSale'

const props = defineProps<{
  product: Product
  /** Shows the "🔥 HOT" tag (first card of each carousel page). */
  hot?: boolean
}>()

const emit = defineEmits<{
  (e: 'add-to-cart', product: Product): void
}>()

const router = useRouter()

const isImageBroken = ref(false)
watch(
  () => props.product,
  () => {
    isImageBroken.value = false
  },
)

const hasImage = computed(() => Boolean(props.product.images?.[0]) && !isImageBroken.value)
const placeholder = computed(() => getProductPlaceholder(props.product.name))
const discountPercent = computed(() => getDiscountPercent(props.product.price, props.product.discountPrice))
const hasDiscountPrice = computed(() => props.product.discountPrice > 0)
const showOriginalPrice = computed(() => hasDiscountPrice.value && props.product.discountPrice < props.product.price)
const soldProgress = computed(() => getSoldProgress(props.product))

function goToDetail() {
  router.push(`/products/${props.product.slug || props.product._id}`)
}
</script>
