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

          <!-- Search Bar -->
          <div class="flex-1 max-w-xl hidden md:block">
            <form @submit.prevent="handleSearch" class="relative">
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

      <!-- Categories Navigation -->
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
          <h3 class="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Danh mục phổ biến</h3>
          <ul class="space-y-2 text-sm text-slate-400">
            <li><router-link to="/products" class="hover:text-white transition-colors">Bút - Viết</router-link></li>
            <li><router-link to="/products" class="hover:text-white transition-colors">Dụng Cụ Học Sinh</router-link></li>
            <li><router-link to="/products" class="hover:text-white transition-colors">Dụng Cụ Văn Phòng</router-link></li>
            <li><router-link to="/products" class="hover:text-white transition-colors">Sản Phẩm Về Giấy</router-link></li>
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { categoryService } from '@/services/category.service'
import type { Category } from '@/types'

const authStore = useAuthStore()
const cartStore = useCartStore()
const router = useRouter()
const route = useRoute()

const searchQuery = ref('')
const parentCategories = ref<Category[]>([])

onMounted(async () => {
  try {
    const res = await categoryService.getParents()
    parentCategories.value = res.data
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
})

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
