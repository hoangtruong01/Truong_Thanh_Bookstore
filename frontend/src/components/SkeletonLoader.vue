<template>
  <div class="shimmer-wrapper space-y-4">
    <!-- Table Skeleton -->
    <div v-if="type === 'table'" class="bg-white border border-slate-200 rounded-2xl overflow-hidden p-6 space-y-4 shadow-xs">
      <div class="h-8 bg-slate-100 rounded-xl w-1/4 animate-pulse"></div>
      <div class="space-y-3">
        <div v-for="n in count" :key="n" class="h-12 bg-slate-50 rounded-xl flex items-center px-4 gap-4 animate-pulse">
          <div class="w-8 h-8 bg-slate-200 rounded-lg"></div>
          <div class="h-4 bg-slate-200 rounded w-1/3"></div>
          <div class="h-4 bg-slate-200 rounded w-1/6 ml-auto"></div>
          <div class="h-4 bg-slate-200 rounded w-1/12"></div>
        </div>
      </div>
    </div>

    <!-- Cards Grid Skeleton (Product List / Wishlist) -->
    <div v-else-if="type === 'card'" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
      <div v-for="n in count" :key="n" class="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-xs animate-pulse">
        <div class="aspect-square bg-slate-100 rounded-2xl w-full"></div>
        <div class="space-y-2 pt-2">
          <div class="h-3 bg-slate-100 rounded w-1/3"></div>
          <div class="h-4 bg-slate-200 rounded w-4/5"></div>
          <div class="h-5 bg-slate-100 rounded w-1/2 pt-1"></div>
        </div>
        <div class="h-8 bg-slate-50 rounded-xl w-full"></div>
      </div>
    </div>

    <!-- KPI Metric Cards Skeleton (Dashboard) -->
    <div v-else-if="type === 'kpi'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="n in count" :key="n" class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs animate-pulse">
        <div class="flex justify-between items-center">
          <div class="h-4 bg-slate-200 rounded w-1/2"></div>
          <div class="w-10 h-10 bg-slate-100 rounded-xl"></div>
        </div>
        <div class="h-8 bg-slate-200 rounded w-3/4"></div>
        <div class="h-3 bg-slate-100 rounded w-1/3"></div>
      </div>
    </div>

    <!-- Product Detail Skeleton -->
    <div v-else-if="type === 'product-detail'" class="bg-white border border-slate-200 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-2 gap-10 shadow-xs animate-pulse">
      <div class="space-y-4">
        <div class="aspect-square bg-slate-100 rounded-2xl w-full"></div>
        <div class="grid grid-cols-4 gap-3">
          <div v-for="n in 4" :key="n" class="aspect-square bg-slate-50 rounded-xl"></div>
        </div>
      </div>
      <div class="space-y-6">
        <div class="h-4 bg-slate-100 rounded w-1/4"></div>
        <div class="h-8 bg-slate-200 rounded w-3/4"></div>
        <div class="h-5 bg-slate-100 rounded w-1/3"></div>
        <div class="h-10 bg-slate-200 rounded w-1/2"></div>
        <div class="space-y-2">
          <div class="h-4 bg-slate-100 rounded w-full"></div>
          <div class="h-4 bg-slate-100 rounded w-5/6"></div>
          <div class="h-4 bg-slate-100 rounded w-4/6"></div>
        </div>
        <div class="flex gap-4 pt-4">
          <div class="h-12 bg-slate-100 rounded-2xl flex-1"></div>
          <div class="h-12 bg-slate-200 rounded-2xl flex-1"></div>
        </div>
      </div>
    </div>

    <!-- Cart Skeleton -->
    <div v-else-if="type === 'cart'" class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-white border border-slate-200 rounded-2xl p-4 h-14 bg-slate-50"></div>
        <div v-for="n in (count || 3)" :key="n" class="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 items-center">
          <div class="w-6 h-6 bg-slate-100 rounded-lg"></div>
          <div class="w-16 h-16 bg-slate-100 rounded-xl"></div>
          <div class="flex-grow space-y-2">
            <div class="h-4 bg-slate-200 rounded w-2/3"></div>
            <div class="h-4 bg-slate-100 rounded w-1/4"></div>
          </div>
          <div class="w-24 h-8 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
      <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 h-72">
        <div class="h-6 bg-slate-200 rounded w-1/2"></div>
        <div class="space-y-3 pt-4">
          <div class="h-4 bg-slate-100 rounded w-full"></div>
          <div class="h-4 bg-slate-100 rounded w-full"></div>
          <div class="h-6 bg-slate-200 rounded w-full pt-2"></div>
        </div>
        <div class="h-12 bg-slate-200 rounded-2xl w-full mt-6"></div>
      </div>
    </div>

    <!-- Order List Skeleton -->
    <div v-else-if="type === 'order-list'" class="space-y-6 animate-pulse">
      <div v-for="n in (count || 3)" :key="n" class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <div class="flex justify-between items-center border-b border-slate-100 pb-4">
          <div class="h-5 bg-slate-200 rounded w-1/3"></div>
          <div class="h-5 bg-slate-100 rounded w-1/6"></div>
        </div>
        <div class="flex items-center gap-4 py-2">
          <div class="w-14 h-14 bg-slate-100 rounded-xl"></div>
          <div class="space-y-2 flex-grow">
            <div class="h-4 bg-slate-200 rounded w-1/2"></div>
            <div class="h-3 bg-slate-100 rounded w-1/4"></div>
          </div>
          <div class="h-5 bg-slate-200 rounded w-20"></div>
        </div>
      </div>
    </div>

    <!-- Generic Line Skeleton -->
    <div v-else class="space-y-2.5 animate-pulse">
      <div
        v-for="n in count"
        :key="n"
        class="h-4 bg-slate-100 rounded-lg"
        :style="{ width: `${100 - (n * 12) % 40}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'table' | 'card' | 'kpi' | 'lines' | 'product-detail' | 'cart' | 'order-list'
  count?: number
}

withDefaults(defineProps<Props>(), {
  type: 'lines',
  count: 4,
})
</script>

<style scoped>
.shimmer-wrapper {
  position: relative;
  overflow: hidden;
}
</style>
