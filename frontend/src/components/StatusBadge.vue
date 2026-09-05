<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all select-none',
      badgeStyle
    ]"
  >
    <span v-if="showDot" class="w-1.5 h-1.5 rounded-full" :class="dotStyle"></span>
    <slot>{{ displayLabel }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    status?: string | boolean | null
    type?: 'order' | 'payment' | 'inventory' | 'boolean' | 'custom'
    label?: string
    showDot?: boolean
  }>(),
  {
    status: '',
    type: 'custom',
    label: '',
    showDot: true,
  }
)

const normalizedStatus = computed(() => {
  if (typeof props.status === 'boolean') {
    return props.status ? 'ACTIVE' : 'INACTIVE'
  }
  return String(props.status || '').toUpperCase().trim()
})

const badgeConfig = computed(() => {
  const s = normalizedStatus.value

  // Orders
  if (s === 'PENDING') {
    return { label: 'Chờ xác nhận', bg: 'bg-amber-50 text-amber-700 border border-amber-200/70', dot: 'bg-amber-500' }
  }
  if (s === 'CONFIRMED') {
    return { label: 'Đã xác nhận', bg: 'bg-blue-50 text-blue-700 border border-blue-200/70', dot: 'bg-blue-500' }
  }
  if (s === 'PROCESSING') {
    return { label: 'Đang chuẩn bị', bg: 'bg-indigo-50 text-indigo-700 border border-indigo-200/70', dot: 'bg-indigo-500' }
  }
  if (s === 'SHIPPING') {
    return { label: 'Đang giao hàng', bg: 'bg-purple-50 text-purple-700 border border-purple-200/70', dot: 'bg-purple-500' }
  }
  if (s === 'DELIVERED') {
    return { label: 'Đã giao thành công', bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70', dot: 'bg-emerald-500' }
  }
  if (s === 'COMPLETED') {
    return { label: 'Hoàn thành', bg: 'bg-emerald-50 text-emerald-800 border border-emerald-300', dot: 'bg-emerald-600' }
  }
  if (s === 'CANCELLED') {
    return { label: 'Đã hủy', bg: 'bg-rose-50 text-rose-700 border border-rose-200/70', dot: 'bg-rose-500' }
  }
  if (s === 'RETURNED') {
    return { label: 'Đã trả hàng', bg: 'bg-slate-100 text-slate-700 border border-slate-200', dot: 'bg-slate-500' }
  }

  // Payment
  if (s === 'PAID') {
    return { label: 'Đã thanh toán', bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70', dot: 'bg-emerald-500' }
  }
  if (s === 'UNPAID') {
    return { label: 'Chưa thanh toán', bg: 'bg-amber-50 text-amber-700 border border-amber-200/70', dot: 'bg-amber-500' }
  }
  if (s === 'REFUNDED') {
    return { label: 'Đã hoàn tiền', bg: 'bg-slate-100 text-slate-600 border border-slate-200', dot: 'bg-slate-400' }
  }
  if (s === 'FAILED') {
    return { label: 'Thất bại', bg: 'bg-rose-50 text-rose-700 border border-rose-200/70', dot: 'bg-rose-500' }
  }

  // Inventory / Stock
  if (s === 'IN_STOCK') {
    return { label: 'Còn hàng', bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70', dot: 'bg-emerald-500' }
  }
  if (s === 'LOW_STOCK') {
    return { label: 'Sắp hết hàng', bg: 'bg-amber-50 text-amber-700 border border-amber-200/70', dot: 'bg-amber-500' }
  }
  if (s === 'OUT_OF_STOCK') {
    return { label: 'Hết hàng', bg: 'bg-rose-50 text-rose-700 border border-rose-200/70', dot: 'bg-rose-500' }
  }

  // Boolean / Active
  if (s === 'ACTIVE' || s === 'TRUE') {
    return { label: 'Hoạt động', bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70', dot: 'bg-emerald-500' }
  }
  if (s === 'INACTIVE' || s === 'FALSE' || s === 'LOCKED') {
    return { label: 'Đã khóa', bg: 'bg-rose-50 text-rose-700 border border-rose-200/70', dot: 'bg-rose-500' }
  }

  return {
    label: props.label || s,
    bg: 'bg-slate-50 text-slate-600 border border-slate-200',
    dot: 'bg-slate-400',
  }
})

const badgeStyle = computed(() => badgeConfig.value.bg)
const dotStyle = computed(() => badgeConfig.value.dot)
const displayLabel = computed(() => props.label || badgeConfig.value.label)
</script>
