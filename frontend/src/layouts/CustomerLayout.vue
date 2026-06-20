<template>
  <div class="min-h-screen flex flex-col bg-slate-50">
    <!-- Top Bar -->
    <div class="bg-[#dc2626] text-white text-[11px] py-1.5 text-center font-medium tracking-wide flex items-center justify-center gap-1.5">
      <span>🚚</span> Miễn phí giao hàng cho đơn từ 299K
    </div>

    <!-- Main Header -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20 gap-4">
          <!-- Logo -->
          <router-link to="/" class="flex items-center gap-2.5 flex-shrink-0">
            <!-- Icon TT -->
            <img src="@/assets/logo.jpg" class="w-10 h-10 rounded-full object-cover border border-slate-200" alt="Trường Thành Logo" />
            <div class="flex flex-col leading-none">
              <span class="text-lg font-black text-[#dc2626] tracking-tight">TRƯỜNG THÀNH</span>
              <span class="text-[9px] font-bold text-slate-500 tracking-widest uppercase">Stationery</span>
            </div>
          </router-link>

          <!-- Search Bar & Category Menu -->
          <div class="flex-1 max-w-xl hidden md:flex items-center gap-3 relative">
            <!-- Category Menu Button -->
            <div class="relative" @mouseenter="showMenu = true" @mouseleave="showMenu = false">
              <button type="button" class="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors cursor-pointer">
                <!-- Grid icon -->
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-slate-600">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5 text-slate-500 transition-transform duration-200" :class="{ 'rotate-180': showMenu }">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              <!-- Mega Menu Dropdown -->
              <div
                v-show="showMenu"
                class="absolute left-0 top-full pt-3 z-50 w-[700px] transition-all duration-200"
              >
                <div class="bg-white border border-slate-200 rounded-3xl shadow-xl flex overflow-hidden min-h-[350px] h-[450px]">
                  <!-- Left Sidebar: Parent Categories -->
                  <div class="w-2/5 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto space-y-1">
                    <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Danh mục sản phẩm</div>
                    <button
                      v-for="cat in parentCategories"
                      :key="cat._id"
                      type="button"
                      @mouseenter="activeParent = cat"
                      @click="navigateToCategory(cat._id)"
                      class="w-full text-left px-4 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-between group/item"
                      :class="activeParent?._id === cat._id ? 'bg-[#dc2626] text-white shadow-md' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'"
                    >
                      <span class="truncate text-slate-700" :class="{ 'text-white': activeParent?._id === cat._id }">{{ cat.name }}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"
                        class="w-3.5 h-3.5 opacity-60 group-hover/item:translate-x-0.5 transition-transform"
                        :class="activeParent?._id === cat._id ? 'text-white' : 'text-slate-400'"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </div>

                  <!-- Right Panel: Subcategories or Products -->
                  <div class="w-3/5 p-6 overflow-y-auto bg-white flex flex-col text-slate-800">
                    <div v-if="activeParent" class="space-y-6 flex-grow">
                      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 class="text-sm font-black text-slate-900 flex items-center gap-1.5">
                          <span class="w-2.5 h-2.5 rounded-full bg-[#dc2626]"></span>
                          {{ activeParent.name }}
                        </h3>
                        <button
                          type="button"
                          @click="navigateToCategory(activeParent._id)"
                          class="text-[11px] font-bold text-[#dc2626] hover:text-[#b91c1c] transition-colors cursor-pointer"
                        >
                          Xem tất cả &gt;
                        </button>
                      </div>

                      <!-- Subcategories Grid (if any subcategories exist) -->
                      <div v-if="getSubcategoriesForActiveParent.length > 0" class="grid grid-cols-2 gap-6">
                        <div v-for="sub in getSubcategoriesForActiveParent" :key="sub._id" class="space-y-2">
                          <router-link
                            :to="`/products?category=${sub._id}`"
                            @click="showMenu = false"
                            class="text-xs font-black text-slate-800 hover:text-[#dc2626] transition-colors block"
                          >
                            {{ sub.name }}
                          </router-link>
                        </div>
                      </div>

                      <!-- Fallback: Show Products in this Category -->
                      <div v-else-if="activeParent.products && activeParent.products.length > 0" class="space-y-3">
                        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sản phẩm nổi bật</div>
                        <div class="grid grid-cols-1 gap-2.5">
                          <router-link
                            v-for="prod in activeParent.products.slice(0, 4)"
                            :key="prod._id"
                            :to="`/products?q=${encodeURIComponent(prod.name)}`"
                            @click="showMenu = false"
                            class="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-xs transition-all group/prod cursor-pointer"
                          >
                            <img
                              :src="prod.images && prod.images[0] ? prod.images[0] : 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=100'"
                              class="w-10 h-10 object-cover rounded-xl bg-slate-50 flex-shrink-0"
                              alt="Product thumbnail"
                            />
                            <div class="min-w-0 flex-1">
                              <div class="text-xs font-bold text-slate-800 group-hover/prod:text-[#dc2626] truncate leading-snug">
                                {{ prod.name }}
                              </div>
                              <div class="text-[11px] font-bold text-[#dc2626] mt-0.5">
                                {{ formatCurrency(prod.discountPrice || prod.price) }}
                              </div>
                            </div>
                          </router-link>
                        </div>
                      </div>

                      <!-- Empty State -->
                      <div v-else class="flex flex-col items-center justify-center h-64 text-center text-slate-400 space-y-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 opacity-60"><path stroke-linecap="round" stroke-linejoin="round" d="m21-21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" /></svg>
                        <p class="text-xs font-bold">Chưa có sản phẩm hoặc danh mục con</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Search Bar -->
            <form @submit.prevent="handleSearch" class="flex-grow">
              <div class="relative w-full">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Tìm bút, sổ tay, giấy A4, kẹp giấy..."
                  class="w-full bg-slate-100 border border-slate-200 rounded-full py-2.5 pl-5 pr-28 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-transparent transition-all placeholder:text-slate-400"
                />
                <button type="submit" class="absolute right-1 top-1/2 -translate-y-1/2 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold px-4 py-2 rounded-full transition-colors cursor-pointer">
                  Tìm kiếm
                </button>
              </div>
            </form>
          </div>

          <!-- Utility Icons -->
          <div class="flex items-center gap-6">
            <!-- Notifications -->
            <button class="relative text-slate-700 hover:text-[#dc2626] transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </button>

            <!-- Cart -->
            <router-link to="/cart" class="relative text-slate-700 hover:text-[#dc2626] flex items-center gap-1 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              <span v-if="cartStore.itemsCount > 0" class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {{ cartStore.itemsCount }}
              </span>
            </router-link>

            <!-- Account -->
            <div class="relative">
              <template v-if="authStore.isAuthenticated">
                <div class="flex items-center gap-2 cursor-pointer group">
                  <div class="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#dc2626] font-bold border border-red-100">
                    {{ authStore.user?.fullName.charAt(0).toUpperCase() }}
                  </div>
                  <span class="text-sm font-medium text-slate-700 group-hover:text-[#dc2626] max-w-[120px] truncate hidden lg:block transition-colors">
                    {{ authStore.user?.fullName }}
                  </span>
                  <!-- Dropdown Menu -->
                  <div class="absolute right-0 top-full pt-2 hidden group-hover:block z-50">
                    <div class="w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 text-slate-700 text-sm">
                      <router-link v-if="authStore.isStaff" to="/admin/dashboard" class="block px-4 py-2 hover:bg-slate-100">
                        Quản trị Admin
                      </router-link>
                      <button @click="authStore.logout" class="w-full text-left block px-4 py-2 hover:bg-red-50 text-red-600">
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <router-link to="/login" class="flex items-center gap-1.5 text-slate-700 hover:text-[#dc2626] font-medium text-sm transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  <span>Đăng nhập</span>
                </router-link>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Combos Navigation -->
      <nav class="bg-white border-t border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none h-14">
          <router-link
            to="/"
            :class="[
              'text-sm font-semibold px-3.5 py-1.5 rounded-full transition-colors',
              isRouteActive('/') ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            ]"
          >
            Tất cả sản phẩm
          </router-link>
          <template v-for="cat in parentCategories" :key="cat._id">
            <router-link
              :to="`/products?category=${cat._id}`"
              :class="[
                'text-sm font-semibold px-3.5 py-1.5 rounded-full transition-colors',
                isCategoryActive(cat._id) ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              ]"
            >
              {{ cat.name }}
            </router-link>
          </template>
        </div>
      </nav>
    </header>

    <!-- Main Content Area -->
    <main class="flex-grow">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 class="text-white text-lg font-bold mb-4">VĂN PHÒNG PHẨM TRƯỜNG THÀNH</h3>
          <p class="text-sm text-slate-400 leading-relaxed">
            Hệ thống cung cấp thiết bị học tập và văn phòng phẩm chất lượng cao tại Việt Nam. Cam kết hàng chính hãng, giá tốt mỗi ngày.
          </p>
        </div>
        <div>
          <h3 class="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Hỗ trợ khách hàng</h3>
          <ul class="space-y-2 text-sm text-slate-400">
            <li><a href="#" class="hover:text-white transition-colors">Chính sách bảo mật</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Chính sách giao hàng</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Điều khoản dịch vụ</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Liên hệ - Góp ý</a></li>
          </ul>
        </div>
        <div>
          <h3 class="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Combo phổ biến</h3>
          <ul class="space-y-2 text-sm text-slate-400">
            <li><router-link to="/products" class="hover:text-white transition-colors">Combo Bút - Viết</router-link></li>
            <li><router-link to="/products" class="hover:text-white transition-colors">Combo Học Sinh</router-link></li>
            <li><router-link to="/products" class="hover:text-white transition-colors">Combo Văn Phòng</router-link></li>
            <li><router-link to="/products" class="hover:text-white transition-colors">Combo Sổ - Tập - Giấy</router-link></li>
          </ul>
        </div>
        <div>
          <h3 class="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Liên hệ</h3>
          <ul class="space-y-2 text-sm text-slate-400">
            <li>Email: hotro@truongthanh.vn</li>
            <li>Hotline: 1900 8888</li>
            <li>Địa chỉ: 123 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh</li>
          </ul>
        </div>
      </div>
      <div class="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        © {{ new Date().getFullYear() }} Truong Thanh Stationery. All rights reserved. Designed for excellence.
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { categoryService } from '@/services/category.service'
import { formatCurrency } from '@/utils/helpers'
import type { Category } from '@/types'

const authStore = useAuthStore()
const cartStore = useCartStore()
const router = useRouter()
const route = useRoute()

const searchQuery = ref('')
const allCategories = ref<Category[]>([])
const showMenu = ref(false)
const activeParent = ref<Category | null>(null)

const parentCategories = computed(() => {
  return allCategories.value.filter(c => !c.parentId)
})

const getSubcategoriesForActiveParent = computed(() => {
  if (!activeParent.value) return []
  return allCategories.value.filter(c => {
    if (!c.parentId) return false
    const pId = typeof c.parentId === 'object' ? c.parentId._id : c.parentId
    return pId === activeParent.value?._id
  })
})

onMounted(async () => {
  try {
    const res = await categoryService.getAll()
    allCategories.value = res.data
    if (parentCategories.value.length > 0) {
      activeParent.value = parentCategories.value[0]
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
})

function navigateToCategory(categoryId: string) {
  showMenu.value = false
  router.push(`/products?category=${categoryId}`)
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push(`/products?q=${encodeURIComponent(searchQuery.value.trim())}`)
  }
}

function isRouteActive(path: string) {
  return route.path === path && !route.query.category
}

function isCategoryActive(categoryId: string) {
  return route.path === '/products' && route.query.category === categoryId
}
</script>

<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
