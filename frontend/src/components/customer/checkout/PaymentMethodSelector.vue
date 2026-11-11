<template>
  <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
    <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">Phương thức thanh toán</h3>
    <div class="space-y-3">
      <label
        v-for="method in methods"
        :key="method.value"
        class="flex items-start gap-4 p-4 border rounded-2xl cursor-pointer transition-all hover:bg-slate-50"
        :class="[selected === method.value ? 'border-[#dc2626] bg-red-50/20' : 'border-slate-200']"
      >
        <input
          v-model="selected"
          type="radio"
          :value="method.value"
          name="payment_method"
          class="mt-1 text-[#dc2626] focus:ring-[#dc2626] accent-[#dc2626]"
        />
        <div class="flex-grow">
          <div class="flex items-center gap-2">
            <p class="text-sm font-bold text-slate-800">{{ method.label }}</p>
            <span v-if="method.tag" class="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">{{ method.tag }}</span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">{{ method.description }}</p>
        </div>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CheckoutPaymentMethod, PaymentMethodOption } from './types'

/** Radio list of the payment methods the page allows (already filtered by backend config + auth). */
defineProps<{
  methods: PaymentMethodOption[]
}>()

const selected = defineModel<CheckoutPaymentMethod>({ required: true })
</script>
