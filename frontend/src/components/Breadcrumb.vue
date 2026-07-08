<template>
  <nav v-if="items.length > 1" aria-label="Breadcrumb" class="text-xs font-medium text-slate-500">
    <ol class="flex flex-wrap items-center gap-1.5" itemscope itemtype="https://schema.org/BreadcrumbList">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="flex items-center gap-1.5"
        itemprop="itemListElement"
        itemscope
        itemtype="https://schema.org/ListItem"
      >
        <router-link
          v-if="index < items.length - 1"
          :to="item.to"
          class="hover:text-[#dc2626] transition-colors"
          itemprop="item"
        >
          <span itemprop="name">{{ item.label }}</span>
        </router-link>
        <span v-else class="text-slate-800 font-bold" itemprop="name">{{ item.label }}</span>
        <meta itemprop="position" :content="String(index + 1)" />
        <svg
          v-if="index < items.length - 1"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="3"
          stroke="currentColor"
          class="w-3 h-3 text-slate-300"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
interface BreadcrumbItem {
  label: string
  to: string
}

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>
