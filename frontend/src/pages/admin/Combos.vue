<template>
  <div class="space-y-6">
    <!-- Header with Action -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
      <div class="space-y-1">
        <h2 class="text-lg font-extrabold text-slate-900">Quản lý Combo sản phẩm</h2>
        <p class="text-xs text-slate-500 font-medium">Tạo và quản lý các combo sản phẩm, thiết lập giá bán combo ưu đãi và liên kết các sản phẩm.</p>
      </div>
      <button
        v-if="!showForm"
        @click="openCreateForm"
        class="bg-[#dc2626] hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors flex items-center gap-2 cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        <span>Thêm Combo mới</span>
      </button>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
      <!-- Combos List -->
      <div class="xl:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <!-- Search box -->
        <div class="p-4 border-b border-slate-100 flex gap-4 items-center">
          <div class="relative flex-grow">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" /></svg>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Tìm kiếm combo theo tên hoặc mô tả..."
              class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:bg-white text-slate-700 font-semibold transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div v-if="loading" class="p-8 animate-pulse space-y-4">
          <div v-for="n in 5" :key="n" class="h-12 bg-slate-100 rounded-xl w-full"></div>
        </div>

        <div v-else-if="combos.length === 0" class="p-16 text-center text-slate-400 font-medium">
          Chưa có combo nào trong hệ thống.
        </div>

        <div v-else-if="filteredCombos.length === 0" class="p-16 text-center text-slate-400 font-medium">
          Không tìm thấy combo nào phù hợp với từ khóa.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-150 text-slate-400 font-bold text-xs uppercase tracking-wider">
                <th class="py-4 px-6">Combo</th>
                <th class="py-4 px-6">Chi tiết giá</th>
                <th class="py-4 px-6">Sản phẩm liên kết</th>
                <th class="py-4 px-6">Trạng thái</th>
                <th class="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
              <tr v-for="combo in filteredCombos" :key="combo._id" class="hover:bg-slate-50/50">
                <td class="py-4 px-6">
                  <div class="font-bold text-slate-800">{{ combo.name }}</div>
                  <div class="text-xs text-slate-450 font-mono mt-0.5">{{ combo.slug }}</div>
                  <div v-if="combo.parentId" class="text-[10px] text-slate-500 font-semibold mt-1">
                    Thuộc: <span class="font-bold text-slate-700">{{ getParentName(combo.parentId) }}</span>
                  </div>
                </td>
                <td class="py-4 px-6">
                  <div class="text-sm font-bold text-[#dc2626]" v-if="combo.comboPrice">
                    {{ formatCurrency(combo.comboPrice) }}
                  </div>
                  <div class="text-xs text-slate-400 font-normal mt-0.5" v-if="combo.products && combo.products.length">
                    Tổng giá bán lẻ: {{ formatCurrency(getComboRetailTotal(combo)) }}
                  </div>
                  <span v-else class="text-xs text-slate-400 font-medium italic">Không định giá</span>
                </td>
                <td class="py-4 px-6">
                  <div v-if="combo.products && combo.products.length" class="space-y-1">
                    <span class="inline-block bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
                      {{ combo.products.length }} sản phẩm
                    </span>
                    <div class="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">
                      {{ combo.products.map(p => typeof p === 'object' ? p.name : '').filter(Boolean).join(', ') }}
                    </div>
                  </div>
                  <span v-else class="text-xs text-slate-400 italic">Chưa có sản phẩm</span>
                </td>
                <td class="py-4 px-6">
                  <span :class="[combo.status ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200', 'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider']">
                    {{ combo.status ? 'Đang hoạt động' : 'Tạm khóa' }}
                  </span>
                </td>
                <td class="py-4 px-6 text-right space-x-3">
                  <button @click="openEditForm(combo)" class="text-blue-600 hover:text-blue-800 inline-block font-extrabold cursor-pointer">
                    Sửa
                  </button>
                  <button @click="deleteCombo(combo._id)" class="text-red-500 hover:text-red-700 inline-block font-extrabold cursor-pointer">
                    Xóa
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Form Panel -->
      <div v-if="showForm" class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        <div class="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 class="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            {{ isEditing ? 'Cập nhật Combo' : 'Thêm Combo mới' }}
          </h3>
          <button @click="showForm = false" class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">&times;</button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="text-xs font-bold text-slate-700">Tên Combo *</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Ví dụ: Combo Học Tập Tiết Kiệm"
              class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:bg-white text-slate-700 font-semibold"
            />
          </div>

          <div>
            <label class="text-xs font-bold text-slate-700">Đường dẫn tự định nghĩa (Slug)</label>
            <input
              v-model="form.slug"
              type="text"
              placeholder="Ví dụ: combo-hoc-tap-tiet-kiem"
              class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:bg-white font-mono text-slate-600"
            />
          </div>

          <div>
            <label class="text-xs font-bold text-slate-700">Mô tả Combo</label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="Mô tả ngắn gọn về combo..."
              class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:bg-white text-slate-700 font-medium"
            ></textarea>
          </div>

          <div>
            <label class="text-xs font-bold text-slate-700">Thuộc Combo cha (Nếu có)</label>
            <select
              v-model="form.parentId"
              class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:bg-white text-slate-600 font-semibold"
            >
              <option :value="null">Không có (Là combo chính)</option>
              <option
                v-for="parent in parentCombos"
                :key="parent._id"
                :value="parent._id"
                :disabled="parent._id === currentComboId"
              >
                {{ parent.name }}
              </option>
            </select>
          </div>

          <!-- Product Picker inside Combo -->
          <div class="border-t border-slate-100 pt-4 space-y-3">
            <h4 class="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Danh sách sản phẩm trong Combo</h4>
            
            <div class="flex gap-2 relative">
              <div class="flex-grow relative">
                <input
                  v-model="productSearchText"
                  type="text"
                  @focus="showProductDropdown = true"
                  @blur="handleSearchBlur"
                  placeholder="Gõ tìm sản phẩm (theo Tên hoặc SKU)..."
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] text-slate-700 font-semibold placeholder:text-slate-400"
                />
                
                <!-- Autocomplete Dropdown List -->
                <div
                  v-if="showProductDropdown && filteredSearchProducts.length > 0"
                  class="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-250 rounded-xl shadow-lg divide-y divide-slate-100"
                >
                  <div
                    v-for="prod in filteredSearchProducts"
                    :key="prod._id"
                    @mousedown.prevent="selectSearchProduct(prod)"
                    class="p-2.5 text-left text-xs hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors font-medium text-slate-700"
                  >
                    <div>
                      <div class="font-bold text-slate-800">{{ prod.name }}</div>
                      <div class="text-[10px] text-slate-450 font-mono">SKU: {{ prod.sku }}</div>
                    </div>
                    <div class="text-right ml-2 flex-shrink-0">
                      <span class="font-bold text-slate-900">{{ formatCurrency(prod.discountPrice || prod.price) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                @click="addProductToCombo"
                class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors flex-shrink-0"
              >
                Thêm
              </button>
            </div>

            <!-- Products List Table / Columns -->
            <div v-if="selectedProductsList.length === 0" class="text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-medium">
              Chưa có sản phẩm nào được thêm vào combo.
            </div>
            
            <div v-else class="border border-slate-150 rounded-xl overflow-hidden bg-slate-50/50">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="bg-slate-100 text-slate-500 font-bold border-b border-slate-150">
                    <th class="p-2.5">Sản phẩm</th>
                    <th class="p-2.5 text-right">Giá lẻ</th>
                    <th class="p-2.5 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-150 font-semibold text-slate-700">
                  <tr v-for="prod in selectedProductsList" :key="prod._id">
                    <td class="p-2.5">
                      <div class="truncate max-w-[150px] font-bold">{{ prod.name }}</div>
                      <div class="text-[10px] text-slate-400 font-mono">{{ prod.sku }}</div>
                    </td>
                    <td class="p-2.5 text-right font-extrabold text-slate-800">
                      {{ formatCurrency(prod.discountPrice || prod.price) }}
                    </td>
                    <td class="p-2.5 text-center">
                      <button
                        type="button"
                        @click="removeProductFromCombo(prod._id)"
                        class="text-red-500 hover:text-red-700 text-sm font-bold cursor-pointer"
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                  <!-- Calculations Footer -->
                  <tr class="bg-slate-100/80 font-extrabold text-slate-900 border-t border-slate-200">
                    <td class="p-2.5 uppercase text-[10px] tracking-wider">Tổng lẻ cộng dồn</td>
                    <td class="p-2.5 text-right text-sm text-blue-700 font-black">
                      {{ formatCurrency(totalRetailPrice) }}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Combo Pricing -->
          <div class="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-slate-700">Giá mua Combo ưu đãi *</label>
              <input
                :value="formatNumberWithDots(form.comboPrice)"
                @input="handleComboPriceInput"
                type="text"
                required
                placeholder="Nhập giá mua combo..."
                class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:bg-white text-slate-700 font-black"
              />
            </div>
            
            <div class="flex flex-col justify-end">
              <div v-if="totalRetailPrice > 0" class="bg-emerald-50 border border-emerald-100 rounded-xl p-2 text-center text-xs font-bold text-emerald-800">
                <div>Tiết kiệm: {{ formatCurrency(totalRetailPrice - form.comboPrice) }}</div>
                <div class="text-[10px] text-emerald-600 font-medium">
                  (-{{ Math.round(((totalRetailPrice - form.comboPrice) / totalRetailPrice) * 100) }}%) so với mua lẻ
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="status-checkbox"
              v-model="form.status"
              class="w-4 h-4 text-[#dc2626] border-slate-350 focus:ring-[#dc2626] rounded cursor-pointer"
            />
            <label for="status-checkbox" class="text-xs font-bold text-slate-700 cursor-pointer">Kích hoạt hoạt động</label>
          </div>

          <div class="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              @click="showForm = false"
              class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              class="flex-1 bg-[#dc2626] hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { categoryService } from '@/services/category.service'
import { productService } from '@/services/product.service'
import type { Category, Product } from '@/types'

const formatNumberWithDots = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '';
  const clean = String(val).replace(/\D/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const handleComboPriceInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const rawValue = target.value;
  const cleanValue = rawValue.replace(/\D/g, '');
  form.value.comboPrice = cleanValue ? parseInt(cleanValue, 10) : 0;
  target.value = formatNumberWithDots(cleanValue);
};

const toast = useToast()

const combos = ref<Category[]>([])
const allProducts = ref<Product[]>([])
const loading = ref(true)
const searchQuery = ref('')

const showForm = ref(false)
const isEditing = ref(false)
const currentComboId = ref<string | null>(null)
const selectedProductIdToAdd = ref('')
const productSearchText = ref('')
const showProductDropdown = ref(false)

const form = ref({
  name: '',
  slug: '',
  description: '',
  parentId: null as string | null,
  products: [] as string[],
  comboPrice: 0,
  status: true,
})

// Filter parent combos to populate the dropdown
const parentCombos = computed(() => {
  return combos.value.filter(c => !c.parentId)
})

const filteredCombos = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return combos.value
  return combos.value.filter(
    c =>
      c.name.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query))
  )
})

// Filter products inside dropdown based on search text (Name or SKU)
const filteredSearchProducts = computed(() => {
  const txt = productSearchText.value.trim().toLowerCase()
  if (!txt) return allProducts.value.slice(0, 100) // limit initially to prevent DOM overload
  return allProducts.value.filter(
    p =>
      p.name.toLowerCase().includes(txt) ||
      (p.sku && p.sku.toLowerCase().includes(txt))
  )
})

// Reset selected product ID if user manually clears input
watch(productSearchText, (newVal) => {
  if (!newVal) {
    selectedProductIdToAdd.value = ''
  }
})

// Get details of selected products inside the form
const selectedProductsList = computed(() => {
  return form.value.products
    .map(id => allProducts.value.find(p => p._id === id))
    .filter(Boolean) as Product[]
})

// Calculate total retail price
const totalRetailPrice = computed(() => {
  return selectedProductsList.value.reduce((sum, p) => sum + (p.discountPrice || p.price || 0), 0)
})

onMounted(() => {
  fetchCombos()
  fetchProducts()
})

async function fetchCombos() {
  loading.value = true
  try {
    const res = await categoryService.getAllAdmin()
    combos.value = res.data
  } catch (err) {
    toast.error('Lỗi khi lấy danh sách combo')
  } finally {
    loading.value = false
  }
}

async function fetchProducts() {
  try {
    const res = await productService.getAll({ page: 1, limit: 1000 })
    allProducts.value = res.data.data
  } catch (err) {
    console.error('Lỗi khi tải danh sách sản phẩm', err)
  }
}

function getParentName(parentId: any): string {
  if (!parentId) return ''
  const parentIdStr = typeof parentId === 'object' ? parentId._id : parentId
  const parent = combos.value.find(c => c._id === parentIdStr)
  return parent ? parent.name : 'Chưa xác định'
}

function getComboRetailTotal(combo: Category): number {
  if (!combo.products || !combo.products.length) return 0
  return combo.products.reduce((sum, p) => {
    if (typeof p === 'object') {
      return sum + (p.discountPrice || p.price || 0)
    }
    return sum
  }, 0)
}

function selectSearchProduct(prod: Product) {
  selectedProductIdToAdd.value = prod._id
  productSearchText.value = `${prod.name} [SKU: ${prod.sku}]`
  showProductDropdown.value = false
}

function handleSearchBlur() {
  // Delay slightly to allow mousedown handlers on dropdown items to fire first
  setTimeout(() => {
    showProductDropdown.value = false
  }, 200)
}

function addProductToCombo() {
  if (!selectedProductIdToAdd.value) {
    toast.error('Vui lòng chọn sản phẩm hợp lệ từ danh sách gợi ý')
    return
  }
  if (form.value.products.includes(selectedProductIdToAdd.value)) {
    toast.warning('Sản phẩm này đã có trong combo')
    return
  }
  form.value.products.push(selectedProductIdToAdd.value)
  selectedProductIdToAdd.value = ''
  productSearchText.value = ''
}

function removeProductFromCombo(productId: string) {
  form.value.products = form.value.products.filter(id => id !== productId)
}

function openCreateForm() {
  isEditing.value = false
  currentComboId.value = null
  selectedProductIdToAdd.value = ''
  productSearchText.value = ''
  form.value = {
    name: '',
    slug: '',
    description: '',
    parentId: null,
    products: [],
    comboPrice: 0,
    status: true,
  }
  showForm.value = true
}

function openEditForm(combo: Category) {
  isEditing.value = true
  currentComboId.value = combo._id
  selectedProductIdToAdd.value = ''
  productSearchText.value = ''
  
  // Extract product IDs
  const prodIds = combo.products
    ? combo.products.map(p => typeof p === 'object' ? p._id : p)
    : []

  form.value = {
    name: combo.name,
    slug: combo.slug || '',
    description: combo.description || '',
    parentId: combo.parentId
      ? typeof combo.parentId === 'object'
        ? (combo.parentId as any)._id
        : combo.parentId
      : null,
    products: prodIds,
    comboPrice: combo.comboPrice || 0,
    status: combo.status,
  }
  showForm.value = true
}

async function handleSubmit() {
  try {
    const payload = {
      ...form.value,
      parentId: form.value.parentId || null,
    }

    if (isEditing.value && currentComboId.value) {
      await categoryService.update(currentComboId.value, payload)
      toast.success('Cập nhật combo thành công')
    } else {
      await categoryService.create(payload)
      toast.success('Tạo combo mới thành công')
    }
    showForm.value = false
    fetchCombos()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại')
  }
}

async function deleteCombo(id: string) {
  if (!confirm('Bạn có chắc chắn muốn xóa combo này? Các sản phẩm thuộc combo này sẽ bị mất phân nhóm.')) return
  try {
    await categoryService.delete(id)
    toast.success('Xóa combo thành công')
    fetchCombos()
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Lỗi khi xóa combo')
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value)
}
</script>
