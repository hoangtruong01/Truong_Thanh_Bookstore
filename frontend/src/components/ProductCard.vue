<template>
  <div
    @click="goToDetail"
    class="bg-white border border-slate-200/80 rounded-2xl p-4 hover:shadow-md hover:border-slate-300 transition-all flex flex-col group relative cursor-pointer"
  >
    <!-- Discount Badge -->
    <span v-if="discountPercent > 0" class="absolute top-6 left-6 bg-[#dc2626] text-white text-[10px] font-black px-2 py-0.5 rounded-md z-20 shadow-xs">
      -{{ discountPercent }}%
    </span>

    <!-- Image/Placeholder Container -->
    <div class="aspect-square bg-slate-50/70 rounded-xl overflow-hidden mb-4 relative flex items-center justify-center">
      <!-- Blurred background to fill empty space -->
      <img 
        v-if="product.images && product.images[0] && !isImageBroken" 
        :src="product.images[0]" 
        class="absolute inset-0 w-full h-full object-cover blur-xl opacity-[0.22] scale-125 select-none pointer-events-none" 
      />
      
      <!-- Main product image with drop shadow -->
      <img 
        v-if="product.images && product.images[0] && !isImageBroken" 
        :src="product.images[0]" 
        @error="handleImageError"
        class="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500 relative z-10 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.06)]" 
      />
      
      <!-- Fallback Placeholder -->
      <div v-else :class="`w-full h-full ${placeholder.gradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-500`">
        <!-- SVG Icon fallbacks -->
        <svg v-if="placeholder.icon === 'pencil'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
          <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
        </svg>
        <svg v-else-if="placeholder.icon === 'document'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <svg v-else-if="placeholder.icon === 'calculator'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008ZM2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.379-3.379a.75.75 0 0 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06-1.06l-1.25-1.25Z" />
        </svg>
        <svg v-else-if="placeholder.icon === 'folder'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-19.5 0A2.25 2.25 0 0 0 4.5 15h15a2.25 2.25 0 0 0 2.25-2.25m-19.5 0v.225C2.25 14.28 3.52 15 5.04 15h13.92c1.52 0 2.79-.72 2.79-2.025v-.225M3 9V6a3 3 0 0 1 3-3h3.75a3 3 0 0 1 2.25 1.025L13.5 6h6.75A3 3 0 0 1 23 9v2.25m-20.25 0h17.5" />
        </svg>
        <svg v-else-if="placeholder.icon === 'briefcase'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 .994-.806 1.8-1.8 1.8H5.55c-.994 0-1.8-.806-1.8-1.8v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.45.258-.717.258H5.184c-.267 0-.523-.093-.717-.258m16.5 0V8.706c0-1.08-.768-2.014-1.837-2.174a47.79 47.79 0 0 0-3.413-.387m-7.5 0V5.25A2.25 2.25 0 0 1 10.5 3h3a2.25 2.25 0 0 1 2.25 2.25v.819M6.75 7.5v.75m0-1.5h10.5M6.75 7.5H4.25m13 0h2.5M6.75 7.5v8.25M17.25 7.5v8.25M3 16.5h18" />
        </svg>
        <svg v-else-if="placeholder.icon === 'academic'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M12 21v-4.5" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.753 2.481.162l5.586-5.586a1.725 1.725 0 0 0 .162-2.481l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
        </svg>
      </div>
    </div>

    <!-- Title -->
    <h3 class="text-xs font-bold text-slate-800 line-clamp-2 min-h-[36px] group-hover:text-[#dc2626] transition-colors leading-tight">
      <router-link :to="`/products/${product._id}`">{{ product.name }}</router-link>
    </h3>

    <!-- Price & Info -->
    <div class="mt-2 flex flex-col gap-1">
      <div class="flex items-baseline gap-2">
        <template v-if="product.discountPrice > 0">
          <span class="text-sm font-bold text-red-600">{{ formatCurrency(product.discountPrice) }}</span>
          <span class="text-[10px] text-slate-400 line-through">{{ formatCurrency(product.price) }}</span>
        </template>
        <template v-else>
          <span class="text-sm font-bold text-red-600">{{ formatCurrency(product.price) }}</span>
        </template>
      </div>
      
      <div class="flex items-center justify-between text-[10px] text-slate-400">
        <div class="flex items-center gap-0.5 text-yellow-600 font-bold">
          ★ {{ Number(product.rating || 4.8).toFixed(1) }}
        </div>
        <div>
          Đã bán {{ formatNumber(product.sold || 0) }}
        </div>
      </div>
    </div>

    <!-- Add to Cart -->
    <button @click.stop="$emit('add-to-cart', product)" class="mt-3 w-full bg-[#ffebd5] hover:bg-[#dc2626] text-[#c2410c] hover:text-white font-extrabold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1 border border-[#fed7aa] cursor-pointer">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
      <span>Thêm vào giỏ</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { formatCurrency, getDiscountPercent, formatNumber } from '@/utils/helpers'
import type { Product } from '@/types'

const props = defineProps<{
  product: Product
}>()

defineEmits<{
  (e: 'add-to-cart', product: Product): void
}>()

const router = useRouter()

const isImageBroken = ref(false)

watch(() => props.product, () => {
  isImageBroken.value = false
})

function handleImageError() {
  isImageBroken.value = true
}

function goToDetail() {
  router.push(`/products/${props.product._id}`)
}

const discountPercent = computed(() => {
  return getDiscountPercent(props.product.price, props.product.discountPrice)
})


const placeholder = computed(() => {
  const name = (props.product.name || '').toLowerCase()
  if (name.includes('bút') || name.includes('viết') || name.includes('chì')) {
    return {
      gradient: 'bg-gradient-to-br from-red-400 to-rose-500',
      icon: 'pencil'
    }
  }
  if (name.includes('giấy') || name.includes('sổ') || name.includes('vở') || name.includes('tập') || name.includes('note')) {
    return {
      gradient: 'bg-gradient-to-br from-emerald-400 to-teal-500',
      icon: 'document'
    }
  }
  if (name.includes('máy tính') || name.includes('casio')) {
    return {
      gradient: 'bg-gradient-to-br from-indigo-400 to-purple-500',
      icon: 'calculator'
    }
  }
  if (name.includes('hồ sơ') || name.includes('bìa') || name.includes('kẹp') || name.includes('keo') || name.includes('thước')) {
    return {
      gradient: 'bg-gradient-to-br from-blue-400 to-sky-500',
      icon: 'folder'
    }
  }
  if (name.includes('combo') || name.includes('văn phòng')) {
    return {
      gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      icon: 'briefcase'
    }
  }
  if (name.includes('học sinh') || name.includes('tiểu học') || name.includes('bộ dụng cụ')) {
    return {
      gradient: 'bg-gradient-to-br from-amber-400 to-orange-500',
      icon: 'academic'
    }
  }
  return {
    gradient: 'bg-gradient-to-br from-pink-400 to-rose-500',
    icon: 'tag'
  }
})
</script>
