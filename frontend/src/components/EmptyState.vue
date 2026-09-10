<template>
  <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 sm:p-14 text-center max-w-xl mx-auto space-y-6 shadow-xs">
    <!-- Icon Container with Tailwind Gradients & SVGs -->
    <div
      class="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-inner transition-transform hover:scale-105"
      :class="iconContainerClass"
    >
      <slot name="icon">
        <!-- Shopping Cart Icon -->
        <svg
          v-if="iconType === 'cart'"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.8"
          stroke="currentColor"
          class="w-10 h-10 text-red-600"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
          />
        </svg>

        <!-- Orders / Clipboard Icon -->
        <svg
          v-else-if="iconType === 'order'"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.8"
          stroke="currentColor"
          class="w-10 h-10 text-amber-600"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
          />
        </svg>

        <!-- Search Icon -->
        <svg
          v-else-if="iconType === 'search'"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.8"
          stroke="currentColor"
          class="w-10 h-10 text-slate-600"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z"
          />
        </svg>

        <!-- Wishlist / Heart Icon -->
        <svg
          v-else-if="iconType === 'wishlist'"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.8"
          stroke="currentColor"
          class="w-10 h-10 text-rose-600"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
          />
        </svg>

        <!-- Fallback Emoji or String -->
        <span v-else class="text-4xl select-none">{{ icon }}</span>
      </slot>
    </div>

    <!-- Title and Description -->
    <div class="space-y-2">
      <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
        {{ title }}
      </h3>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
        {{ description }}
      </p>
    </div>

    <!-- Additional Content Slot (e.g. search keyword pills) -->
    <div v-if="$slots.extra" class="pt-1">
      <slot name="extra"></slot>
    </div>

    <!-- Action Button (Router Link or Button Event) -->
    <div v-if="$slots.action || actionText" class="pt-2">
      <slot name="action">
        <router-link
          v-if="to"
          :to="to"
          class="inline-flex items-center justify-center bg-[#dc2626] hover:bg-[#b91c1c] text-white font-extrabold py-3 px-8 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-red-500/20 active:scale-95 cursor-pointer"
        >
          {{ actionText }}
        </router-link>
        <button
          v-else-if="actionText"
          type="button"
          @click="$emit('action')"
          class="inline-flex items-center justify-center bg-[#dc2626] hover:bg-[#b91c1c] text-white font-extrabold py-3 px-8 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-red-500/20 active:scale-95 cursor-pointer"
        >
          {{ actionText }}
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  icon?: string
  iconType?: 'cart' | 'order' | 'search' | 'wishlist' | 'custom'
  title?: string
  description?: string
  actionText?: string
  to?: string
}

const props = withDefaults(defineProps<Props>(), {
  icon: '📦',
  iconType: 'custom',
  title: 'Không có dữ liệu',
  description: 'Hiện chưa có thông tin nào để hiển thị trong mục này.',
  actionText: '',
  to: '',
})

defineEmits<{
  (e: 'action'): void
}>()

const iconContainerClass = computed(() => {
  switch (props.iconType) {
    case 'cart':
      return 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/40 dark:border-red-900/50'
    case 'order':
      return 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/40 dark:border-amber-900/50'
    case 'search':
      return 'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700'
    case 'wishlist':
      return 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/40 dark:border-rose-900/50'
    default:
      return 'bg-slate-50 text-slate-400 border border-slate-100 dark:bg-slate-800 dark:border-slate-700'
  }
})
</script>
