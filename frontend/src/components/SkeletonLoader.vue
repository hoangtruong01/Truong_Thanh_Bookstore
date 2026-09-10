<template>
  <div class="animate-pulse space-y-4">
    <!-- Product Detail Full Page Skeleton -->
    <div v-if="type === 'product-detail'" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      <!-- Left: Gallery Skeleton -->
      <div class="space-y-4">
        <div class="aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl w-full"></div>
        <div class="grid grid-cols-4 gap-3">
          <div v-for="n in 4" :key="n" class="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
      <!-- Right: Product Info Skeleton -->
      <div class="space-y-6">
        <div class="space-y-3">
          <div class="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/4"></div>
          <div class="h-7 bg-slate-200 dark:bg-slate-700 rounded-xl w-4/5"></div>
          <div class="h-5 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/3"></div>
        </div>

        <div class="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-3">
          <div class="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-1/2"></div>
          <div class="h-4 bg-slate-100 dark:bg-slate-800 rounded w-2/5"></div>
        </div>

        <div class="space-y-2 pt-2">
          <div class="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
          <div class="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6"></div>
          <div class="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
        </div>

        <div class="flex items-center gap-4 pt-4">
          <div class="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl w-32"></div>
          <div class="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl flex-grow"></div>
        </div>
      </div>
    </div>

    <!-- Order Item Card Skeleton -->
    <div v-else-if="type === 'order-item'" class="space-y-4">
      <div v-for="n in count" :key="n" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
          <div class="space-y-1">
            <div class="h-3 bg-slate-100 dark:bg-slate-800 rounded w-20"></div>
            <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
          </div>
          <div class="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-24"></div>
        </div>
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex-shrink-0"></div>
          <div class="flex-grow space-y-2">
            <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
            <div class="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/4"></div>
          </div>
          <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
        </div>
      </div>
    </div>

    <!-- Table Skeleton -->
    <div v-else-if="type === 'table'" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-4 space-y-4">
      <div class="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-1/4"></div>
      <div class="space-y-3">
        <div v-for="n in count" :key="n" class="h-12 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center px-4 gap-4">
          <div class="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/6 ml-auto"></div>
          <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/12"></div>
        </div>
      </div>
    </div>

    <!-- Product Cards Grid Skeleton -->
    <div v-else-if="type === 'card'" class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
      <div v-for="n in count" :key="n" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
        <div class="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        <div class="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3"></div>
        <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5"></div>
        <div class="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/2 pt-1"></div>
        <div class="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div>
      </div>
    </div>

    <!-- KPI Metric Cards Skeleton -->
    <div v-else-if="type === 'kpi'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="n in count" :key="n" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div class="flex justify-between items-center">
          <div class="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
          <div class="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        </div>
        <div class="h-8 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
        <div class="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3"></div>
      </div>
    </div>

    <!-- Generic Line Skeleton -->
    <div v-else class="space-y-2.5">
      <div v-for="n in count" :key="n" class="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg" :style="{ width: `${100 - (n * 10) % 40}%` }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'table' | 'card' | 'kpi' | 'lines' | 'product-detail' | 'order-item';
  count?: number;
}

withDefaults(defineProps<Props>(), {
  type: 'lines',
  count: 4,
});
</script>
