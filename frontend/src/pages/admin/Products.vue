<template>
  <div class="space-y-6">
    <!-- Header with Action -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
      <div class="space-y-1">
        <h2 class="text-lg font-extrabold text-slate-900">Danh sách sản phẩm</h2>
        <p class="text-xs text-slate-500 font-medium">Quản lý kho hàng, thông tin sản phẩm và giá cả bán lẻ.</p>
      </div>
      <router-link to="/admin/products/create" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        <span>Thêm sản phẩm</span>
      </router-link>
    </div>

    <!-- Filters & Search -->
    <div class="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row gap-4 shadow-xs">
      <div class="flex-grow">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm kiếm sản phẩm theo tên, SKU, thương hiệu..."
          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          @input="handleSearch"
        />
      </div>
      <div class="w-full md:w-48">
        <select
          v-model="selectedCategory"
          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
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
    <div class="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
      <div v-if="loading" class="p-8 animate-pulse space-y-4">
        <div v-for="n in 5" :key="n" class="h-12 bg-slate-100 rounded-xl w-full"></div>
      </div>

      <div v-else-if="products.length === 0" class="p-16 text-center space-y-4">
        <h3 class="text-sm font-bold text-slate-800">Không tìm thấy sản phẩm nào</h3>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-150 text-slate-400 font-bold text-xs uppercase tracking-wider">
              <th class="py-4 px-6">Sản phẩm</th>
              <th class="py-4 px-6">SKU</th>
              <th class="py-4 px-6">Giá</th>
              <th class="py-4 px-6">Tồn kho</th>
              <th class="py-4 px-6">Đã bán</th>
              <th class="py-4 px-6">Trạng thái</th>
              <th class="py-4 px-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
            <tr v-for="prod in products" :key="prod._id" class="hover:bg-slate-50/50">
              <td class="py-4 px-6 flex items-center gap-3">
                <img :src="prod.images[0] || 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'" class="w-10 h-10 rounded-xl object-cover border border-slate-100 bg-slate-50 flex-shrink-0" />
                <div class="min-w-0">
                  <p class="font-bold truncate max-w-[200px] text-slate-900">{{ prod.name }}</p>
                  <p class="text-xs text-slate-400 truncate max-w-[200px]">
                    {{ typeof prod.category === 'object' ? prod.category.name : 'Khác' }}
                  </p>
                </div>
              </td>
              <td class="py-4 px-6 font-mono text-xs">{{ prod.sku }}</td>
              <td class="py-4 px-6">
                <div class="flex flex-col">
                  <span v-if="prod.discountPrice > 0" class="font-bold text-blue-700">
                    {{ formatCurrency(prod.discountPrice) }}
                  </span>
                  <span :class="[prod.discountPrice > 0 ? 'line-through text-xs text-slate-400 font-normal' : 'font-bold']">
                    {{ formatCurrency(prod.price) }}
                  </span>
                </div>
              </td>
              <td class="py-4 px-6">
                <span :class="[prod.stock <= 10 ? 'text-red-600 font-bold' : '']">{{ prod.stock }}</span>
              </td>
              <td class="py-4 px-6">{{ prod.sold }}</td>
              <td class="py-4 px-6">
                <span :class="['px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', getStatusColor(prod.status)]">
                  {{ getStatusLabel(prod.status) }}
                </span>
              </td>
              <td class="py-4 px-6 text-right space-x-2">
                <router-link :to="`/admin/products/${prod._id}/edit`" class="text-blue-600 hover:text-blue-800 inline-block font-bold">
                  Sửa
                </router-link>
                <button @click="deleteProduct(prod._id)" class="text-red-500 hover:text-red-700 inline-block font-bold">
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
        class="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        Trước
      </button>
      <span class="text-sm font-medium text-slate-500">
        Trang {{ currentPage }} / {{ totalPages }}
      </span>
      <button
        @click="changePage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50"
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
import { formatCurrency, getStatusColor, getStatusLabel } from '@/utils/helpers'
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
    products.value = res.data
    totalPages.value = res.totalPages || 1
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
</script>
