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
import {
  getStatusMeta,
  STATUS_TONE_CLASSES,
  UNKNOWN_STATUS_CLASSES,
  type StatusDomain,
} from '@/utils/helpers'

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

// `type` picks the canonical map (payment PENDING ≠ order PENDING). 'custom', or a
// status missing from the typed map, falls back to the generic lookup order.
const badgeConfig = computed(() => {
  const s = normalizedStatus.value
  const domain: StatusDomain | undefined = props.type === 'custom' ? undefined : props.type
  const meta = (domain && getStatusMeta(s, domain)) || getStatusMeta(s)

  if (meta) {
    const tone = STATUS_TONE_CLASSES[meta.tone]
    return { label: meta.label, bg: tone.badge, dot: tone.dot }
  }

  return {
    label: props.label || s,
    bg: UNKNOWN_STATUS_CLASSES.badge,
    dot: UNKNOWN_STATUS_CLASSES.dot,
  }
})

const badgeStyle = computed(() => badgeConfig.value.bg)
const dotStyle = computed(() => badgeConfig.value.dot)
const displayLabel = computed(() => props.label || badgeConfig.value.label)
</script>
