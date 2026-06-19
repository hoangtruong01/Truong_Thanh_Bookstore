<template>
  <div class="space-y-6 max-w-3xl mx-auto">
    <div class="flex items-center justify-between bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
      <div class="space-y-1">
        <h2 class="text-lg font-extrabold text-slate-900">{{ isEdit ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới' }}</h2>
        <p class="text-xs text-slate-500 font-medium">Nhập thông tin sản phẩm chi tiết bên dưới.</p>
      </div>
      <button @click="$router.push('/admin/products')" class="text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition-all">
        Quay lại
      </button>
    </div>

    <form @submit.prevent="handleSubmit" class="bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-xs">
      <!-- General Info -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div class="sm:col-span-2">
          <label class="text-xs font-bold text-slate-700">Tên sản phẩm *</label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="Ví dụ: Bút bi Thiên Long..."
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700">Mã SKU *</label>
          <input
            v-model="form.sku"
            type="text"
            required
            placeholder="Ví dụ: TL-027"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700">Thương hiệu</label>
          <input
            v-model="form.brand"
            type="text"
            placeholder="Ví dụ: Thiên Long"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700">Danh mục sản phẩm *</label>
          <select
            v-model="form.category"
            required
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Chọn danh mục</option>
            <option v-for="cat in categories" :key="cat._id" :value="cat._id">
              {{ cat.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700">Trạng thái hoạt động</label>
          <select
            v-model="form.status"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ACTIVE">Hoạt động (Active)</option>
            <option value="INACTIVE">Ngừng hoạt động (Inactive)</option>
          </select>
        </div>
      </div>

      <!-- Pricing & Stock -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-slate-100 pt-6">
        <div>
          <label class="text-xs font-bold text-slate-700">Giá bán lẻ (VND) *</label>
          <input
            v-model.number="form.price"
            type="number"
            required
            min="0"
            placeholder="0"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700">Giá đã giảm (Tùy chọn)</label>
          <input
            v-model.number="form.discountPrice"
            type="number"
            min="0"
            placeholder="0"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700">Tồn kho ban đầu *</label>
          <input
            v-model.number="form.stock"
            type="number"
            required
            min="0"
            placeholder="0"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>
      </div>

      <!-- Description & Image URLs -->
      <div class="space-y-4 border-t border-slate-100 pt-6">
        <div>
          <label class="text-xs font-bold text-slate-700">Hình ảnh sản phẩm (Link URL) *</label>
          <input
            v-model="imageUrl"
            type="text"
            placeholder="Nhập đường dẫn hình ảnh (https://...)"
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
          <p class="text-[10px] text-slate-400 mt-1">Đường dẫn tương đối hoặc Unsplash URL</p>
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700">Mô tả sản phẩm</label>
          <textarea
            v-model="form.description"
            rows="5"
            placeholder="Mô tả chi tiết tính năng, công dụng sản phẩm..."
            class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          ></textarea>
        </div>

        <!-- Featured Switch -->
        <div class="flex items-center gap-3">
          <input
            v-model="form.isFeatured"
            type="checkbox"
            id="isFeatured"
            class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
          />
          <label for="isFeatured" class="text-xs font-bold text-slate-700 cursor-pointer">Sản phẩm nổi bật (Featured)</label>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-4 border-t border-slate-100 pt-6">
        <button
          type="submit"
          :disabled="submitting"
          class="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center text-sm uppercase tracking-wider shadow-lg shadow-blue-500/20 disabled:bg-slate-300 disabled:shadow-none"
        >
          {{ submitting ? 'Đang lưu...' : 'Lưu sản phẩm' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { productService } from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import type { Category } from '@/types'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const isEdit = ref(false)
const submitting = ref(false)
const categories = ref<Category[]>([])
const imageUrl = ref('')

const form = reactive({
  name: '',
  sku: '',
  brand: '',
  category: '',
  price: 0,
  discountPrice: 0,
  stock: 0,
  description: '',
  status: 'ACTIVE',
  isFeatured: false,
})

onMounted(async () => {
  try {
    const catRes = await categoryService.getAll()
    categories.value = catRes.data
  } catch (err) {
    console.error('Error fetching categories', err)
  }

  const id = route.params.id as string
  if (id) {
    isEdit.value = true
    try {
      const prodRes = await productService.getById(id)
      const data = prodRes.data
      form.name = data.name
      form.sku = data.sku
      form.brand = data.brand || ''
      form.category = typeof data.category === 'object' ? data.category._id : data.category
      form.price = data.price
      form.discountPrice = data.discountPrice || 0
      form.stock = data.stock
      form.description = data.description || ''
      form.status = data.status
      form.isFeatured = data.isFeatured || false
      imageUrl.value = data.images?.[0] || ''
    } catch (err) {
      toast.error('Lỗi khi tải thông tin sản phẩm')
      router.push('/admin/products')
    }
  }
})

async function handleSubmit() {
  submitting.value = true
  try {
    const payload = {
      ...form,
      images: imageUrl.value.trim() ? [imageUrl.value.trim()] : ['https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'],
    }

    if (isEdit.value) {
      const id = route.params.id as string
      await productService.update(id, payload)
      toast.success('Cập nhật sản phẩm thành công!')
    } else {
      await productService.create(payload)
      toast.success('Tạo sản phẩm mới thành công!')
    }
    router.push('/admin/products')
  } catch (err: any) {
    toast.error(err.message || 'Lưu sản phẩm thất bại')
  } finally {
    submitting.value = false
  }
}
</script>
