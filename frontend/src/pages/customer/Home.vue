<template>
  <div class="space-y-12 pb-24 bg-[#fcfcfc] overflow-hidden">
    <!-- Hero Banner Redesign (Matches Screenshot) -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div class="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#e11d48] via-[#f97316] to-[#f59e0b] text-white px-8 py-14 md:py-18 flex flex-col justify-center shadow-lg">
        <!-- Floating shapes/glows -->
        <div class="absolute -right-10 -bottom-10 w-80 h-80 bg-white/10 rounded-full blur-2xl"></div>
        <div class="absolute -left-10 -top-10 w-60 h-60 bg-white/10 rounded-full blur-2xl"></div>
        
        <div class="relative max-w-2xl space-y-6 z-10">
          <div class="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 text-white text-[11px] font-bold px-4 py-1.5 rounded-full backdrop-blur-md w-fit">
            <span>Khuyến mãi tuần này</span>
          </div>
          
          <h1 class="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none uppercase">
            SIÊU ƯU ĐÃI<br/>
            <span class="text-white">VĂN PHÒNG PHẨM</span>
          </h1>
          
          <p class="text-white/95 text-xs sm:text-base font-medium leading-relaxed max-w-lg">
            Mua sắm dụng cụ học tập & văn phòng giá tốt mỗi ngày
          </p>
          
          <div class="pt-2 flex flex-wrap gap-4">
            <router-link to="/products" class="bg-white hover:bg-slate-50 text-[#dc2626] font-extrabold py-3 px-6 rounded-full shadow-lg shadow-black/10 transition-all text-xs flex items-center gap-2 group cursor-pointer">
              <span>Mua ngay</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 group-hover:translate-x-1 transition-transform"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
            </router-link>
            <router-link to="/products?discounted=true" class="bg-transparent hover:bg-white/10 border border-white/35 text-white font-extrabold py-3 px-6 rounded-full transition-all text-xs flex items-center gap-2 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.753 2.481.162l5.586-5.586a1.725 1.725 0 0 0 .162-2.481l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>
              <span>Xem khuyến mãi</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Container -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
      <!-- Featured Categories (Matches Screenshot) -->
      <section class="space-y-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">Danh mục nổi bật</h2>
          <p class="text-xs text-slate-500">Khám phá thế giới văn phòng phẩm</p>
        </div>
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-4">
          <router-link
            v-for="(cat, idx) in parentCategories"
            :key="cat._id"
            :to="`/products?category=${cat._id}`"
            class="bg-white border border-slate-100 rounded-2xl p-4 text-center hover:shadow-md hover:border-slate-200 transition-all flex flex-col items-center group cursor-pointer"
          >
            <!-- Colored Circle Card -->
            <div :class="`w-14 h-14 rounded-2xl ${getCategoryStyle(idx).bg} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs`">
              <!-- Render category image or fallback icon -->
              <img v-if="cat.image" :src="cat.image" class="w-8 h-8 object-contain" />
              <span v-else class="text-2xl">{{ getCategoryStyle(idx).icon }}</span>
            </div>
            <span class="text-xs font-bold text-slate-800 group-hover:text-[#dc2626] transition-colors leading-tight">{{ cat.name }}</span>
          </router-link>
        </div>
      </section>

      <!-- Best Selling Products (Matches Screenshot) -->
      <section class="space-y-4">
        <div class="flex items-end justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900 tracking-tight">🔥 Sản phẩm bán chạy</h2>
            <p class="text-xs text-slate-500">Khách hàng yêu thích nhất</p>
          </div>
          <router-link to="/products" class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1">
            <span>Xem tất cả</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          </router-link>
        </div>

        <div v-if="loadingBest" class="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div v-for="n in 4" :key="n" class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse">
            <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
            <div class="h-4 bg-slate-200 rounded w-2/3"></div>
            <div class="h-6 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div
            v-for="prod in bestSelling"
            :key="prod._id"
            class="bg-white border border-slate-200/80 rounded-2xl p-4 hover:shadow-md hover:border-slate-300 transition-all flex flex-col group relative"
          >
            <!-- Discount Badge -->
            <span v-if="getDiscountPercent(prod.price, prod.discountPrice) > 0" class="absolute top-6 left-6 bg-[#dc2626] text-white text-[10px] font-black px-2 py-0.5 rounded-md z-10 shadow-xs">
              -{{ getDiscountPercent(prod.price, prod.discountPrice) }}%
            </span>

            <!-- Image/Placeholder Container (Matches Screenshot) -->
            <div class="aspect-square bg-slate-50/70 rounded-xl overflow-hidden mb-4 relative flex items-center justify-center">
              <img v-if="prod.images && prod.images.length > 0" :src="prod.images[0]" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div v-else :class="`w-full h-full ${getProductPlaceholder(prod.name).gradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-500`">
                <!-- SVG Icon fallback matching screenshot -->
                <svg v-if="getProductPlaceholder(prod.name).icon === 'pencil'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>
                <svg v-else-if="getProductPlaceholder(prod.name).icon === 'document'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <svg v-else-if="getProductPlaceholder(prod.name).icon === 'calculator'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008ZM2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.379-3.379a.75.75 0 0 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06-1.06l-1.25-1.25Z" />
                </svg>
                <svg v-else-if="getProductPlaceholder(prod.name).icon === 'folder'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-19.5 0A2.25 2.25 0 0 0 4.5 15h15a2.25 2.25 0 0 0 2.25-2.25m-19.5 0v.225C2.25 14.28 3.52 15 5.04 15h13.92c1.52 0 2.79-.72 2.79-2.025v-.225M3 9V6a3 3 0 0 1 3-3h3.75a3 3 0 0 1 2.25 1.025L13.5 6h6.75A3 3 0 0 1 23 9v2.25m-20.25 0h17.5" />
                </svg>
                <svg v-else-if="getProductPlaceholder(prod.name).icon === 'briefcase'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 .994-.806 1.8-1.8 1.8H5.55c-.994 0-1.8-.806-1.8-1.8v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.45.258-.717.258H5.184c-.267 0-.523-.093-.717-.258m16.5 0V8.706c0-1.08-.768-2.014-1.837-2.174a47.79 47.79 0 0 0-3.413-.387m-7.5 0V5.25A2.25 2.25 0 0 1 10.5 3h3a2.25 2.25 0 0 1 2.25 2.25v.819M6.75 7.5v.75m0-1.5h10.5M6.75 7.5H4.25m13 0h2.5M6.75 7.5v8.25M17.25 7.5v8.25M3 16.5h18" />
                </svg>
                <svg v-else-if="getProductPlaceholder(prod.name).icon === 'academic'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M12 21v-4.5" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.753 2.481.162l5.586-5.586a1.725 1.725 0 0 0 .162-2.481l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
              </div>
            </div>

            <!-- Title -->
            <h3 class="text-xs font-bold text-slate-800 line-clamp-2 min-h-[36px] group-hover:text-[#dc2626] transition-colors leading-tight">
              <router-link :to="`/products/${prod._id}`">{{ prod.name }}</router-link>
            </h3>

            <!-- Price & Info (Matches Screenshot) -->
            <div class="mt-2 flex flex-col gap-1">
              <div class="flex items-baseline gap-2">
                <template v-if="prod.discountPrice > 0">
                  <span class="text-sm font-bold text-red-600">{{ formatCurrency(prod.discountPrice) }}</span>
                  <span class="text-[10px] text-slate-400 line-through">{{ formatCurrency(prod.price) }}</span>
                </template>
                <template v-else>
                  <span class="text-sm font-bold text-red-600">{{ formatCurrency(prod.price) }}</span>
                </template>
              </div>
              
              <div class="flex items-center justify-between text-[10px] text-slate-400">
                <div class="flex items-center gap-0.5 text-yellow-600 font-bold">
                  ★ {{ prod.rating || '4.8' }}
                </div>
                <div>
                  Đã bán {{ formatNumber(prod.sold || Math.floor(Math.random() * 500) + 900) }}
                </div>
              </div>
            </div>

            <!-- Add to Cart (Matches Screenshot) -->
            <button @click="addToCart(prod)" class="mt-3 w-full bg-[#ffebd5] hover:bg-[#dc2626] text-[#c2410c] hover:text-white font-extrabold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1 border border-[#fed7aa] cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
              <span>Thêm vào giỏ</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Discounted Products (Matches Screenshot) -->
      <section class="space-y-4">
        <div class="flex items-end justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900 tracking-tight">🏷️ Đang giảm giá</h2>
            <p class="text-xs text-slate-500">Săn deal sốc mỗi ngày</p>
          </div>
          <router-link to="/products?discounted=true" class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1">
            <span>Xem tất cả</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          </router-link>
        </div>

        <div v-if="loadingDiscount" class="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div v-for="n in 4" :key="n" class="bg-white rounded-3xl border border-slate-200 p-4 animate-pulse space-y-4">
            <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
            <div class="h-4 bg-slate-200 rounded w-2/3"></div>
            <div class="h-6 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div
            v-for="prod in discounted"
            :key="prod._id"
            class="bg-white border border-slate-200/80 rounded-2xl p-4 hover:shadow-md hover:border-slate-300 transition-all flex flex-col group relative"
          >
            <!-- Discount Badge -->
            <span class="absolute top-6 left-6 bg-[#dc2626] text-white text-[10px] font-black px-2 py-0.5 rounded-md z-10 shadow-xs">
              -{{ getDiscountPercent(prod.price, prod.discountPrice) }}%
            </span>

            <!-- Image/Placeholder Container -->
            <div class="aspect-square bg-slate-50/70 rounded-xl overflow-hidden mb-4 relative flex items-center justify-center">
              <img v-if="prod.images && prod.images.length > 0" :src="prod.images[0]" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div v-else :class="`w-full h-full ${getProductPlaceholder(prod.name).gradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-500`">
                <!-- SVG Icon fallback matching screenshot -->
                <svg v-if="getProductPlaceholder(prod.name).icon === 'pencil'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>
                <svg v-else-if="getProductPlaceholder(prod.name).icon === 'document'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <svg v-else-if="getProductPlaceholder(prod.name).icon === 'calculator'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008ZM2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.379-3.379a.75.75 0 0 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06-1.06l-1.25-1.25Z" />
                </svg>
                <svg v-else-if="getProductPlaceholder(prod.name).icon === 'folder'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-19.5 0A2.25 2.25 0 0 0 4.5 15h15a2.25 2.25 0 0 0 2.25-2.25m-19.5 0v.225C2.25 14.28 3.52 15 5.04 15h13.92c1.52 0 2.79-.72 2.79-2.025v-.225M3 9V6a3 3 0 0 1 3-3h3.75a3 3 0 0 1 2.25 1.025L13.5 6h6.75A3 3 0 0 1 23 9v2.25m-20.25 0h17.5" />
                </svg>
                <svg v-else-if="getProductPlaceholder(prod.name).icon === 'briefcase'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 .994-.806 1.8-1.8 1.8H5.55c-.994 0-1.8-.806-1.8-1.8v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.45.258-.717.258H5.184c-.267 0-.523-.093-.717-.258m16.5 0V8.706c0-1.08-.768-2.014-1.837-2.174a47.79 47.79 0 0 0-3.413-.387m-7.5 0V5.25A2.25 2.25 0 0 1 10.5 3h3a2.25 2.25 0 0 1 2.25 2.25v.819M6.75 7.5v.75m0-1.5h10.5M6.75 7.5H4.25m13 0h2.5M6.75 7.5v8.25M17.25 7.5v8.25M3 16.5h18" />
                </svg>
                <svg v-else-if="getProductPlaceholder(prod.name).icon === 'academic'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M12 21v-4.5" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.753 2.481.162l5.586-5.586a1.725 1.725 0 0 0 .162-2.481l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
              </div>
            </div>

            <!-- Title -->
            <h3 class="text-xs font-bold text-slate-800 line-clamp-2 min-h-[36px] group-hover:text-[#dc2626] transition-colors leading-tight">
              <router-link :to="`/products/${prod._id}`">{{ prod.name }}</router-link>
            </h3>

            <!-- Price & Info -->
            <div class="mt-2 flex flex-col gap-1">
              <div class="flex items-baseline gap-2">
                <span class="text-sm font-bold text-red-600">{{ formatCurrency(prod.discountPrice) }}</span>
                <span class="text-[10px] text-slate-400 line-through">{{ formatCurrency(prod.price) }}</span>
              </div>
              
              <div class="flex items-center justify-between text-[10px] text-slate-400">
                <div class="flex items-center gap-0.5 text-yellow-600 font-bold">
                  ★ {{ prod.rating || '4.8' }}
                </div>
                <div>
                  Đã bán {{ formatNumber(prod.sold || Math.floor(Math.random() * 400) + 100) }}
                </div>
              </div>
            </div>

            <!-- Add to Cart Button -->
            <button @click="addToCart(prod)" class="mt-3 w-full bg-[#ffebd5] hover:bg-[#dc2626] text-[#c2410c] hover:text-white font-extrabold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1 border border-[#fed7aa] cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
              <span>Thêm vào giỏ</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Combo văn phòng (Matches Screenshot) -->
      <section class="space-y-4">
        <div class="flex items-end justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900 tracking-tight">📦 Combo văn phòng</h2>
            <p class="text-xs text-slate-500">Tiết kiệm hơn khi mua combo</p>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div
            v-for="prod in combos"
            :key="prod._id"
            class="bg-white border border-slate-200/80 rounded-2xl p-4 hover:shadow-md hover:border-slate-300 transition-all flex flex-col group relative"
          >
            <!-- Discount Badge -->
            <span v-if="getDiscountPercent(prod.price, prod.discountPrice) > 0" class="absolute top-6 left-6 bg-[#dc2626] text-white text-[10px] font-black px-2 py-0.5 rounded-md z-10 shadow-xs">
              -{{ getDiscountPercent(prod.price, prod.discountPrice) }}%
            </span>

            <!-- Image/Placeholder Container -->
            <div class="aspect-square bg-slate-50/70 rounded-xl overflow-hidden mb-4 relative flex items-center justify-center">
              <img v-if="prod.images && prod.images.length > 0" :src="prod.images[0]" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div v-else :class="`w-full h-full ${getProductPlaceholder(prod.name).gradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-500`">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 .994-.806 1.8-1.8 1.8H5.55c-.994 0-1.8-.806-1.8-1.8v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.45.258-.717.258H5.184c-.267 0-.523-.093-.717-.258m16.5 0V8.706c0-1.08-.768-2.014-1.837-2.174a47.79 47.79 0 0 0-3.413-.387m-7.5 0V5.25A2.25 2.25 0 0 1 10.5 3h3a2.25 2.25 0 0 1 2.25 2.25v.819M6.75 7.5v.75m0-1.5h10.5M6.75 7.5H4.25m13 0h2.5M6.75 7.5v8.25M17.25 7.5v8.25M3 16.5h18" />
                </svg>
              </div>
            </div>

            <!-- Title -->
            <h3 class="text-xs font-bold text-slate-800 line-clamp-2 min-h-[36px] group-hover:text-[#dc2626] transition-colors leading-tight">
              <router-link :to="`/products/${prod._id}`">{{ prod.name }}</router-link>
            </h3>

            <!-- Price & Info -->
            <div class="mt-2 flex flex-col gap-1">
              <div class="flex items-baseline gap-2">
                <template v-if="prod.discountPrice > 0">
                  <span class="text-sm font-bold text-red-600">{{ formatCurrency(prod.discountPrice) }}</span>
                  <span class="text-[10px] text-slate-400 line-through">{{ formatCurrency(prod.price) }}</span>
                </template>
                <template v-else>
                  <span class="text-sm font-bold text-red-600">{{ formatCurrency(prod.price) }}</span>
                </template>
              </div>
              
              <div class="flex items-center justify-between text-[10px] text-slate-400">
                <div class="flex items-center gap-0.5 text-yellow-600 font-bold">
                  ★ {{ prod.rating || '4.8' }}
                </div>
                <div>
                  Đã bán {{ formatNumber(prod.sold || Math.floor(Math.random() * 300) + 150) }}
                </div>
              </div>
            </div>

            <!-- Add to Cart Button -->
            <button @click="addToCart(prod)" class="mt-3 w-full bg-[#ffebd5] hover:bg-[#dc2626] text-[#c2410c] hover:text-white font-extrabold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1 border border-[#fed7aa] cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
              <span>Thêm vào giỏ</span>
            </button>
          </div>
        </div>
      </section>

      <!-- New Arrivals (Matches Screenshot) -->
      <section class="space-y-4">
        <div class="flex items-end justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900 tracking-tight">✨ Hàng mới về</h2>
            <p class="text-xs text-slate-500">Vừa cập bến</p>
          </div>
          <router-link to="/products?sort=newest" class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1">
            <span>Xem tất cả</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          </router-link>
        </div>

        <div v-if="loadingNew" class="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div v-for="n in 4" :key="n" class="bg-white rounded-3xl border border-slate-200 p-4 animate-pulse space-y-4">
            <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
            <div class="h-4 bg-slate-200 rounded w-2/3"></div>
            <div class="h-6 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div
            v-for="prod in newProducts"
            :key="prod._id"
            class="bg-white border border-slate-200/80 rounded-2xl p-4 hover:shadow-md hover:border-slate-300 transition-all flex flex-col group relative"
          >
            <!-- Discount Badge -->
            <span v-if="getDiscountPercent(prod.price, prod.discountPrice) > 0" class="absolute top-6 left-6 bg-[#dc2626] text-white text-[10px] font-black px-2 py-0.5 rounded-md z-10 shadow-xs">
              -{{ getDiscountPercent(prod.price, prod.discountPrice) }}%
            </span>

            <!-- Image/Placeholder Container -->
            <div class="aspect-square bg-slate-50/70 rounded-xl overflow-hidden mb-4 relative flex items-center justify-center">
              <img v-if="prod.images && prod.images.length > 0" :src="prod.images[0]" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div v-else :class="`w-full h-full ${getProductPlaceholder(prod.name).gradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-500`">
                <!-- SVG Icon fallback matching screenshot -->
                <svg v-if="getProductPlaceholder(prod.name).icon === 'pencil'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>
                <svg v-else-if="getProductPlaceholder(prod.name).icon === 'document'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <svg v-else-if="getProductPlaceholder(prod.name).icon === 'calculator'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008ZM2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.379-3.379a.75.75 0 0 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06-1.06l-1.25-1.25Z" />
                </svg>
                <svg v-else-if="getProductPlaceholder(prod.name).icon === 'folder'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-19.5 0A2.25 2.25 0 0 0 4.5 15h15a2.25 2.25 0 0 0 2.25-2.25m-19.5 0v.225C2.25 14.28 3.52 15 5.04 15h13.92c1.52 0 2.79-.72 2.79-2.025v-.225M3 9V6a3 3 0 0 1 3-3h3.75a3 3 0 0 1 2.25 1.025L13.5 6h6.75A3 3 0 0 1 23 9v2.25m-20.25 0h17.5" />
                </svg>
                <svg v-else-if="getProductPlaceholder(prod.name).icon === 'briefcase'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 .994-.806 1.8-1.8 1.8H5.55c-.994 0-1.8-.806-1.8-1.8v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.45.258-.717.258H5.184c-.267 0-.523-.093-.717-.258m16.5 0V8.706c0-1.08-.768-2.014-1.837-2.174a47.79 47.79 0 0 0-3.413-.387m-7.5 0V5.25A2.25 2.25 0 0 1 10.5 3h3a2.25 2.25 0 0 1 2.25 2.25v.819M6.75 7.5v.75m0-1.5h10.5M6.75 7.5H4.25m13 0h2.5M6.75 7.5v8.25M17.25 7.5v8.25M3 16.5h18" />
                </svg>
                <svg v-else-if="getProductPlaceholder(prod.name).icon === 'academic'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M12 21v-4.5" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-white/90">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.753 2.481.162l5.586-5.586a1.725 1.725 0 0 0 .162-2.481l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
              </div>
            </div>

            <!-- Title -->
            <h3 class="text-xs font-bold text-slate-800 line-clamp-2 min-h-[36px] group-hover:text-[#dc2626] transition-colors leading-tight">
              <router-link :to="`/products/${prod._id}`">{{ prod.name }}</router-link>
            </h3>

            <!-- Price & Info -->
            <div class="mt-2 flex flex-col gap-1">
              <div class="flex items-baseline gap-2">
                <template v-if="prod.discountPrice > 0">
                  <span class="text-sm font-bold text-red-600">{{ formatCurrency(prod.discountPrice) }}</span>
                  <span class="text-[10px] text-slate-400 line-through">{{ formatCurrency(prod.price) }}</span>
                </template>
                <template v-else>
                  <span class="text-sm font-bold text-red-600">{{ formatCurrency(prod.price) }}</span>
                </template>
              </div>
              
              <div class="flex items-center justify-between text-[10px] text-slate-400">
                <div class="flex items-center gap-0.5 text-yellow-600 font-bold">
                  ★ {{ prod.rating || '4.8' }}
                </div>
                <div>
                  Đã bán {{ formatNumber(prod.sold || Math.floor(Math.random() * 300) + 120) }}
                </div>
              </div>
            </div>

            <!-- Add to Cart Button -->
            <button @click="addToCart(prod)" class="mt-3 w-full bg-[#ffebd5] hover:bg-[#dc2626] text-[#c2410c] hover:text-white font-extrabold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1 border border-[#fed7aa] cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
              <span>Thêm vào giỏ</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { useCartStore } from '@/stores/cart'
import { productService } from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import { formatCurrency, getDiscountPercent } from '@/utils/helpers'
import type { Product, Category } from '@/types'

const cartStore = useCartStore()
const toast = useToast()

const parentCategories = ref<Category[]>([])
const bestSelling = ref<Product[]>([])
const discounted = ref<Product[]>([])
const newProducts = ref<Product[]>([])

const loadingBest = ref(true)
const loadingDiscount = ref(true)
const loadingNew = ref(true)

// Mapped styling system for highlighting categories in home layout
const categoryStyles = [
  { bg: 'bg-red-50 hover:bg-red-100 border-red-100', text: 'text-red-600', icon: '✏️' },
  { bg: 'bg-orange-50 hover:bg-orange-100 border-orange-100', text: 'text-orange-600', icon: '🎒' },
  { bg: 'bg-blue-50 hover:bg-blue-100 border-blue-100', text: 'text-blue-600', icon: '💼' },
  { bg: 'bg-green-50 hover:bg-green-100 border-green-100', text: 'text-green-600', icon: '📄' },
  { bg: 'bg-pink-50 hover:bg-pink-100 border-pink-100', text: 'text-pink-600', icon: '🎨' },
  { bg: 'bg-purple-50 hover:bg-purple-100 border-purple-100', text: 'text-purple-600', icon: '📟' }
]

function getCategoryStyle(index: number) {
  return categoryStyles[index % categoryStyles.length]
}

// Combos section computed logic
const combos = computed(() => {
  const all = [...bestSelling.value, ...discounted.value, ...newProducts.value]
  const matched = all.filter(
    p =>
      p.name.toLowerCase().includes('combo') ||
      p.name.toLowerCase().includes('bộ dụng cụ') ||
      p.name.toLowerCase().includes('hộp')
  )
  return matched.length > 0 ? matched.slice(0, 2) : bestSelling.value.slice(0, 2)
})

onMounted(async () => {
  try {
    const catRes = await categoryService.getParents()
    parentCategories.value = catRes.data
  } catch (err) {
    console.error('Error loading parent categories', err)
  }

  try {
    const bestRes = await productService.getBestSelling(4)
    bestSelling.value = bestRes.data
  } finally {
    loadingBest.value = false
  }

  try {
    const discRes = await productService.getDiscounted(4)
    discounted.value = discRes.data
  } finally {
    loadingDiscount.value = false
  }

  try {
    const newRes = await productService.getNew(4)
    newProducts.value = newRes.data
  } finally {
    loadingNew.value = false
  }
})

function addToCart(product: Product) {
  cartStore.addToCart(product, 1)
  toast.success(`Đã thêm "${product.name}" vào giỏ hàng`)
}

function formatNumber(num: number) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function getProductPlaceholder(prodName: string) {
  const name = prodName.toLowerCase()
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
  if (name.includes('combo') || name.includes('văn phòng')) {
    return {
      gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      icon: 'briefcase'
    }
  }
  if (name.includes('học sinh') || name.includes('tiểu học') || name.includes('bộ dụng cụ')) {
    return {
      gradient: 'bg-gradient-to-br from-amber-400 to-orange-500',
      icon: 'academic'
    }
  }
  return {
    gradient: 'bg-gradient-to-br from-pink-400 to-rose-500',
    icon: 'tag'
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
