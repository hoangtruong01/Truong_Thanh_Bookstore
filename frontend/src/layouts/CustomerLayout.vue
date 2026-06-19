<template>
  <div class="min-h-screen flex flex-col bg-slate-50">
    <!-- Top Bar -->
    <div class="bg-blue-800 text-white text-xs py-2 text-center font-medium uppercase tracking-wider">
      ⚡ Miễn phí giao hàng cho đơn từ 299K • Đổi trả dễ dàng ⚡
    </div>

    <!-- Main Header -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20 gap-4">
          <!-- Logo -->
          <router-link to="/" class="flex items-center gap-2 flex-shrink-0">
            <span class="text-2xl font-black bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent tracking-tight">
              TRƯỜNG THÀNH
            </span>
            <span class="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
              Stationery
            </span>
          </router-link>

          <!-- Search Bar -->
          <div class="flex-1 max-w-xl hidden md:block">
            <form @submit.prevent="handleSearch" class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Tìm kiếm dụng cụ học tập, văn phòng phẩm..."
                class="w-full bg-slate-100 border-none rounded-full py-2.5 pl-5 pr-12 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-slate-400"
              />
              <button type="submit" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m21-21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
                </svg>
              </button>
            </form>
          </div>

          <!-- Utility Icons -->
          <div class="flex items-center gap-6">
            <!-- Account -->
            <div class="relative">
              <template v-if="authStore.isAuthenticated">
                <div class="flex items-center gap-2 cursor-pointer group">
                  <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                    {{ authStore.user?.fullName.charAt(0).toUpperCase() }}
                  </div>
                  <span class="text-sm font-medium text-slate-700 group-hover:text-blue-700 max-w-[120px] truncate hidden lg:block">
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
                <router-link to="/login" class="flex items-center gap-1.5 text-slate-700 hover:text-blue-700 font-medium text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  <span>Đăng nhập</span>
                </router-link>
              </template>
            </div>

            <!-- Cart -->
            <router-link to="/cart" class="relative text-slate-700 hover:text-blue-700 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              <span v-if="cartStore.itemsCount > 0" class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {{ cartStore.itemsCount }}
              </span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Categories Navigation -->
      <nav class="bg-slate-50 border-t border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 overflow-x-auto whitespace-nowrap scrollbar-none h-12">
          <router-link to="/" class="text-sm font-semibold text-slate-700 hover:text-blue-700 py-3.5 border-b-2 border-transparent hover:border-blue-700">
            Trang Chủ
          </router-link>
          <router-link to="/products" class="text-sm font-semibold text-slate-700 hover:text-blue-700 py-3.5 border-b-2 border-transparent hover:border-blue-700">
            Tất Cả Sản Phẩm
          </router-link>
          <template v-for="cat in parentCategories" :key="cat._id">
            <router-link :to="`/products?category=${cat._id}`" class="text-sm font-semibold text-slate-700 hover:text-blue-700 py-3.5 border-b-2 border-transparent hover:border-blue-700">
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { categoryService } from '@/services/category.service'
import type { Category } from '@/types'

const authStore = useAuthStore()
const cartStore = useCartStore()
const router = useRouter()

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
