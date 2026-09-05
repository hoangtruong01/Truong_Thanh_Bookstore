<template>
  <div class="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
    <!-- Top toolbar slot (if needed) -->
    <div v-if="$slots.header" class="p-4 border-b border-slate-100">
      <slot name="header"></slot>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="p-6 space-y-3 animate-pulse">
      <div v-for="n in skeletonRows" :key="n" class="h-12 bg-slate-100 rounded-2xl w-full"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!items || items.length === 0" class="p-16 text-center">
      <slot name="empty">
        <div class="max-w-sm mx-auto space-y-2">
          <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <p class="text-sm font-bold text-slate-700">{{ emptyText }}</p>
          <p class="text-xs text-slate-400 font-medium">{{ emptySubtext }}</p>
        </div>
      </slot>
    </div>

    <!-- Data Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
            <th
              v-for="col in columns"
              :key="col.key"
              :class="[
                'py-3.5 px-5',
                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                col.headerClass || ''
              ]"
              :style="{ width: col.width }"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
          <tr
            v-for="(row, index) in items"
            :key="getRowKey(row, index)"
            @click="onRowClick(row, index)"
            :class="[
              'transition-colors',
              clickable ? 'hover:bg-slate-50/70 cursor-pointer' : '',
              selectedRowKey && getRowKey(row, index) === selectedRowKey ? 'bg-red-50/40' : ''
            ]"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :class="[
                'py-3.5 px-5 align-middle',
                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                col.cellClass || ''
              ]"
            >
              <slot :name="`cell(${col.key})`" :row="row" :value="row[col.key]" :index="index">
                {{ row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '—' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Footer -->
    <div
      v-if="pagination && totalItems > 0"
      class="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
    >
      <div class="text-slate-500 font-medium">
        Hiển thị <span class="font-bold text-slate-800">{{ rangeStart }} - {{ rangeEnd }}</span> trên tổng số <span class="font-bold text-slate-800">{{ totalItems }}</span> kết quả
      </div>
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          @click="changePage(currentPage - 1)"
          :disabled="currentPage <= 1"
          class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          Trước
        </button>
        <span class="px-3 py-1.5 font-bold text-slate-700">
          Trang {{ currentPage }} / {{ totalPages }}
        </span>
        <button
          type="button"
          @click="changePage(currentPage + 1)"
          :disabled="currentPage >= totalPages"
          class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          Sau
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface TableColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  width?: string
  headerClass?: string
  cellClass?: string
}

const props = withDefaults(
  defineProps<{
    columns: TableColumn[]
    items: any[]
    loading?: boolean
    skeletonRows?: number
    emptyText?: string
    emptySubtext?: string
    clickable?: boolean
    selectedRowKey?: string
    rowKey?: string
    pagination?: boolean
    currentPage?: number
    pageSize?: number
    totalItems?: number
  }>(),
  {
    loading: false,
    skeletonRows: 5,
    emptyText: 'Chưa có dữ liệu nào.',
    emptySubtext: 'Vui lòng kiểm tra lại bộ lọc hoặc tạo dữ liệu mới.',
    clickable: false,
    selectedRowKey: '',
    rowKey: '_id',
    pagination: false,
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
  }
)

const emit = defineEmits<{
  (e: 'row-click', row: any, index: number): void
  (e: 'page-change', page: number): void
}>()

function getRowKey(row: any, index: number) {
  return row[props.rowKey] || index
}

function onRowClick(row: any, index: number) {
  if (props.clickable) {
    emit('row-click', row, index)
  }
}

const totalPages = computed(() => {
  if (!props.totalItems || !props.pageSize) return 1
  return Math.ceil(props.totalItems / props.pageSize) || 1
})

const rangeStart = computed(() => {
  if (props.totalItems === 0) return 0
  return (props.currentPage - 1) * props.pageSize + 1
})

const rangeEnd = computed(() => {
  return Math.min(props.currentPage * props.pageSize, props.totalItems)
})

function changePage(newPage: number) {
  if (newPage >= 1 && newPage <= totalPages.value) {
    emit('page-change', newPage)
  }
}
</script>
