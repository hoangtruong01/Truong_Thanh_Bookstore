<template>
  <div class="animate-pulse space-y-4">
    <!-- Table Skeleton -->
    <div v-if="type === 'table'" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-4 space-y-4">
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

    <!-- Cards Grid Skeleton -->
    <div v-else-if="type === 'card'" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div v-for="n in count" :key="n" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
        <div class="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        <div class="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
        <div class="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
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
  type?: 'table' | 'card' | 'kpi' | 'lines';
  count?: number;
}

withDefaults(defineProps<Props>(), {
  type: 'lines',
  count: 4,
});
</script>
