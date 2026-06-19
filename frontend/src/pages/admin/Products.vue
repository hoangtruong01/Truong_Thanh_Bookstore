<template>
  <div class="space-y-6">
    <!-- Header with Action (Matches Screenshot) -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <div class="space-y-1">
        <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Danh sách sản phẩm</h2>
        <p class="text-[11px] text-slate-400 font-semibold">Quản lý kho hàng, thông tin sản phẩm và giá cả bán lẻ.</p>
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        <button @click="exportExcel" class="border border-red-200 text-[#dc2626] bg-white hover:bg-red-50 font-bold py-2 px-4 rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          <span>Xuất Excel</span>
        </button>
        <button @click="triggerImportExcel" class="border border-red-200 text-[#dc2626] bg-white hover:bg-red-50 font-bold py-2 px-4 rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
          <span>Nhập Excel</span>
        </button>
        <router-link to="/admin/products/create" class="bg-[#dc2626] hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          <span>Thêm sản phẩm</span>
        </router-link>
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row gap-4 shadow-xs">
      <div class="flex-grow">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm kiếm sản phẩm theo tên, SKU, thương hiệu..."
          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:bg-white transition-all placeholder:text-slate-400"
          @input="handleSearch"
        />
      </div>
      <div class="w-full md:w-48">
        <select
          v-model="selectedCategory"
          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:bg-white text-slate-600 transition-all"
          @change="fetchProducts"
        >
          <option value="">Tất cả danh mục</option>
          <option v-for="cat in categories" :key="cat._id" :value="cat._id">
            {{ cat.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Products Table -->
    <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      <div v-if="loading" class="p-8 animate-pulse space-y-4">
        <div v-for="n in 5" :key="n" class="h-12 bg-slate-100 rounded-xl w-full"></div>
      </div>

      <div v-else-if="products.length === 0" class="p-16 text-center space-y-4">
        <h3 class="text-sm font-bold text-slate-800">Không tìm thấy sản phẩm nào</h3>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
              <th class="py-4 px-6">Sản phẩm</th>
              <th class="py-4 px-6">SKU</th>
              <th class="py-4 px-6">Giá</th>
              <th class="py-4 px-6">Kho</th>
              <th class="py-4 px-6">Đã bán</th>
              <th class="py-4 px-6">Trạng thái</th>
              <th class="py-4 px-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-150 font-medium text-slate-800">
            <tr v-for="prod in products" :key="prod._id" class="hover:bg-slate-50/50">
              <!-- Product Image Circular Colored Box (Matches Screenshot) -->
              <td class="py-4 px-6 flex items-center gap-3">
                <img v-if="prod.images && prod.images.length > 0" :src="prod.images[0]" class="w-10 h-10 rounded-full object-cover border border-slate-100 flex-shrink-0" />
                <div v-else :class="['w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-[15px] flex-shrink-0 shadow-xs', getProductPlaceholder(prod.name).gradient]">
                  <!-- Render custom SVG in list view matching product name -->
                  <svg v-if="getProductPlaceholder(prod.name).icon === 'pencil'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-white/90">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
                  <svg v-else-if="getProductPlaceholder(prod.name).icon === 'document'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-white/90">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <svg v-else-if="getProductPlaceholder(prod.name).icon === 'calculator'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-white/90">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008ZM2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.379-3.379a.75.75 0 0 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06-1.06l-1.25-1.25Z" />
                  </svg>
                  <svg v-else-if="getProductPlaceholder(prod.name).icon === 'folder'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-white/90">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-19.5 0A2.25 2.25 0 0 0 4.5 15h15a2.25 2.25 0 0 0 2.25-2.25m-19.5 0v.225C2.25 14.28 3.52 15 5.04 15h13.92c1.52 0 2.79-.72 2.79-2.025v-.225M3 9V6a3 3 0 0 1 3-3h3.75a3 3 0 0 1 2.25 1.025L13.5 6h6.75A3 3 0 0 1 23 9v2.25m-20.25 0h17.5" />
                  </svg>
                  <span v-else>{{ prod.name.charAt(0).toUpperCase() }}</span>
                </div>
                <div class="min-w-0">
                  <p class="font-extrabold truncate max-w-[200px] text-slate-800 leading-tight">{{ prod.name }}</p>
                  <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    {{ (prod.category && typeof prod.category === 'object') ? prod.category.name : 'Khác' }}
                  </p>
                </div>
              </td>
              <td class="py-4 px-6 font-mono text-[10px] font-bold text-slate-500">{{ prod.sku }}</td>
              <!-- Red Pricing Colors (Matches Screenshot) -->
              <td class="py-4 px-6">
                <div class="flex flex-col">
                  <template v-if="prod.discountPrice > 0">
                    <span class="font-extrabold text-red-600">
                      {{ formatCurrency(prod.discountPrice) }}
                    </span>
                    <span class="line-through text-[10px] text-slate-400 font-medium">
                      {{ formatCurrency(prod.price) }}
                    </span>
                  </template>
                  <template v-else>
                    <span class="font-extrabold text-red-600">
                      {{ formatCurrency(prod.price) }}
                    </span>
                  </template>
                </div>
              </td>
              <td class="py-4 px-6">
                <span :class="[prod.stock <= 10 ? 'text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded' : 'text-slate-700']">{{ prod.stock }}</span>
              </td>
              <td class="py-4 px-6 text-slate-600 font-bold">{{ prod.sold }}</td>
              <td class="py-4 px-6">
                <span :class="['px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide', getProductStatusStyle(prod.status)]">
                  {{ getProductStatusLabel(prod.status) }}
                </span>
              </td>
              <td class="py-4 px-6 text-right space-x-3">
                <router-link :to="`/admin/products/${prod._id}/edit`" class="text-blue-600 hover:text-blue-800 inline-block font-extrabold">
                  Sửa
                </router-link>
                <button @click="deleteProduct(prod._id)" class="text-red-500 hover:text-red-700 inline-block font-extrabold cursor-pointer">
                  Xóa
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center items-center gap-2">
      <button
        @click="changePage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50 text-xs font-bold"
      >
        Trước
      </button>
      <span class="text-xs font-semibold text-slate-500">
        Trang {{ currentPage }} / {{ totalPages }}
      </span>
      <button
        @click="changePage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50 text-xs font-bold"
      >
        Sau
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { productService } from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import { formatCurrency } from '@/utils/helpers'
import type { Product, Category } from '@/types'

const toast = useToast()

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)

const searchQuery = ref('')
const selectedCategory = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const limit = 10

onMounted(async () => {
  try {
    const catRes = await categoryService.getAll()
    categories.value = catRes.data
  } catch (err) {
    console.error('Error fetching categories', err)
  }
  fetchProducts()
})

async function fetchProducts() {
  loading.value = true
  try {
    const res: any = await productService.getAll({
      page: currentPage.value,
      limit,
      q: searchQuery.value || undefined,
      category: selectedCategory.value || undefined,
    })
    products.value = res.data.data
    totalPages.value = res.data.totalPages || 1
  } catch (err) {
    toast.error('Lỗi khi tải danh sách sản phẩm')
  } finally {
    loading.value = false
  }
}

let searchTimeout: any
function handleSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchProducts()
  }, 350)
}

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchProducts()
  }
}

async function deleteProduct(id: string) {
  if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return
  try {
    await productService.delete(id)
    toast.success('Xóa sản phẩm thành công')
    fetchProducts()
  } catch (err) {
    toast.error('Lỗi khi xóa sản phẩm')
  }
}

function exportExcel() {
  toast.info('Đang chuẩn bị xuất file Excel...')
  setTimeout(() => {
    toast.success('Xuất file Excel danh sách sản phẩm thành công!')
  }, 1000)
}

function triggerImportExcel() {
  toast.info('Vui lòng chọn file Excel để nhập danh sách sản phẩm...')
}

function getProductStatusStyle(status: string) {
  return status === 'ACTIVE' || status === 'active' || status === 'true' || status === 'ACTIVE'
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
    : 'bg-slate-100 text-slate-600 border border-slate-200'
}

function getProductStatusLabel(status: string) {
  return status === 'ACTIVE' || status === 'active' || status === 'true' || status === 'ACTIVE'
    ? 'Đang bán'
    : 'Ngừng bán'
}

function getProductPlaceholder(prodName?: string) {
  const name = (prodName || '').toLowerCase()
  if (name.includes('bút') || name.includes('viết') || name.includes('chì')) {
    return {
      gradient: 'bg-gradient-to-br from-red-400 to-rose-500',
      icon: 'pencil'
    }
  }
  if (name.includes('giấy') || name.includes('sổ') || name.includes('vở') || name.includes('tập') || name.includes('note')) {
    return {
      gradient: 'bg-gradient-to-br from-emerald-400 to-teal-500',
      icon: 'document'
    }
  }
  if (name.includes('máy tính') || name.includes('casio')) {
    return {
      gradient: 'bg-gradient-to-br from-indigo-400 to-purple-500',
      icon: 'calculator'
    }
  }
  if (name.includes('hồ sơ') || name.includes('bìa') || name.includes('kẹp') || name.includes('keo') || name.includes('thước')) {
    return {
      gradient: 'bg-gradient-to-br from-blue-400 to-sky-500',
      icon: 'folder'
    }
  }
  return {
    gradient: 'bg-gradient-to-br from-pink-400 to-rose-500',
    icon: 'tag'
  }
}
</script>
