<template>
  <div class="min-h-screen flex flex-col bg-slate-50">
    <!-- Top Bar -->
    <div
      class="bg-[#dc2626] text-white text-[11px] py-1.5 text-center font-medium tracking-wide flex items-center justify-center gap-1.5"
    >
      <span>🚚</span> Miễn phí giao hàng cho đơn từ 299K
    </div>

    <!-- Main Header -->
    <header
      class="sticky top-0 z-50 transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-slate-200/80"
      :class="
        isSticky
          ? 'shadow-lg shadow-slate-100/50'
          : 'shadow-xs'
      "
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20 gap-4">
          <!-- Mobile Menu Toggle (UX-05) -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden text-slate-700 hover:text-[#dc2626] transition-colors cursor-pointer flex-shrink-0"
            aria-label="Menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                v-if="!mobileMenuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
          <!-- Logo -->
          <router-link to="/" class="flex items-center gap-2.5 flex-shrink-0">
            <!-- Icon TT -->
            <img
              src="@/assets/logo.jpg"
              class="w-10 h-10 rounded-full object-cover border border-slate-200"
              alt="Trường Thành Logo"
            />
            <div class="flex flex-col leading-none">
              <span class="text-lg font-black text-[#dc2626] tracking-tight"
                >TRƯỜNG THÀNH</span
              >
              <span
                class="text-[9px] font-bold text-slate-500 tracking-widest uppercase"
                >Stationery</span
              >
            </div>
          </router-link>

          <!-- Search Bar & Category Menu -->
          <div
            class="flex-1 max-w-xl hidden md:flex items-center gap-3 relative"
          >
            <!-- Category Menu Button -->
            <div
              class="relative"
              @mouseenter="showMenu = true"
              @mouseleave="showMenu = false"
            >
              <button
                type="button"
                class="flex items-center gap-1.5 bg-[#dc2626] hover:bg-[#b91c1c] rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
              >
                <!-- Menu icon -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                  stroke="currentColor"
                  class="w-5 h-5 text-white"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                <span>Danh mục</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2.5"
                  stroke="currentColor"
                  class="w-3.5 h-3.5 text-white/90 transition-transform duration-200"
                  :class="{ 'rotate-180': showMenu }"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>

              <!-- Mega Menu Dropdown -->
              <div
                v-show="showMenu"
                class="absolute left-0 top-full pt-3 z-50 w-[700px] transition-all duration-200"
              >
                <div
                  class="bg-white border border-slate-200 rounded-3xl shadow-xl flex overflow-hidden min-h-[350px] h-[450px]"
                >
                  <!-- Left Sidebar: Parent Categories -->
                  <div
                    class="w-2/5 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto space-y-1"
                  >
                    <div
                      class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2"
                    >
                      Danh mục sản phẩm
                    </div>
                    <button
                      v-for="cat in parentCategories"
                      :key="cat._id"
                      type="button"
                      @mouseenter="activeParent = cat"
                      @click="navigateToCategory(cat._id)"
                      class="w-full text-left px-4 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-between group/item"
                      :class="
                        activeParent?._id === cat._id
                          ? 'bg-[#dc2626] text-white shadow-md'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      "
                    >
                      <span
                        class="truncate text-slate-700"
                        :class="{ 'text-white': activeParent?._id === cat._id }"
                        >{{ cat.name }}</span
                      >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="2.5"
                        stroke="currentColor"
                        class="w-3.5 h-3.5 opacity-60 group-hover/item:translate-x-0.5 transition-transform"
                        :class="
                          activeParent?._id === cat._id
                            ? 'text-white'
                            : 'text-slate-400'
                        "
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="m8.25 4.5 7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </button>
                  </div>

                  <!-- Right Panel: Subcategories or Products -->
                  <div
                    class="w-3/5 p-6 overflow-y-auto bg-white flex flex-col text-slate-800"
                  >
                    <div v-if="activeParent" class="space-y-6 flex-grow">
                      <div
                        class="flex items-center justify-between border-b border-slate-100 pb-3"
                      >
                        <h3
                          class="text-sm font-black text-slate-900 flex items-center gap-1.5"
                        >
                          <span
                            class="w-2.5 h-2.5 rounded-full bg-[#dc2626]"
                          ></span>
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
                      <div
                        v-if="getSubcategoriesForActiveParent.length > 0"
                        class="grid grid-cols-2 gap-6"
                      >
                        <div
                          v-for="sub in getSubcategoriesForActiveParent"
                          :key="sub._id"
                          class="space-y-2"
                        >
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
                      <div
                        v-else-if="
                          activeParent.products &&
                          activeParent.products.length > 0
                        "
                        class="space-y-3"
                      >
                        <div
                          class="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                        >
                          Sản phẩm nổi bật
                        </div>
                        <div class="grid grid-cols-1 gap-2.5">
                          <router-link
                            v-for="prod in activeParent.products.slice(0, 4)"
                            :key="prod._id"
                            :to="`/products?q=${encodeURIComponent(prod.name)}`"
                            @click="showMenu = false"
                            class="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-xs transition-all group/prod cursor-pointer"
                          >
                            <img
                              :src="
                                prod.images && prod.images[0]
                                  ? prod.images[0]
                                  : 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=100'
                              "
                              class="w-10 h-10 object-cover rounded-xl bg-slate-50 flex-shrink-0"
                              alt="Product thumbnail"
                            />
                            <div class="min-w-0 flex-1">
                              <div
                                class="text-xs font-bold text-slate-800 group-hover/prod:text-[#dc2626] truncate leading-snug"
                              >
                                {{ prod.name }}
                              </div>
                              <div
                                class="text-[11px] font-bold text-[#dc2626] mt-0.5"
                              >
                                {{
                                  formatCurrency(
                                    prod.discountPrice || prod.price,
                                  )
                                }}
                              </div>
                            </div>
                          </router-link>
                        </div>
                      </div>

                      <!-- Empty State -->
                      <div
                        v-else
                        class="flex flex-col items-center justify-center h-64 text-center text-slate-400 space-y-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-8 h-8 opacity-60"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z"
                          />
                        </svg>
                        <p class="text-xs font-bold">
                          Chưa có sản phẩm hoặc danh mục con
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Search Bar -->
            <div class="flex-grow relative">
              <form @submit.prevent="handleSearch">
                <div class="relative w-full">
                  <input
                    v-model="searchQuery"
                    type="text"
                    @focus="showDropdown = true"
                    @blur="handleBlur"
                    placeholder="Tìm bút, sổ tay, giấy A4, kẹp giấy..."
                    class="w-full bg-slate-100 border border-slate-200 rounded-full py-2.5 pl-5 pr-20 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-transparent transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    class="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#dc2626] hover:bg-[#b91c1c] text-white p-2.5 px-5 rounded-full transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="2.5"
                      stroke="currentColor"
                      class="w-4 h-4"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z"
                      />
                    </svg>
                  </button>
                </div>
              </form>

              <!-- Autocomplete Dropdown -->
              <div
                v-if="
                  showDropdown &&
                  (suggestions.length > 0 || searchResults.length > 0)
                "
                class="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-3xl shadow-xl z-50 p-6"
                style="contain: layout"
              >
                <!-- Suggestions Section -->
                <div v-if="suggestions.length > 0" class="mb-5">
                  <div
                    class="text-sm font-black text-slate-800 flex items-center gap-2 mb-3"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="2.5"
                      stroke="currentColor"
                      class="w-4 h-4 text-slate-500"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                    Gợi ý
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <div
                      v-for="tag in suggestions"
                      :key="tag"
                      @mousedown="selectSuggestion(tag)"
                      class="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer select-none"
                    >
                      {{ tag }}
                    </div>
                  </div>
                </div>

                <!-- Products Section -->
                <div
                  v-if="searchResults.length > 0"
                  class="border-t border-slate-100 pt-4"
                >
                  <div
                    class="text-sm font-black text-slate-800 flex items-center gap-2 mb-3"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="2.5"
                      stroke="currentColor"
                      class="w-4 h-4 text-slate-500"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
                      />
                    </svg>
                    Sản phẩm
                  </div>
                  <div class="grid grid-cols-3 gap-4">
                    <div
                      v-for="prod in searchResults"
                      :key="prod._id"
                      @mousedown="selectProduct(prod._id)"
                      class="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer group"
                    >
                      <img
                        :src="
                          prod.images && prod.images[0]
                            ? prod.images[0]
                            : 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=100'
                        "
                        class="w-12 h-12 object-cover rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0"
                        alt="Product image"
                      />
                      <div class="min-w-0 flex-1">
                        <div
                          class="text-xs font-semibold text-slate-700 group-hover:text-[#dc2626] line-clamp-2 leading-snug"
                        >
                          {{ prod.name }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Utility Icons -->
          <div class="flex items-center gap-3 sm:gap-6">
            <!-- Notifications - BUG-08: add tooltip -->
            <button
              class="relative text-slate-700 hover:text-[#dc2626] transition-colors cursor-pointer hidden md:block"
              title="Thông báo (Đang phát triển)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
            </button>

            <!-- Cart -->
            <router-link
              to="/cart"
              class="relative text-slate-700 hover:text-[#dc2626] flex items-center gap-1 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                />
              </svg>
              <span
                v-if="cartStore.itemsCount > 0"
                class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
              >
                {{ cartStore.itemsCount }}
              </span>
            </router-link>

            <!-- Account -->
            <div class="relative">
              <template v-if="authStore.isAuthenticated">
                <div class="flex items-center gap-2 cursor-pointer group">
                  <div
                    class="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-red-100 bg-red-50 flex-shrink-0"
                  >
                    <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" class="w-full h-full object-cover" />
                    <span v-else class="text-[#dc2626] font-bold">{{ authStore.user?.fullName.charAt(0).toUpperCase() }}</span>
                  </div>
                  <span
                    class="text-sm font-medium text-slate-700 group-hover:text-[#dc2626] max-w-[160px] truncate hidden lg:block transition-colors"
                  >
                    {{ authStore.user?.fullName }}
                  </span>
                  <!-- Dropdown Menu -->
                  <div
                    class="absolute right-0 top-full pt-2 hidden group-hover:block z-50"
                  >
                    <div
                      class="w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 text-slate-700 text-sm"
                    >
                      <router-link
                        v-if="authStore.isStaff"
                        to="/admin/dashboard"
                        class="block px-4 py-2 hover:bg-slate-100"
                      >
                        Quản trị Admin
                      </router-link>
                      <button
                        @click="showProfile = true"
                        class="w-full text-left block px-4 py-2 hover:bg-slate-100 cursor-pointer"
                      >
                        Thông tin tài khoản
                      </button>
                      <router-link
                        to="/my-orders"
                        class="block px-4 py-2 hover:bg-slate-100"
                      >
                        Đơn hàng của tôi
                      </router-link>
                      <button
                        @click="authStore.logout"
                        class="w-full text-left block px-4 py-2 hover:bg-red-50 text-red-600 cursor-pointer"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <router-link
                  to="/login"
                  class="flex items-center gap-1.5 text-slate-700 hover:text-[#dc2626] font-medium text-sm transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    class="w-5 h-5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                  <span>Đăng nhập</span>
                </router-link>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Search Bar (always visible on mobile/tablet below the logo line) -->
      <div class="block md:hidden px-4 pb-3 border-t border-slate-100/50 pt-2 bg-white relative">
        <form @submit.prevent="handleSearch">
          <div class="relative w-full">
            <input
              v-model="searchQuery"
              type="text"
              @focus="showDropdown = true"
              @blur="handleBlur"
              placeholder="Tìm kiếm sản phẩm..."
              class="w-full bg-slate-100 border border-slate-200 rounded-full py-2 pl-4 pr-12 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-transparent transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              class="absolute right-1 top-1/2 -translate-y-1/2 bg-[#dc2626] hover:bg-[#b91c1c] text-white p-1.5 px-3 rounded-full transition-colors cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2.5"
                stroke="currentColor"
                class="w-3.5 h-3.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z"
                />
              </svg>
            </button>
          </div>
        </form>

        <!-- Autocomplete Dropdown for Mobile Search -->
        <div
          v-if="
            showDropdown &&
            (suggestions.length > 0 || searchResults.length > 0)
          "
          class="absolute left-4 right-4 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4"
          style="contain: layout"
        >
          <!-- Suggestions Section -->
          <div v-if="suggestions.length > 0" class="mb-4">
            <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Gợi ý
            </div>
            <div class="flex flex-wrap gap-1.5">
              <div
                v-for="tag in suggestions"
                :key="tag"
                @mousedown="selectSuggestion(tag)"
                class="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer select-none"
              >
                {{ tag }}
              </div>
            </div>
          </div>

          <!-- Products Section -->
          <div v-if="searchResults.length > 0" class="border-t border-slate-100 pt-3">
            <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Sản phẩm
            </div>
            <div class="grid grid-cols-1 gap-2">
              <div
                v-for="prod in searchResults"
                :key="prod._id"
                @mousedown="selectProduct(prod._id)"
                class="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer group"
              >
                <img
                  :src="prod.images && prod.images[0] ? prod.images[0] : 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=100'"
                  class="w-8 h-8 object-cover rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0"
                  alt="Product image"
                />
                <div class="min-w-0 flex-1">
                  <div class="text-[11px] font-semibold text-slate-700 group-hover:text-[#dc2626] line-clamp-1 leading-snug">
                    {{ prod.name }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Menu Drawer (UX-05) -->
      <div
        v-if="mobileMenuOpen"
        class="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-4 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto"
      >
        <!-- Category List for mobile -->
        <div class="space-y-2">
          <div
            class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1"
          >
            Danh mục sản phẩm
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="cat in parentCategories"
              :key="cat._id"
              type="button"
              @click="navigateToCategory(cat._id)"
              class="text-left px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            >
              {{ cat.name }}
            </button>
          </div>
        </div>

        <!-- Quick user links for mobile -->
        <div class="border-t border-slate-100 pt-3 flex flex-col gap-2.5">
          <router-link
            to="/cart"
            class="flex items-center gap-2 text-xs font-bold text-slate-700 px-1"
          >
            🛒 Giỏ hàng ({{ cartStore.itemsCount }})
          </router-link>
          <template v-if="authStore.isAuthenticated">
            <button
              @click="showProfile = true"
              class="w-full text-left flex items-center gap-2 text-xs font-bold text-slate-700 px-1 cursor-pointer"
            >
              👤 Thông tin tài khoản
            </button>
            <router-link
              to="/my-orders"
              class="flex items-center gap-2 text-xs font-bold text-slate-700 px-1"
            >
              📦 Đơn hàng của tôi
            </router-link>
            <router-link
              v-if="authStore.isStaff"
              to="/admin/dashboard"
              class="flex items-center gap-2 text-xs font-bold text-[#dc2626] px-1"
            >
              ⚙️ Quản trị Admin
            </router-link>
            <button
              @click="authStore.logout"
              class="text-left flex items-center gap-2 text-xs font-bold text-red-600 px-1 cursor-pointer"
            >
              🚪 Đăng xuất
            </button>
          </template>
          <template v-else>
            <router-link
              to="/login"
              class="flex items-center gap-2 text-xs font-bold text-[#dc2626] px-1"
            >
              🔑 Đăng nhập
            </router-link>
          </template>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-grow">
      <router-view />
    </main>

    <!-- Footer -->
    <footer
      class="bg-gradient-to-b from-[#0a0f1d] via-[#070b14] to-[#04070d] text-slate-300 border-t border-slate-800/50 font-sans"
    >
      <!-- Top Section: Testimonial & Google Maps -->
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
      >
        <!-- Testimonial & Newsletter -->
        <div class="space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
          <div class="space-y-4 w-full">
            <h2 class="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent text-center lg:text-left">
              Văn Phòng Phẩm Trường Thành
            </h2>
            <div class="pl-0 lg:pl-4 border-l-0 lg:border-l-2 border-[#dc2626] space-y-1">
              <p class="text-[10px] font-bold text-[#dc2626] tracking-widest uppercase"></p>
              <p class="text-sm sm:text-base text-slate-300 font-medium italic leading-relaxed">
                "Đồng hành cùng tri thức - Kiến tạo tương lai"
              </p>
            </div>
          </div>

          <!-- Newsletter Form -->
          <form @submit.prevent="handleNewsletter" class="space-y-3 pt-2 flex flex-col items-center lg:items-start w-full max-w-md">
            <div class="flex flex-col sm:flex-row gap-2 w-full justify-center lg:justify-start">
              <input
                v-model="newsletterEmail"
                type="email"
                placeholder="Email của bạn..."
                class="flex-1 bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:border-[#dc2626]/80 focus:ring-2 focus:ring-[#dc2626]/10 transition-all placeholder:text-slate-500 shadow-inner w-full"
                required
              />
              <button
                type="submit"
                class="bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:from-[#e11d48] hover:to-[#be123c] text-white font-black px-6 py-3 rounded-xl text-sm transition-all duration-300 cursor-pointer w-full sm:w-auto shadow-lg shadow-red-900/20 active:scale-95 hover:shadow-red-600/30"
              >
                Đăng ký
              </button>
            </div>
            <div
              class="flex items-center justify-center lg:justify-start gap-2 text-[10.5px] text-slate-500 font-medium w-full"
            >
              <!-- Gift Icon -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2.2"
                stroke="currentColor"
                class="w-4 h-4 text-[#dc2626] flex-shrink-0"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h17.25c.621 0 1.125-.504 1.125-1.125V8.25c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v2.25c0 .621.504 1.125 1.125 1.125Z"
                />
              </svg>
              <span class="text-center lg:text-left"
                >Đăng ký nhận tin tức & khuyến mãi từ Trường Thành</span
              >
            </div>
          </form>
        </div>

        <!-- Google Maps Store Address Card -->
        <div
          class="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-2xl backdrop-blur-sm max-w-md mx-auto lg:ml-auto w-full group"
        >
          <!-- Title -->
          <div class="flex items-center justify-center lg:justify-start gap-2 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2.5"
              stroke="currentColor"
              class="w-4.5 h-4.5 text-[#dc2626]"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
              />
            </svg>
            <span class="text-xs font-black uppercase tracking-wider"
              >Liên hệ với chúng tôi</span
            >
          </div>

          <!-- Map Iframe with CSS color inversion filters to match the dark palette -->
          <div
            class="relative w-full h-40 rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950 group-hover:border-[#dc2626]/30 transition-colors duration-300"
          >
            <iframe
              src="https://maps.google.com/maps?q=20.5381011,106.1298122&t=&z=18&ie=UTF8&iwloc=&output=embed"
              class="w-full h-full border-0 filter invert-[90%] hue-rotate-[180deg] brightness-[95%] contrast-[90%]"
              allowfullscreen
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

          <!-- Details & Direct Navigation -->
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-center sm:text-left"
          >
            <div class="space-y-1.5 text-[11px] text-slate-300 flex flex-col items-center sm:items-start w-full sm:w-auto">
              <div class="flex items-center justify-center sm:justify-start gap-2 w-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                  stroke="currentColor"
                  class="w-3.5 h-3.5 text-slate-400 flex-shrink-0"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                  />
                </svg>
                <span class="font-semibold text-left">Chợ chanh - Nhân Hà, Ninh Bình, Vietnam</span>
              </div>
              <div class="flex items-center justify-center sm:justify-start gap-2 w-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                  stroke="currentColor"
                  class="w-3.5 h-3.5 text-slate-400 flex-shrink-0"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <span class="font-semibold text-slate-400">Giờ mở cửa: 08:00 - 21:00 (T2 - CN)</span>
              </div>
            </div>

            <a
              href="https://maps.app.goo.gl/WimhqeY99KTQwWD2A"
              target="_blank"
              class="bg-[#dc2626]/10 border border-[#dc2626]/30 text-red-500 hover:bg-[#dc2626] hover:text-white font-extrabold text-[11px] px-4 py-2 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0 w-full sm:w-auto hover:shadow-lg hover:shadow-red-600/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Chỉ đường</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2.5"
                stroke="currentColor"
                class="w-3 h-3"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <!-- Divider line -->
      <div class="h-px bg-gradient-to-r from-transparent via-slate-800/80 to-transparent"></div>

      <!-- Bottom Columns Grid -->
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"
      >
        <!-- Col 1: Store Intro -->
        <div class="space-y-5 flex flex-col items-center md:items-start text-center md:text-left">
          <div class="flex items-center justify-center md:justify-start gap-3 text-white">
            <div
              class="w-8 h-8 rounded-lg bg-[#dc2626]/10 text-[#dc2626] flex items-center justify-center flex-shrink-0 shadow-sm border border-[#dc2626]/20"
            >
              <!-- Book Icon -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2.5"
                stroke="currentColor"
                class="w-4.5 h-4.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
            <h3
              class="text-xs font-black uppercase tracking-wider leading-snug"
            >
              Văn Phòng Phẩm<br />Trường Thành
            </h3>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed max-w-xs font-medium mx-auto md:mx-0">
            Hệ thống cung cấp thiết bị học tập và văn phòng phẩm chất lượng cao
            tại Việt Nam. Cam kết hàng chính hãng, giá tốt mỗi ngày.
          </p>
          <div class="flex items-center justify-center md:justify-start gap-3 pt-2">
            <!-- Facebook -->
            <a
              href="https://www.facebook.com/profile.php?id=61589787305540&locale=vi_VN"
              target="_blank"
              class="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-[#3b5998] hover:text-white hover:border-[#3b5998] hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-md hover:shadow-[#3b5998]/20"
              aria-label="Facebook"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                class="w-4 h-4"
              >
                <path
                  d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"
                />
              </svg>
            </a>
            <!-- Instagram -->
            <a
              href="https://instagram.com"
              target="_blank"
              class="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:text-white hover:border-transparent hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-md hover:shadow-purple-600/20"
              aria-label="Instagram"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2.5"
                stroke="currentColor"
                class="w-4 h-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316A2.192 2.192 0 0 0 14.515 4H9.485c-.62 0-1.196.34-1.503.88l-.822 1.316Z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            </a>
            <!-- Zalo -->
            <a
              href="https://zalo.me/0982938316"
              target="_blank"
              class="px-4 h-9 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-[#0068ff] hover:text-white hover:border-[#0068ff] hover:-translate-y-1 transition-all duration-300 cursor-pointer text-xs font-black shadow-md hover:shadow-[#0068ff]/20"
              aria-label="Zalo"
            >
              Zalo
            </a>
          </div>
        </div>

        <!-- Col 2: Customer Support -->
        <div class="space-y-5">
          <div class="flex items-center justify-center md:justify-start gap-3 text-white">
            <div
              class="w-8 h-8 rounded-lg bg-[#dc2626]/10 text-[#dc2626] flex items-center justify-center flex-shrink-0 shadow-sm border border-[#dc2626]/20"
            >
              <!-- Headset Icon -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2.5"
                stroke="currentColor"
                class="w-4.5 h-4.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25"
                />
              </svg>
            </div>
            <h3 class="text-xs font-black uppercase tracking-wider">
              Hỗ Trợ Khách Hàng
            </h3>
          </div>
          <ul class="space-y-3.5 text-xs flex flex-col items-center md:items-start">
            <li>
              <router-link
                to="/products"
                class="group flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 font-bold"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-[#dc2626] scale-0 group-hover:scale-100 transition-all duration-300 flex-shrink-0"></span>
                <span class="group-hover:translate-x-1.5 transition-transform duration-300">Chính sách bảo mật</span>
              </router-link>
            </li>
            <li>
              <router-link
                to="/products"
                class="group flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 font-bold"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-[#dc2626] scale-0 group-hover:scale-100 transition-all duration-300 flex-shrink-0"></span>
                <span class="group-hover:translate-x-1.5 transition-transform duration-300">Chính sách giao hàng</span>
              </router-link>
            </li>
            <li>
              <router-link
                to="/products"
                class="group flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 font-bold"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-[#dc2626] scale-0 group-hover:scale-100 transition-all duration-300 flex-shrink-0"></span>
                <span class="group-hover:translate-x-1.5 transition-transform duration-300">Điều khoản dịch vụ</span>
              </router-link>
            </li>
            <li>
              <router-link
                to="/products"
                class="group flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 font-bold"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-[#dc2626] scale-0 group-hover:scale-100 transition-all duration-300 flex-shrink-0"></span>
                <span class="group-hover:translate-x-1.5 transition-transform duration-300">Liên hệ - Góp ý</span>
              </router-link>
            </li>
            <li>
              <router-link
                to="/products"
                class="group flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 font-bold"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-[#dc2626] scale-0 group-hover:scale-100 transition-all duration-300 flex-shrink-0"></span>
                <span class="group-hover:translate-x-1.5 transition-transform duration-300">Hướng dẫn đặt hàng</span>
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Col 3: Popular Combos -->
        <div class="space-y-5">
          <div class="flex items-center justify-center md:justify-start gap-3 text-white">
            <div
              class="w-8 h-8 rounded-lg bg-[#dc2626]/10 text-[#dc2626] flex items-center justify-center flex-shrink-0 shadow-sm border border-[#dc2626]/20"
            >
              <!-- Tag Icon -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2.5"
                stroke="currentColor"
                class="w-4.5 h-4.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.753 2.481.162l5.586-5.586a1.725 1.725 0 0 0 .162-2.481l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 6h.008v.008H6V6Z"
                />
              </svg>
            </div>
            <h3 class="text-xs font-black uppercase tracking-wider">
              Combo Phổ Biến
            </h3>
          </div>
          <ul class="space-y-3.5 text-xs flex flex-col items-center md:items-start">
            <li>
              <router-link
                to="/products?q=combo+bút"
                class="group flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 font-bold"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-[#dc2626] scale-0 group-hover:scale-100 transition-all duration-300 flex-shrink-0"></span>
                <span class="group-hover:translate-x-1.5 transition-transform duration-300">Combo Bút - Viết</span>
              </router-link>
            </li>
            <li>
              <router-link
                to="/products?q=combo+học+sinh"
                class="group flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 font-bold"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-[#dc2626] scale-0 group-hover:scale-100 transition-all duration-300 flex-shrink-0"></span>
                <span class="group-hover:translate-x-1.5 transition-transform duration-300">Combo Học Sinh</span>
              </router-link>
            </li>
            <li>
              <router-link
                to="/products?q=combo+văn+phòng"
                class="group flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 font-bold"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-[#dc2626] scale-0 group-hover:scale-100 transition-all duration-300 flex-shrink-0"></span>
                <span class="group-hover:translate-x-1.5 transition-transform duration-300">Combo Văn Phòng</span>
              </router-link>
            </li>
            <li>
              <router-link
                to="/products?q=combo+sổ"
                class="group flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 font-bold"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-[#dc2626] scale-0 group-hover:scale-100 transition-all duration-300 flex-shrink-0"></span>
                <span class="group-hover:translate-x-1.5 transition-transform duration-300">Combo Sổ - Tập - Giấy</span>
              </router-link>
            </li>
            <li>
              <router-link
                to="/products?q=combo+quà+tặng"
                class="group flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 font-bold"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-[#dc2626] scale-0 group-hover:scale-100 transition-all duration-300 flex-shrink-0"></span>
                <span class="group-hover:translate-x-1.5 transition-transform duration-300">Combo Quà Tặng</span>
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Col 4: Contact -->
        <div class="space-y-5">
          <div class="flex items-center justify-center md:justify-start gap-3 text-white">
            <div
              class="w-8 h-8 rounded-lg bg-[#dc2626]/10 text-[#dc2626] flex items-center justify-center flex-shrink-0 shadow-sm border border-[#dc2626]/20"
            >
              <!-- Phone Icon -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2.5"
                stroke="currentColor"
                class="w-4.5 h-4.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.806-5.122-4.104-6.928-6.928l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                />
              </svg>
            </div>
            <h3 class="text-xs font-black uppercase tracking-wider">Liên Hệ</h3>
          </div>
          <ul class="space-y-3.5 text-xs text-slate-400 font-medium flex flex-col items-center md:items-start text-center md:text-left">
            <li class="flex flex-col items-center md:items-start gap-1">
              <span class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Email</span>
              <a
                href="mailto:giaoductruongthanh@gmail.com"
                class="text-slate-300 hover:text-white transition-colors font-bold text-xs"
              >
                giaoductruongthanh@gmail.com
              </a>
            </li>
            <li class="flex flex-col items-center md:items-start gap-1">
              <span class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Hotline</span>
              <a
                href="tel:0982938316"
                class="text-white hover:text-[#dc2626] transition-colors font-black text-sm tracking-wide"
              >
                0982938316
              </a>
            </li>
            <li class="flex flex-col items-center md:items-start gap-1">
              <span class="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Địa chỉ</span>
              <span class="text-slate-300 leading-relaxed font-bold text-xs">
                Chợ chanh - Nhân Hà, Ninh Bình, Vietnam
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Copyright Bottom Line -->
      <div
        class="border-t border-slate-900/90 py-6 text-xs text-slate-500 bg-[#050810]"
      >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="font-medium">© 2026 Trường Thành Stationery. All rights reserved.</p>
          <div class="flex items-center gap-6 text-slate-600 text-[11px] font-semibold">
            <router-link to="/products" class="hover:text-slate-400 transition-colors">Chính sách bảo mật</router-link>
            <span>•</span>
            <router-link to="/products" class="hover:text-slate-400 transition-colors">Điều khoản dịch vụ</router-link>
          </div>
        </div>
      </div>
    </footer>

    <!-- Profile Modal -->
    <ProfileModal :isOpen="showProfile" @close="showProfile = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import { formatCurrency } from "@/utils/helpers";
import type { Category } from "@/types";
import { useToast } from "vue-toastification";
import ProfileModal from "@/components/ProfileModal.vue";

const authStore = useAuthStore();
const cartStore = useCartStore();
const router = useRouter();
const route = useRoute();
const toast = useToast();

const showProfile = ref(false);

const newsletterEmail = ref("");
function handleNewsletter() {
  if (newsletterEmail.value.trim()) {
    toast.success("Đăng ký nhận tin tức thành công!");
    newsletterEmail.value = "";
  } else {
    toast.warning("Vui lòng nhập địa chỉ email hợp lệ.");
  }
}

const mobileMenuOpen = ref(false);

// Close mobile menu on route changes
watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false;
  },
);

const searchQuery = ref("");
const allCategories = ref<Category[]>([]);
const showMenu = ref(false);
const activeParent = ref<Category | null>(null);

// Sticky Scroll Toggle state
const isSticky = ref(false);

function handleScroll() {
  isSticky.value = window.scrollY > 40;
}

// Autocomplete State
const showDropdown = ref(false);
const searchResults = ref<any[]>([]);
const loadingSearch = ref(false);

const commonKeywords = [
  "bút bi",
  "bút gel",
  "bút ký",
  "bút chì",
  "bút dạ quang",
  "bút lông",
  "bút sáp màu",
  "bút máy",
  "sổ tay",
  "sổ lò xo",
  "sổ da",
  "giấy A4",
  "giấy note",
  "giấy vẽ",
  "kẹp bướm",
  "bìa hồ sơ",
  "thước kẻ",
  "gôm tẩy",
  "hộp bút",
  "keo dán",
  "kéo cắt giấy",
  "máy tính casio",
];

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

const suggestions = computed(() => {
  const q = normalizeString(searchQuery.value.trim());
  if (!q) {
    return ["bút", "sổ tay", "giấy A4", "kẹp giấy", "bút bi", "thước kẻ"];
  }
  const filtered = commonKeywords.filter((k) => normalizeString(k).includes(q));
  if (filtered.length === 0) {
    return [
      searchQuery.value.trim(),
      `bút ${searchQuery.value.trim()}`,
      `sổ ${searchQuery.value.trim()}`,
      `giấy ${searchQuery.value.trim()}`,
    ].slice(0, 8);
  }
  return filtered.slice(0, 8);
});

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeout: any = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

const performAutocomplete = debounce(async (query: string) => {
  const trimmed = query.trim();
  if (!trimmed) {
    searchResults.value = [];
    return;
  }
  loadingSearch.value = true;
  try {
    const res = await productService.search(trimmed);
    searchResults.value = res.data.slice(0, 6);
  } catch (err) {
    console.error("Autocomplete search failed:", err);
  } finally {
    loadingSearch.value = false;
  }
}, 250);

watch(searchQuery, (newVal) => {
  if (!newVal.trim()) {
    searchResults.value = [];
    return;
  }
  performAutocomplete(newVal);
});

function handleBlur() {
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
}

function selectSuggestion(tag: string) {
  searchQuery.value = tag;
  showDropdown.value = false;
  handleSearch();
}

function selectProduct(productId: string) {
  showDropdown.value = false;
  router.push(`/products/${productId}`);
}

const parentCategories = computed(() => {
  return allCategories.value.filter((c) => !c.parentId);
});

const getSubcategoriesForActiveParent = computed(() => {
  if (!activeParent.value) return [];
  return allCategories.value.filter((c) => {
    if (!c.parentId) return false;
    const pId = typeof c.parentId === "object" ? c.parentId._id : c.parentId;
    return pId === activeParent.value?._id;
  });
});

onMounted(async () => {
  window.addEventListener("scroll", handleScroll);
  try {
    const res = await categoryService.getAll();
    allCategories.value = res.data;
    if (parentCategories.value.length > 0) {
      activeParent.value = parentCategories.value[0];
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
  }
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});

function navigateToCategory(categoryId: string) {
  showMenu.value = false;
  router.push(`/products?category=${categoryId}`);
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push(`/products?q=${encodeURIComponent(searchQuery.value.trim())}`);
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
