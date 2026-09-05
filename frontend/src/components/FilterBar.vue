<template>
  <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
    <div class="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
      <!-- Search Input -->
      <div class="relative flex-grow max-w-lg">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
          </svg>
        </span>
        <input
          :value="modelValue"
          @input="onInput"
          type="text"
          :placeholder="placeholder"
          class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white text-slate-800 font-semibold transition-all placeholder:text-slate-400"
        />
        <button
          v-if="modelValue"
          @click="clearSearch"
          type="button"
          class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Actions / Extra filters slot -->
      <div class="flex items-center gap-2 flex-wrap justify-end">
        <slot name="filters"></slot>
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- Optional Filter Pills / Tabs Row -->
    <div v-if="tabs && tabs.length > 0" class="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none border-t border-slate-100">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        @click="selectTab(tab.value)"
        :class="[
          activeTab === tab.value
            ? 'bg-[#dc2626] text-white shadow-xs'
            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80',
          'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap'
        ]"
      >
        {{ tab.label }}
        <span
          v-if="tab.count !== undefined"
          :class="[
            activeTab === tab.value ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700',
            'ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold'
          ]"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue'

export interface FilterTab {
  label: string
  value: string
  count?: number
}

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    tabs?: FilterTab[]
    activeTab?: string
    debounceMs?: number
  }>(),
  {
    modelValue: '',
    placeholder: 'Tìm kiếm dữ liệu...',
    tabs: () => [],
    activeTab: '',
    debounceMs: 250,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'update:activeTab', val: string): void
  (e: 'search', val: string): void
  (e: 'tab-change', val: string): void
}>()

let timer: ReturnType<typeof setTimeout> | undefined
onUnmounted(() => clearTimeout(timer))

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  emit('update:modelValue', val)
  clearTimeout(timer)
  timer = setTimeout(() => {
    emit('search', val)
  }, props.debounceMs)
}

function clearSearch() {
  clearTimeout(timer)
  emit('update:modelValue', '')
  emit('search', '')
}

function selectTab(val: string) {
  emit('update:activeTab', val)
  emit('tab-change', val)
}
</script>
