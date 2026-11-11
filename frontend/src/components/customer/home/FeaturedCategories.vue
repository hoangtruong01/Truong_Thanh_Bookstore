<template>
  <!-- Section 4: Horizontal Featured Categories -->
  <section class="py-10 px-4 md:px-8 bg-white border-y border-slate-100/80">
    <div class="max-w-[1500px] mx-auto space-y-6">
      <!-- Section Header -->
      <div class="reveal flex items-end justify-between">
        <div class="text-left">
          <h2
            class="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight flex items-center gap-2"
          >
            ✨ Danh mục nổi bật
          </h2>
        </div>
        <router-link
          to="/products"
          class="text-xs font-bold text-slate-500 hover:text-red-600 flex items-center gap-1 group"
        >
          <span>Xem tất cả</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </router-link>
      </div>

      <!-- Skeleton loader -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-6">
        <div v-for="n in 7" :key="n" class="relative overflow-hidden rounded-[18px] p-5 border border-slate-100 bg-slate-50 min-h-[100px] animate-pulse">
          <div class="h-4 bg-slate-200 rounded w-2/3 mt-2"></div>
          <div class="h-3 bg-slate-200 rounded w-1/2 mt-2"></div>
        </div>
      </div>
      <!-- Cards Container -->
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-6"
      >
        <router-link
          v-for="cat in featuredCategories"
          :key="cat.name"
          :to="cat.to"
          :class="[
            'featured-category-card relative overflow-hidden rounded-[18px] p-5 border flex items-center justify-between group transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer min-h-[100px]',
            cat.gradient,
          ]"
        >
          <!-- Card Background Image with hover zoom effect -->
          <div
            class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 pointer-events-none"
            :style="{ backgroundImage: optimizedBackground(cat.bgImage) }"
          ></div>

          <!-- Soft gradient overlay to ensure text contrast/readability on the left -->
          <div
            class="absolute inset-0 bg-gradient-to-r from-white/60 via-white/30 to-transparent pointer-events-none"
          ></div>

          <!-- Text on the left -->
          <div class="space-y-1 text-left relative z-10 max-w-[65%]">
            <h3
              class="text-sm font-black tracking-tight leading-tight text-[#0f172a] group-hover:text-[#dc2626] transition-colors"
            >
              {{ cat.name }}
            </h3>
            <p
              class="text-[10px] text-slate-600 font-extrabold leading-none mt-1"
            >
              {{ cat.desc }}
            </p>
          </div>
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Category } from '@/types'
import { buildFeaturedCategories } from './homeCategories'
import { optimizedBackground } from './homeBackgrounds'

const props = defineProps<{
  categories: Category[]
  loading: boolean
}>()

const featuredCategories = computed(() => buildFeaturedCategories(props.categories))
</script>
