<template>
  <!-- Product Specifications Block -->
  <div class="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
    <h2 class="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
      <span>📋</span> Thông tin chi tiết & Thông số kỹ thuật
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm">
      <div v-if="product.author" class="flex py-2.5 border-b border-slate-100/70">
        <span class="w-1/3 text-slate-400 font-medium">Tác giả</span>
        <span class="w-2/3 text-slate-800 font-bold text-red-600">{{ product.author }}</span>
      </div>
      <div v-for="row in optionalRows" :key="row.label" class="flex py-2.5 border-b border-slate-100/70">
        <span class="w-1/3 text-slate-400 font-medium">{{ row.label }}</span>
        <span :class="['w-2/3 text-slate-800', row.mono ? 'font-mono font-semibold' : 'font-semibold']">{{ row.value }}</span>
      </div>
      <div class="flex py-2.5 border-b border-slate-100/70">
        <span class="w-1/3 text-slate-400 font-medium">Mã SKU</span>
        <span class="w-2/3 text-slate-800 font-mono font-semibold">{{ product.sku }}</span>
      </div>
      <div class="flex py-2.5 border-b border-slate-100/70">
        <span class="w-1/3 text-slate-400 font-medium">Danh mục</span>
        <span class="w-2/3 text-slate-800 font-semibold">{{ typeof product.category === 'object' && product.category ? product.category.name : 'Văn phòng phẩm' }}</span>
      </div>
      <div class="flex py-2.5 border-b border-slate-100/70">
        <span class="w-1/3 text-slate-400 font-medium">Đơn vị tính</span>
        <span class="w-2/3 text-slate-800 font-semibold">{{ product.unit || 'cái' }}</span>
      </div>
      <div class="flex py-2.5 border-b border-slate-100/70">
        <span class="w-1/3 text-slate-400 font-medium">Tình trạng kho</span>
        <span :class="[product.stock > 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold']" class="w-2/3">
          {{ product.stock > 0 ? `Còn hàng (${product.stock} ${product.unit || 'cái'})` : 'Tạm hết hàng' }}
        </span>
      </div>
      <div class="flex py-2.5 border-b border-slate-100/70">
        <span class="w-1/3 text-slate-400 font-medium">Xuất xứ</span>
        <span class="w-2/3 text-slate-800 font-semibold">{{ product.origin || 'Việt Nam' }}</span>
      </div>
      <div class="flex py-2.5 border-b border-slate-100/70">
        <span class="w-1/3 text-slate-400 font-medium">Nhà phân phối</span>
        <span class="w-2/3 text-slate-800 font-semibold">Trường Thành Bookstore</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '@/types'

const props = defineProps<{ product: Product }>()

interface SpecRow {
  label: string
  value: string | number
  mono?: boolean
}

// Optional attributes, in display order; rows with an empty value are hidden.
const optionalRows = computed<SpecRow[]>(() => {
  const p = props.product
  const rows: Array<Omit<SpecRow, 'value'> & { value: string | number | undefined | null }> = [
    { label: 'Người dịch', value: p.translator },
    { label: 'Nhà xuất bản', value: p.publisher },
    { label: 'Năm xuất bản', value: p.publicationYear },
    { label: 'Ngôn ngữ', value: p.language },
    { label: 'Số trang', value: p.pages ? `${p.pages} trang` : undefined },
    { label: 'Hình thức bìa', value: p.coverType },
    { label: 'Kích thước', value: p.bookSize },
    { label: 'Mã ISBN', value: p.isbn, mono: true },
    { label: 'Thương hiệu / Hãng', value: p.brand },
    { label: 'Màu sắc', value: p.color },
    { label: 'Chất liệu', value: p.material },
    { label: 'Quy cách đóng gói', value: p.packaging },
  ]
  return rows.filter((r): r is SpecRow => !!r.value)
})
</script>
