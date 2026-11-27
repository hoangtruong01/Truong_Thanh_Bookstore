<template>
  <div class="h-screen w-screen overflow-hidden flex bg-slate-50 dark:bg-slate-950 font-sans relative antialiased">
    <!-- Backdrop for mobile drawer -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
      @click="sidebarOpen = false"
    ></div>

    <!-- Sidebar (Modern Minimal ERP: White/Soft Gray background, Blue Brand Accent) -->
    <aside
      class="fixed inset-y-0 left-0 h-full md:h-screen md:max-h-screen bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 flex flex-col shadow-xs flex-shrink-0 z-40 transition-[width,transform] duration-300 ease-in-out md:translate-x-0 md:static select-none"
      :class="[
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        isCollapsed ? 'w-[70px]' : 'w-[268px]'
      ]"
    >
      <!-- 1. Header: Logo, Brand & Collapse Toggle -->
      <div
        class="h-16 flex-shrink-0 flex items-center border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200"
        :class="[isCollapsed ? 'px-3 justify-center' : 'px-4.5 justify-between']"
      >
        <!-- Logo Emblem & Brand Text -->
        <router-link
          to="/admin/dashboard"
          class="flex items-center gap-3 min-w-0 group"
          :title="isCollapsed ? 'Trường Thành ERP - Bookstore & Office Supplies' : undefined"
        >
          <div class="relative flex-shrink-0">
            <img
              src="@/assets/logo.jpg"
              class="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs group-hover:scale-105 transition-transform"
              alt="Trường Thành Logo"
            />
            <span
              class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"
              title="Online"
            ></span>
          </div>

          <!-- Text branding (hidden when collapsed) -->
          <div v-if="!isCollapsed" class="flex flex-col min-w-0 transition-opacity duration-200">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-black text-slate-900 dark:text-white tracking-tight uppercase truncate">TRƯỜNG THÀNH</span>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200/70 dark:border-red-900/50">ERP</span>
            </div>
            <span class="text-[10.5px] font-medium text-slate-400 dark:text-slate-500 truncate">Bookstore & Office Supplies</span>
          </div>
        </router-link>

        <!-- Toggle Collapse Button (Desktop) -->
        <button
          v-if="!isCollapsed"
          type="button"
          class="hidden md:flex w-7 h-7 rounded-lg items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          :title="isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'"
          @click="toggleCollapse"
        >
          <div class="w-4 h-4">
            <AdminNavIcon name="panel-left-close" />
          </div>
        </button>
      </div>

      <!-- 2. Expand Toggle button when Collapsed -->
      <div v-if="isCollapsed" class="hidden md:flex justify-center py-2 border-b border-slate-150 dark:border-slate-800/80">
        <button
          type="button"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
          title="Mở rộng menu (Ctrl+K)"
          @click="toggleCollapse"
        >
          <div class="w-4 h-4">
            <AdminNavIcon name="panel-left-open" />
          </div>
        </button>
      </div>

      <!-- 3. Quick Search Box (Shown when expanded) -->
      <div v-if="!isCollapsed" class="px-3.5 pt-3 pb-1">
        <div class="relative">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Tìm chức năng... (Ctrl+K)"
            class="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
          />
          <div class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none">
            <AdminNavIcon name="search" />
          </div>
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-0.5 cursor-pointer"
            @click="searchQuery = ''"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- 4. Navigation Menu (Collapsible Accordion Style with Independent Scroll) -->
      <nav class="flex-1 min-h-0 px-2.5 py-2 space-y-2 overflow-y-auto overscroll-contain custom-scrollbar">
        <!-- 4.A: SEARCH RESULTS (Active when user types in search box) -->
        <div v-if="isSearching && !isCollapsed" class="space-y-1">
          <div class="px-2 py-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Kết quả tìm kiếm ({{ filteredItems.length }})</span>
            <button class="text-blue-600 hover:underline cursor-pointer lowercase font-medium" @click="searchQuery = ''">Xóa</button>
          </div>

          <div v-if="filteredItems.length === 0" class="py-6 px-3 text-center text-xs text-slate-400 font-medium">
            Không tìm thấy chức năng phù hợp.
          </div>

          <router-link
            v-for="item in filteredItems"
            :key="item.name"
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all duration-150 group relative"
            :class="[
              isItemActive(item)
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-medium'
            ]"
            @click="sidebarOpen = false"
          >
            <div
              class="w-4.5 h-4.5 flex-shrink-0 transition-colors"
              :class="isItemActive(item) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'"
            >
              <AdminNavIcon :name="item.icon" />
            </div>
            <span class="truncate leading-normal">{{ item.label }}</span>
          </router-link>
        </div>

        <!-- 4.B: STANDARD MENU (When NOT searching) -->
        <template v-else>
          <!-- Top Standalone Quick Links (Trang chủ & Báo cáo) -->
          <div class="space-y-1">
            <div
              v-for="item in topNavItems"
              :key="item.name"
              class="relative group/tip"
            >
              <router-link
                :to="item.to"
                class="flex items-center rounded-xl text-xs transition-all duration-150 relative group"
                :class="[
                  isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.2',
                  isItemActive(item)
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-medium'
                ]"
                :title="!isCollapsed ? item.label : undefined"
                @click="sidebarOpen = false"
              >
                <!-- Active Indicator Bar -->
                <span
                  v-if="isItemActive(item) && !isCollapsed"
                  class="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 dark:bg-blue-500 rounded-r-full"
                ></span>

                <!-- Clean Unified Monochromatic Icon -->
                <div
                  class="w-4.5 h-4.5 flex-shrink-0 transition-colors"
                  :class="isItemActive(item) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'"
                >
                  <AdminNavIcon :name="item.icon" />
                </div>

                <span v-if="!isCollapsed" class="truncate leading-normal">{{ item.label }}</span>
              </router-link>

              <!-- Collapsed Tooltip -->
              <div
                v-if="isCollapsed"
                class="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold whitespace-nowrap shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 flex items-center"
              >
                <span>{{ item.label }}</span>
                <span class="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-100"></span>
              </div>
            </div>
          </div>

          <!-- Section Divider -->
          <div class="border-t border-slate-200/70 dark:border-slate-800/80 my-2"></div>

          <!-- Collapsible Groups -->
          <div
            v-for="group in navGroups"
            :key="group.key"
            class="space-y-1"
          >
            <!-- Group Header (Expanded mode) -->
            <button
              v-if="!isCollapsed"
              type="button"
              class="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 rounded-lg transition-colors cursor-pointer select-none group/hdr"
              @click="toggleGroup(group.key)"
            >
              <span class="truncate">{{ group.label }}</span>

              <!-- Rotating Chevron -->
              <div class="w-3.5 h-3.5 text-slate-400 group-hover/hdr:text-slate-600 dark:text-slate-500 transition-transform duration-200" :class="[isGroupOpen(group.key) ? 'rotate-0' : '-rotate-90']">
                <AdminNavIcon name="chevron-down" />
              </div>
            </button>

            <!-- Collapsed Group Divider with label indicator -->
            <div v-else class="py-1">
              <div class="h-px bg-slate-200/80 dark:bg-slate-800 mx-2" :title="group.label"></div>
            </div>

            <!-- Group Submenu Items -->
            <transition
              enter-active-class="transition-all duration-200 ease-out overflow-hidden"
              leave-active-class="transition-all duration-150 ease-in overflow-hidden"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-96 opacity-100"
              leave-from-class="max-h-96 opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <div
                v-show="isCollapsed || isGroupOpen(group.key)"
                class="space-y-0.5"
                :class="[isCollapsed ? '' : 'pl-1']"
              >
                <div
                  v-for="item in group.items"
                  :key="item.name"
                  class="relative group/tip"
                >
                  <router-link
                    :to="item.to"
                    class="flex items-center rounded-xl text-xs transition-all duration-150 relative group"
                    :class="[
                      isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                      isItemActive(item)
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-medium'
                    ]"
                    :title="!isCollapsed ? item.label : undefined"
                    @click="sidebarOpen = false"
                  >
                    <!-- Left Accent Bar when active -->
                    <span
                      v-if="isItemActive(item) && !isCollapsed"
                      class="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 dark:bg-blue-500 rounded-r-full"
                    ></span>

                    <!-- Unified Icon -->
                    <div
                      class="w-4.5 h-4.5 flex-shrink-0 transition-colors"
                      :class="isItemActive(item) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'"
                    >
                      <AdminNavIcon :name="item.icon" />
                    </div>

                    <span v-if="!isCollapsed" class="truncate leading-normal">{{ item.label }}</span>
                  </router-link>

                  <!-- Collapsed Tooltip -->
                  <div
                    v-if="isCollapsed"
                    class="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold whitespace-nowrap shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 flex items-center"
                  >
                    <span>{{ item.label }}</span>
                    <span class="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-100"></span>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </template>
      </nav>

      <!-- 5. Fixed Footer (Help, Storefront, Logout) -->
      <div
        class="flex-shrink-0 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-1.5 transition-all"
        :class="[isCollapsed ? 'p-2 items-center' : 'p-3']"
      >
        <!-- Hỗ trợ & Hướng dẫn -->
        <div class="w-full relative group/tip">
          <button
            type="button"
            class="flex items-center rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs group"
            :class="[isCollapsed ? 'justify-center w-full p-2.5' : 'gap-2.5 w-full py-2 px-3']"
            @click="showHelp = true"
          >
            <div class="w-4.5 h-4.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0">
              <AdminNavIcon name="help" />
            </div>
            <span v-if="!isCollapsed" class="truncate">Hỗ trợ & Hướng dẫn</span>
          </button>

          <!-- Collapsed Tooltip -->
          <div
            v-if="isCollapsed"
            class="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold whitespace-nowrap shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 flex items-center"
          >
            <span>Hỗ trợ & Hướng dẫn</span>
            <span class="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-100"></span>
          </div>
        </div>

        <!-- Về trang bán hàng -->
        <div class="w-full relative group/tip">
          <router-link
            to="/"
            class="flex items-center rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200/80 dark:border-slate-700/80 transition-all shadow-2xs group"
            :class="[isCollapsed ? 'justify-center w-full p-2.5' : 'gap-2.5 w-full py-2 px-3']"
          >
            <div class="w-4.5 h-4.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex-shrink-0">
              <AdminNavIcon name="store" />
            </div>
            <span v-if="!isCollapsed" class="truncate">Về trang bán hàng</span>
          </router-link>

          <!-- Collapsed Tooltip -->
          <div
            v-if="isCollapsed"
            class="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold whitespace-nowrap shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 flex items-center"
          >
            <span>Về trang bán hàng</span>
            <span class="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-100"></span>
          </div>
        </div>

        <!-- Đăng xuất -->
        <div class="w-full relative group/tip">
          <button
            type="button"
            class="flex items-center rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/25 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-100 dark:border-rose-900/40 transition-all cursor-pointer group"
            :class="[isCollapsed ? 'justify-center w-full p-2.5' : 'gap-2.5 w-full py-2 px-3']"
            @click="handleLogout"
          >
            <div class="w-4.5 h-4.5 text-rose-500 flex-shrink-0">
              <AdminNavIcon name="logout" />
            </div>
            <span v-if="!isCollapsed" class="truncate">Đăng xuất</span>
          </button>

          <!-- Collapsed Tooltip -->
          <div
            v-if="isCollapsed"
            class="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold whitespace-nowrap shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 flex items-center"
          >
            <span>Đăng xuất</span>
            <span class="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-100"></span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Workspace (Smoothly expands and auto-adjusts width) -->
    <div class="flex-1 h-screen max-h-screen flex flex-col overflow-hidden min-w-0 transition-all duration-300">
      <!-- Top Header Bar -->
      <header class="h-16 flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between px-6 lg:px-8 shadow-2xs">
        <!-- Left: Mobile menu toggle + Page Context -->
        <div class="flex items-center gap-3">
          <!-- Mobile hamburger menu button -->
          <button
            class="md:hidden text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Menu"
            @click="sidebarOpen = !sidebarOpen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <!-- Desktop toggle button in top bar -->
          <button
            type="button"
            class="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            :title="isCollapsed ? 'Mở rộng sidebar (Ctrl+K)' : 'Thu gọn sidebar'"
            @click="toggleCollapse"
          >
            <div class="w-4 h-4">
              <AdminNavIcon :name="isCollapsed ? 'panel-left-open' : 'panel-left-close'" />
            </div>
            <span class="text-[11px] text-slate-400">{{ isCollapsed ? 'Mở rộng' : 'Thu gọn' }}</span>
          </button>
        </div>

        <!-- Right User details & actions -->
        <div class="flex items-center gap-4 sm:gap-5">
          <!-- Dark Mode Toggle -->
          <button
            class="text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            :title="isDarkMode ? 'Bật chế độ sáng' : 'Bật chế độ tối'"
            @click="toggleDarkMode"
          >
            <span v-if="isDarkMode">☀️</span>
            <span v-else>🌙</span>
          </button>

          <!-- Language Switcher -->
          <div class="relative group/lang flex items-center">
            <button class="text-xs font-black text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer">
              <span>🌐</span>
              <span class="uppercase font-bold">{{ currentLocale.toUpperCase() }}</span>
            </button>
            <div class="absolute right-0 top-full pt-2 hidden group-hover/lang:block z-50">
              <div class="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 text-slate-700 dark:text-slate-350 text-xs font-bold">
                <button class="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between" @click="changeLocale('vi')">
                  <span>Tiếng Việt</span>
                  <span v-if="currentLocale === 'vi'">✓</span>
                </button>
                <button class="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between" @click="changeLocale('en')">
                  <span>English</span>
                  <span v-if="currentLocale === 'en'">✓</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Notification bell -->
          <div id="notification-dropdown-container" class="relative">
            <button
              class="relative text-slate-500 hover:text-slate-800 transition-colors cursor-pointer p-1.5 rounded-full hover:bg-slate-100"
              title="Thông báo hệ thống"
              @click="toggleNotifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              <!-- Unread badge -->
              <span
                v-if="unreadCount > 0"
                class="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-[9px] font-black text-white rounded-full flex items-center justify-center border border-white"
              >
                {{ unreadCount }}
              </span>
            </button>

            <!-- Notification Dropdown menu -->
            <div
              v-if="showNotifications"
              class="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <!-- Header -->
              <div class="px-4 py-3 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <span class="text-xs font-black text-slate-800 uppercase tracking-wider">Thông báo hệ thống</span>
                <button
                  v-if="unreadCount > 0"
                  class="text-[10px] font-extrabold text-[#dc2626] hover:underline cursor-pointer"
                  @click="markAllAsRead"
                >
                  Đọc tất cả
                </button>
              </div>

              <!-- List -->
              <div class="max-h-80 overflow-y-auto divide-y divide-slate-100">
                <div v-if="notifications.length === 0" class="p-6 text-center text-xs text-slate-400 font-medium">
                  Không có thông báo nào.
                </div>
                <div
                  v-for="item in notifications"
                  :key="item.id"
                  class="p-3.5 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  :class="{'bg-red-50/5 font-semibold': !readIds.includes(item.id)}"
                  @click="handleNotificationClick(item)"
                >
                  <!-- Icon indicator -->
                  <div
                    class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-xs"
                    :class="{
                      'bg-red-100 text-red-600 border border-red-200': item.type === 'out_of_stock',
                      'bg-amber-50 text-amber-600 border border-amber-100': item.type === 'stock',
                      'bg-rose-100 text-rose-600 border border-rose-200': item.type === 'high_value_order',
                      'bg-orange-50 text-orange-600 border border-orange-100': item.type === 'pending_delay',
                      'bg-emerald-50 text-emerald-600 border border-emerald-100': item.type === 'order',
                      'bg-blue-50 text-blue-600 border border-blue-100': item.type === 'customer'
                    }"
                  >
                    <span v-if="item.type === 'out_of_stock'">🔴</span>
                    <span v-else-if="item.type === 'stock'">⚠️</span>
                    <span v-else-if="item.type === 'high_value_order'">🚨</span>
                    <span v-else-if="item.type === 'pending_delay'">⏰</span>
                    <span v-else-if="item.type === 'order'">📦</span>
                    <span v-else-if="item.type === 'customer'">👤</span>
                    <span v-else>🔔</span>
                  </div>

                  <!-- Text -->
                  <div class="flex-grow min-w-0 text-left">
                    <div class="flex justify-between items-baseline gap-1">
                      <span class="text-xs font-bold text-slate-800 truncate">{{ item.title }}</span>
                      <span class="text-[9px] text-slate-400 font-medium whitespace-nowrap">{{ formatTimeAgo(item.createdAt) }}</span>
                    </div>
                    <p class="text-[11px] text-slate-600 leading-relaxed mt-0.5 line-clamp-2 font-medium">
                      {{ item.message }}
                    </p>
                  </div>

                  <!-- Read indicator dot -->
                  <div v-if="!readIds.includes(item.id)" class="flex-shrink-0 self-center">
                    <div class="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Profile -->
          <div
            class="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-all select-none"
            title="Thông tin tài khoản"
            @click="showProfile = true"
          >
            <div class="w-8.5 h-8.5 rounded-full overflow-hidden flex items-center justify-center text-white font-extrabold text-xs shadow-xs border border-slate-200 bg-[#f97316]">
              <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" class="w-full h-full object-cover" />
              <span v-else>{{ adminInitials }}</span>
            </div>
            <div class="text-left leading-tight hidden sm:block">
              <p class="text-xs font-extrabold text-slate-800 dark:text-slate-100">{{ adminName }}</p>
              <p class="text-[9px] text-slate-400 font-semibold uppercase">{{ adminRole }}</p>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content Container (Scrolls Independently from Left Sidebar) -->
      <main class="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 lg:p-8 custom-scrollbar">
        <router-view />
      </main>
    </div>

    <!-- Profile Modal -->
    <ProfileModal :is-open="showProfile" @close="showProfile = false" />

    <!-- Help & Guide Modal -->
    <AdminHelpModal :is-open="showHelp" @close="showHelp = false" />
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { reportService } from '@/services/report.service'
import ProfileModal from '@/components/ProfileModal.vue'
import AdminHelpModal from '@/components/AdminHelpModal.vue'
import AdminNavIcon from '@/components/AdminNavIcon.vue'
import { useI18n } from 'vue-i18n'
import { useWarehouseMode } from '@/composables/useWarehouseMode'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const { isSingleWarehouse, fetchWarehouseMode } = useWarehouseMode()

const showProfile = ref(false)
const showHelp = ref(false)
const sidebarOpen = ref(false)

// Collapsed state persisted in localStorage
const isCollapsed = ref(localStorage.getItem('admin_sidebar_collapsed') === 'true')

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('admin_sidebar_collapsed', String(isCollapsed.value))
}

// Quick Search State & Logic
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)
const isSearching = computed(() => searchQuery.value.trim().length > 0)

watch(() => route.path, () => {
  sidebarOpen.value = false
})

const adminName = computed(() => authStore.user?.fullName || 'Admin')
const adminInitials = computed(() => {
  const name = authStore.user?.fullName || 'AD'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
})
const adminRole = computed(() => {
  const role = authStore.user?.role
  if (role === 'SUPER_ADMIN') return 'Super Admin'
  if (role === 'ADMIN') return 'Quản trị viên'
  if (role === 'STAFF') return 'Nhân viên'
  return 'Admin'
})

// Language setup
const { locale } = useI18n()
const currentLocale = computed(() => locale.value)

function changeLocale(lang: 'vi' | 'en') {
  locale.value = lang
  localStorage.setItem('lang', lang)
  document.documentElement.setAttribute('lang', lang)
}

// Dark Mode logic
const isDarkMode = ref(localStorage.getItem('theme') === 'dark')
function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

// Cross-tab theme and language synchronization
function handleStorageChange(event: StorageEvent) {
  if (event.key === 'theme') {
    const isDark = event.newValue === 'dark'
    isDarkMode.value = isDark
    document.documentElement.classList.toggle('dark', isDark)
  } else if (event.key === 'lang') {
    const newLang = (event.newValue || 'vi') as 'vi' | 'en'
    locale.value = newLang
    document.documentElement.setAttribute('lang', newLang)
  } else if (event.key === 'admin_sidebar_collapsed') {
    isCollapsed.value = event.newValue === 'true'
  }
}

// Global Keyboard Shortcuts (Ctrl+K for search, Esc to clear/close)
function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault()
    if (isCollapsed.value) {
      isCollapsed.value = false
      localStorage.setItem('admin_sidebar_collapsed', 'false')
    }
    setTimeout(() => {
      searchInputRef.value?.focus()
    }, 60)
  } else if (e.key === 'Escape') {
    if (searchQuery.value) {
      searchQuery.value = ''
    } else if (showHelp.value) {
      showHelp.value = false
    } else if (showProfile.value) {
      showProfile.value = false
    }
  }
}

// Notifications State & Logic
const showNotifications = ref(false)
const notifications = ref<any[]>([])
const readIds = ref<string[]>([])

function loadReadIds() {
  const stored = localStorage.getItem('admin_read_notification_ids')
  if (stored) {
    try {
      readIds.value = JSON.parse(stored)
    } catch {
      readIds.value = []
    }
  }
}

function saveReadIds() {
  localStorage.setItem('admin_read_notification_ids', JSON.stringify(readIds.value))
}

const unreadCount = computed(() => {
  if (!Array.isArray(notifications.value)) return 0
  return notifications.value.filter(n => n && !readIds.value.includes(n.id)).length
})

async function fetchNotifications() {
  try {
    const res: any = await reportService.getNotifications()
    const raw = res.data?.data || res.data
    notifications.value = Array.isArray(raw) ? raw : (Array.isArray(raw?.items) ? raw.items : [])
  } catch (err) {
    notifications.value = []
    console.error('Failed to fetch notifications:', err)
  }
}

function toggleNotifications(event: Event) {
  event.stopPropagation()
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    fetchNotifications()
  }
}

function markAllAsRead() {
  if (!Array.isArray(notifications.value)) return
  notifications.value.forEach(n => {
    if (n && n.id && !readIds.value.includes(n.id)) {
      readIds.value.push(n.id)
    }
  })
  saveReadIds()
}

function handleNotificationClick(item: any) {
  if (!readIds.value.includes(item.id)) {
    readIds.value.push(item.id)
    saveReadIds()
  }
  showNotifications.value = false

  if (item.type === 'order' || item.type === 'high_value_order' || item.type === 'pending_delay') {
    router.push('/admin/orders')
  } else if (item.type === 'stock' || item.type === 'out_of_stock') {
    router.push('/admin/inventory')
  } else if (item.type === 'customer') {
    router.push('/admin/customers')
  }
}

function closeDropdown() {
  showNotifications.value = false
}

function handleClickOutside(event: MouseEvent) {
  const dropdown = document.getElementById('notification-dropdown-container')
  if (dropdown && !dropdown.contains(event.target as Node)) {
    closeDropdown()
  }
}

function formatTimeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Vừa xong'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`

  const days = Math.floor(hours / 24)
  if (days === 1) return 'Hôm qua'
  return `${days} ngày trước`
}

onMounted(() => {
  fetchWarehouseMode()
  isDarkMode.value = localStorage.getItem('theme') === 'dark'
  document.documentElement.classList.toggle('dark', isDarkMode.value)

  locale.value = (localStorage.getItem('lang') || 'vi') as 'vi' | 'en'
  document.documentElement.setAttribute('lang', locale.value)

  loadReadIds()
  fetchNotifications()

  const interval = setInterval(fetchNotifications, 30000)
  window.addEventListener('click', handleClickOutside)
  window.addEventListener('storage', handleStorageChange)
  window.addEventListener('keydown', handleGlobalKeydown)

  onUnmounted(() => {
    clearInterval(interval)
    window.removeEventListener('click', handleClickOutside)
    window.removeEventListener('storage', handleStorageChange)
    window.removeEventListener('keydown', handleGlobalKeydown)
  })
})

interface NavItem {
  name: string
  label: string
  to: string
  icon: string
  permission?: string
}

interface NavGroup {
  key: string
  label: string
  icon: string
  items: NavItem[]
}

function isItemActive(item: NavItem): boolean {
  if (item.name === 'AdminDashboard') {
    return route.name === item.name || route.path === item.to || route.path === '/admin'
  }
  return route.name === item.name || route.path.startsWith(item.to)
}

// 1. Top Standalone Quick Links (Trang chủ & Báo cáo & Thống kê theo mockup)
const topNavItems = computed<NavItem[]>(() => {
  const isEn = locale.value === 'en'
  const rawItems: NavItem[] = [
    { name: 'AdminDashboard', label: isEn ? 'Dashboard' : 'Trang chủ', to: '/admin/dashboard', icon: 'home' },
    { name: 'AdminReports', label: isEn ? 'Reports & Analytics' : 'Báo cáo & Thống kê', to: '/admin/reports', icon: 'reports', permission: 'VIEW_REPORTS' },
  ]
  const user = authStore.user
  if (!user) return []
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return rawItems

  const userPermissions = user.permissions || []
  return rawItems.filter(item => !item.permission || userPermissions.includes(item.permission))
})

// 2. Business Groups (Bán hàng, Kho & Hàng hóa, Tài chính, Marketing, Hệ thống)
const navGroups = computed<NavGroup[]>(() => {
  const isEn = locale.value === 'en'

  const rawGroups: NavGroup[] = [
    {
      key: 'sales',
      label: isEn ? 'Sales' : 'Bán hàng',
      icon: 'sales',
      items: [
        { name: 'AdminOrders', label: isEn ? 'Orders' : 'Đơn hàng', to: '/admin/orders', icon: 'orders', permission: 'MANAGE_ORDERS' },
        { name: 'AdminPOS', label: isEn ? 'POS Counter' : 'Bán hàng tại quầy (POS)', to: '/admin/pos', icon: 'pos', permission: 'POS_ACCESS' },
        { name: 'AdminCustomers', label: isEn ? 'Customers' : 'Khách hàng', to: '/admin/customers', icon: 'customers', permission: 'MANAGE_CUSTOMERS' },
        { name: 'AdminPromotions', label: isEn ? 'Promotions & Discounts' : 'Khuyến mãi & Giảm giá', to: '/admin/promotions', icon: 'promotions', permission: 'MANAGE_PROMOTIONS' },
      ],
    },
    {
      key: 'inventory',
      label: isEn ? 'Inventory & Goods' : 'Kho & Hàng hóa',
      icon: 'inventory',
      items: [
        { name: 'AdminProducts', label: isEn ? 'Products & Categories' : 'Hàng hóa & Danh mục', to: '/admin/products', icon: 'products', permission: 'MANAGE_PRODUCTS' },
        { name: 'AdminCombos', label: isEn ? 'Combo Bundles' : 'Gói quà & Combo', to: '/admin/combos', icon: 'combos', permission: 'MANAGE_PRODUCTS' },
        { name: 'AdminPricing', label: isEn ? 'Pricing Policies' : 'Chính sách giá & Lợi nhuận', to: '/admin/pricing', icon: 'pricing', permission: 'MANAGE_PRICING' },
        { name: 'AdminInventory', label: isEn ? 'Inventory Stock' : 'Quản lý kho', to: '/admin/inventory', icon: 'inventory', permission: 'MANAGE_INVENTORY' },
        ...(isSingleWarehouse.value ? [] : [
          { name: 'AdminWarehouses', label: isEn ? 'Warehouses & Transfer' : 'Kho & Điều chuyển', to: '/admin/warehouses', icon: 'warehouses', permission: 'MANAGE_INVENTORY' },
        ]),
        { name: 'AdminPurchases', label: isEn ? 'Procurement & PO' : 'Mua hàng & Nhập kho', to: '/admin/purchases', icon: 'purchases', permission: 'MANAGE_INVENTORY' },
        { name: 'AdminQuotations', label: isEn ? 'Supplier RFQ' : 'Báo giá NCC & So sánh', to: '/admin/quotations', icon: 'quotations', permission: 'MANAGE_INVENTORY' },
        { name: 'AdminStockAudits', label: isEn ? 'Stock Audits' : 'Kiểm kê kho', to: '/admin/stock-audits', icon: 'stockAudits', permission: 'MANAGE_INVENTORY' },
        { name: 'AdminSuppliers', label: isEn ? 'Suppliers' : 'Nhà cung cấp', to: '/admin/suppliers', icon: 'suppliers', permission: 'MANAGE_INVENTORY' },
      ],
    },
    {
      key: 'finance',
      label: isEn ? 'Finance' : 'Tài chính',
      icon: 'finance',
      items: [
        { name: 'AdminCashbook', label: isEn ? 'Cashbook & Cashflow' : 'Sổ quỹ & Thu chi', to: '/admin/cashbook', icon: 'cashbook', permission: 'MANAGE_FINANCE' },
        { name: 'AdminDocuments', label: isEn ? 'Documents & Invoices' : 'Hóa đơn & Chứng từ ERP', to: '/admin/documents', icon: 'documents', permission: 'MANAGE_FINANCE' },
      ],
    },
    {
      key: 'marketing',
      label: isEn ? 'Marketing & Media' : 'Marketing & Truyền thông',
      icon: 'marketing',
      items: [
        { name: 'AdminCampaigns', label: isEn ? 'Marketing Campaigns' : 'Chiến dịch Marketing', to: '/admin/marketing/campaigns', icon: 'promotions', permission: 'MANAGE_BANNERS' },
        { name: 'AdminSocialPosts', label: isEn ? 'Social & Ads (R2)' : 'Mạng xã hội & Ads', to: '/admin/marketing/social', icon: 'promotions', permission: 'MANAGE_BANNERS' },
        { name: 'AdminSalesChannels', label: isEn ? 'TikTok Shop & Channels (R3)' : 'Kênh bán & TikTok Shop', to: '/admin/sales-channels', icon: 'promotions', permission: 'MANAGE_BANNERS' },
        { name: 'AdminOptimization', label: isEn ? 'Optimization & A/B (R4)' : 'Tối ưu & Tăng trưởng', to: '/admin/marketing/optimization', icon: 'promotions', permission: 'MANAGE_BANNERS' },
        { name: 'AdminBanners', label: isEn ? 'Homepage Banners' : 'Banner trang chủ', to: '/admin/banners', icon: 'banners', permission: 'MANAGE_BANNERS' },
        { name: 'AdminLandingPages', label: isEn ? 'Quick Landing Pages' : 'Trang đích (Landing Page)', to: '/admin/landing-pages', icon: 'landingPages', permission: 'MANAGE_LANDING_PAGES' },
        { name: 'AdminReviews', label: isEn ? 'Customer Reviews' : 'Đánh giá từ khách', to: '/admin/reviews', icon: 'reviews', permission: 'MANAGE_PRODUCTS' },
      ],
    },
    {
      key: 'system',
      label: isEn ? 'System' : 'Hệ thống',
      icon: 'users',
      items: [
        { name: 'AdminUsers', label: isEn ? 'Users & Permissions' : 'Người dùng & Phân quyền', to: '/admin/users', icon: 'users' },
      ],
    },
  ]

  const user = authStore.user
  if (!user) return []
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return rawGroups

  const userPermissions = user.permissions || []
  return rawGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.permission) return true
        return userPermissions.includes(item.permission)
      }),
    }))
    .filter((group) => group.items.length > 0)
})

// Search filter across all available items
const filteredItems = computed<NavItem[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return []

  const allItems: NavItem[] = [
    ...topNavItems.value,
    ...navGroups.value.flatMap(g => g.items),
  ]

  return allItems.filter(item =>
    item.label.toLowerCase().includes(query) ||
    item.name.toLowerCase().includes(query),
  )
})

// Collapsible group state
const openGroups = ref<Record<string, boolean>>({
  sales: true,
  inventory: true,
  finance: true,
  marketing: true,
  system: true,
})

function toggleGroup(key: string) {
  openGroups.value[key] = !openGroups.value[key]
}

function isGroupOpen(key: string): boolean {
  return openGroups.value[key] ?? true
}

function autoExpandActiveGroup() {
  if (!navGroups.value) return
  for (const group of navGroups.value) {
    const hasActiveItem = group.items.some(item => isItemActive(item))
    if (hasActiveItem) {
      openGroups.value[group.key] = true
    }
  }
}

watch(() => route.path, () => {
  autoExpandActiveGroup()
}, { immediate: true })

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 9999px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.6);
}

:global(.dark) .custom-scrollbar {
  scrollbar-color: rgba(100, 116, 139, 0.35) transparent;
}

:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
}

:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.6);
}
</style>
