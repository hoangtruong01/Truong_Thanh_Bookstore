<template>
  <div class="bg-white border-b border-slate-100 hidden md:block">
    <div class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
      <div
        class="flex items-center justify-start lg:justify-center gap-2 lg:gap-6 py-2.5 overflow-x-auto scrollbar-none"
      >
        <template v-if="loading">
          <div v-for="n in 6" :key="n" class="h-8 bg-slate-100 rounded-full w-24 animate-pulse"></div>
        </template>
        <template v-else>
          <router-link
            v-for="item in navItems"
            :key="item.name"
            :to="item.to"
            class="flex items-center gap-1.5 text-xs font-extrabold text-[#0f172a] hover:text-[#dc2626] px-4 py-2 rounded-full hover:bg-red-50 transition-all whitespace-nowrap flex-shrink-0"
          >
            <span>{{ item.icon }}</span>
            {{ item.name }}
          </router-link>
        </template>
        <router-link
          to="/products?discounted=true"
          class="flex items-center gap-1.5 text-xs font-extrabold text-white bg-[#dc2626] hover:bg-[#b91c1c] px-4 py-2 rounded-full transition-all whitespace-nowrap flex-shrink-0"
        >
          % Ưu đãi hot
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Category } from '@/types'
import { buildHomeNavItems } from './homeCategories'

const props = defineProps<{
  categories: Category[]
  loading: boolean
}>()

const navItems = computed(() => buildHomeNavItems(props.categories))
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
