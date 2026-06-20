<template>
  <div class="space-y-0 pb-0 bg-[#fcfcfc] overflow-hidden">
    <!-- Chapter 1: Immersive Hero Section (Matches visual excellence request) -->
    <div class="relative min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] via-[#311042] to-[#450a0a] text-white overflow-hidden py-20 px-4">
      <!-- Floating decorative shapes -->
      <div class="absolute -right-20 -bottom-20 w-120 h-120 bg-rose-600/20 rounded-full blur-3xl animate-pulse-soft"></div>
      <div class="absolute -left-20 -top-20 w-100 h-100 bg-orange-600/20 rounded-full blur-3xl animate-pulse-soft delay-1000"></div>
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_80%)]"></div>

      <div class="relative max-w-4xl mx-auto text-center space-y-8 z-10">
        <div class="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white text-[11px] font-bold px-4 py-1.5 rounded-full backdrop-blur-md w-fit mx-auto animate-float">
          <span>✨ Siêu Ưu Đãi Mùa Tựu Trường</span>
        </div>

        <h1 class="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none uppercase hero-text">
          Khởi nguồn<br/>
          <span class="bg-gradient-to-r from-orange-400 via-rose-500 to-amber-500 bg-clip-text text-transparent">Sự Sáng Tạo</span>
        </h1>

        <p class="text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed reveal">
          Khám phá bộ sưu tập dụng cụ học tập & văn phòng phẩm Trường Thành chất lượng vượt trội, đồng hành trên con đường chinh phục đỉnh cao tri thức.
        </p>

        <div class="pt-4 flex flex-wrap justify-center gap-4 reveal delay-100">
          <router-link to="/products" class="bg-gradient-to-r from-[#e11d48] to-[#f97316] hover:from-[#f43f5e] hover:to-[#fb923c] text-white font-extrabold py-4.5 px-8 rounded-full shadow-lg shadow-rose-600/30 transition-all text-sm flex items-center gap-2 group cursor-pointer">
            <span>Mua sắm ngay</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 group-hover:translate-x-1 transition-transform"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
          </router-link>
          <router-link to="/products?discounted=true" class="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold py-4.5 px-8 rounded-full transition-all text-sm flex items-center gap-2 cursor-pointer backdrop-blur-md">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.753 2.481.162l5.586-5.586a1.725 1.725 0 0 0 .162-2.481l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>
            <span>Bộ Sưu Tập Giảm Giá</span>
          </router-link>
        </div>
      </div>

      <!-- Scroll hint -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-60">
        <span class="text-[10px] tracking-[0.2em] uppercase font-bold text-slate-400">Cuộn xuống</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 animate-bounce text-slate-400"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
      </div>
    </div>

    <!-- Chapter 3: Horizontal Carousel Categories -->
    <section class="bg-slate-100 py-24 overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div class="reveal flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span class="text-xs font-bold text-[#dc2626] tracking-[0.2em] uppercase">Khám phá các Combo</span>
            <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">Sáng tạo không giới hạn</h2>
          </div>
          
        </div>

        <!-- Infinite Marquee categories container -->
        <div class="relative w-full overflow-hidden py-4 reveal delay-100">
          <!-- Glassmorphism side overlays for smooth fading -->
          <div class="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-100 via-slate-100/60 to-transparent z-10 pointer-events-none"></div>
          <div class="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-100 via-slate-100/60 to-transparent z-10 pointer-events-none"></div>

          <div class="flex gap-6 w-max animate-marquee hover:[animation-play-state:paused] py-2">
            <!-- First Set -->
            <router-link
              v-for="(cat, idx) in parentCategories"
              :key="cat._id"
              :to="`/products?category=${cat._id}`"
              class="w-[220px] shrink-0 bg-white border border-slate-200/60 rounded-3xl p-6 text-center hover:shadow-xl hover:border-slate-300 transition-all flex flex-col items-center justify-between group cursor-pointer h-72 shadow-xs"
            >
              <div class="flex flex-col items-center space-y-4">
                <!-- Animated Circle Card -->
                <div :class="['w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md', getCategoryStyle(idx).gradient]">
                  <svg v-if="getCategoryStyle(idx).icon === 'pencil'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7 text-white">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
                  <svg v-else-if="getCategoryStyle(idx).icon === 'academic'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7 text-white">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M12 21v-4.5" />
                  </svg>
                  <svg v-else-if="getCategoryStyle(idx).icon === 'briefcase'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7 text-white">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 .994-.806 1.8-1.8 1.8H5.55c-.994 0-1.8-.806-1.8-1.8v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.45.258-.717.258H5.184c-.267 0-.523-.093-.717-.258m16.5 0V8.706c0-1.08-.768-2.014-1.837-2.174a47.79 47.79 0 0 0-3.413-.387m-7.5 0V5.25A2.25 2.25 0 0 1 10.5 3h3a2.25 2.25 0 0 1 2.25 2.25v.819M6.75 7.5v.75m0-1.5h10.5M6.75 7.5H4.25m13 0h2.5M6.75 7.5v8.25M17.25 7.5v8.25M3 16.5h18" />
                  </svg>
                  <svg v-else-if="getCategoryStyle(idx).icon === 'document'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7 text-white">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <svg v-else-if="getCategoryStyle(idx).icon === 'paint'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7 text-white">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.242c0-.399-.078-.78-.22-1.131Zm0 0a15.998 15.998 0 0 1 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 3.395-1.622m-3.42 1.622a15.999 15.999 0 0 1-1.62-3.387m11.378-3.479a3 3 0 0 0-5.78-.87 2.25 2.25 0 0 1-2.4 1.992 4.5 4.5 0 0 0 8.4 1.122c0-.083-.008-.165-.02-.244Zm-10.87-4.135a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.242c0-.399-.078-.78-.22-1.131Zm0 0a15.998 15.998 0 0 1 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 3.395-1.622m-3.42 1.622a15.999 15.999 0 0 1-1.62-3.387M15.75 12c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5.672-1.5 1.5-1.5 1.5.672 1.5 1.5Zm0-4.5c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5.672-1.5 1.5-1.5 1.5.672 1.5 1.5Z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7 text-white">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008ZM2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.379-3.379a.75.75 0 0 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06-1.06l-1.25-1.25Z" />
                  </svg>
                </div>
                <h3 class="text-sm font-extrabold text-slate-800 group-hover:text-[#dc2626] transition-colors leading-tight">{{ cat.name }}</h3>
              </div>
              
              <span class="text-[11px] font-bold text-slate-400 group-hover:text-[#dc2626] transition-colors inline-flex items-center gap-1">
                <span>Xem sản phẩm</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
              </span>
            </router-link>

            <!-- Second Set (Duplicate for smooth wrap) -->
            <router-link
              v-for="(cat, idx) in parentCategories"
              :key="`dup-${cat._id}`"
              :to="`/products?category=${cat._id}`"
              class="w-[220px] shrink-0 bg-white border border-slate-200/60 rounded-3xl p-6 text-center hover:shadow-xl hover:border-slate-300 transition-all flex flex-col items-center justify-between group cursor-pointer h-72 shadow-xs"
            >
              <div class="flex flex-col items-center space-y-4">
                <!-- Animated Circle Card -->
                <div :class="['w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md', getCategoryStyle(idx).gradient]">
                  <svg v-if="getCategoryStyle(idx).icon === 'pencil'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7 text-white">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
                  <svg v-else-if="getCategoryStyle(idx).icon === 'academic'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7 text-white">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M12 21v-4.5" />
                  </svg>
                  <svg v-else-if="getCategoryStyle(idx).icon === 'briefcase'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7 text-white">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 .994-.806 1.8-1.8 1.8H5.55c-.994 0-1.8-.806-1.8-1.8v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.45.258-.717.258H5.184c-.267 0-.523-.093-.717-.258m16.5 0V8.706c0-1.08-.768-2.014-1.837-2.174a47.79 47.79 0 0 0-3.413-.387m-7.5 0V5.25A2.25 2.25 0 0 1 10.5 3h3a2.25 2.25 0 0 1 2.25 2.25v.819M6.75 7.5v.75m0-1.5h10.5M6.75 7.5H4.25m13 0h2.5M6.75 7.5v8.25M17.25 7.5v8.25M3 16.5h18" />
                  </svg>
                  <svg v-else-if="getCategoryStyle(idx).icon === 'document'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7 text-white">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <svg v-else-if="getCategoryStyle(idx).icon === 'paint'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7 text-white">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.242c0-.399-.078-.78-.22-1.131Zm0 0a15.998 15.998 0 0 1 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 3.395-1.622m-3.42 1.622a15.999 15.999 0 0 1-1.62-3.387m11.378-3.479a3 3 0 0 0-5.78-.87 2.25 2.25 0 0 1-2.4 1.992 4.5 4.5 0 0 0 8.4 1.122c0-.083-.008-.165-.02-.244Zm-10.87-4.135a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.242c0-.399-.078-.78-.22-1.131Zm0 0a15.998 15.998 0 0 1 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 3.395-1.622m-3.42 1.622a15.999 15.999 0 0 1-1.62-3.387M15.75 12c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5.672-1.5 1.5-1.5 1.5.672 1.5 1.5Zm0-4.5c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5.672-1.5 1.5-1.5 1.5.672 1.5 1.5Z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7 text-white">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008ZM2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.379-3.379a.75.75 0 0 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06-1.06l-1.25-1.25Z" />
                  </svg>
                </div>
                <h3 class="text-sm font-extrabold text-slate-800 group-hover:text-[#dc2626] transition-colors leading-tight">{{ cat.name }}</h3>
              </div>
              
              <span class="text-[11px] font-bold text-slate-400 group-hover:text-[#dc2626] transition-colors inline-flex items-center gap-1">
                <span>Xem sản phẩm</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
              </span>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Chapter 6: Deal Zone (Urgency) -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8">
      <div class="reveal flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <span class="text-xs font-bold text-[#dc2626] tracking-[0.2em] uppercase">Đừng bỏ lỡ</span>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">🏷️ Deal Sốc Giờ Vàng</h2>
        </div>
        <!-- countdown -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-400 font-bold uppercase tracking-wider">Kết thúc sau:</span>
          <div class="flex items-center gap-1 text-xs font-mono font-bold text-white bg-slate-900 px-3 py-1.5 rounded-lg">
            <span>02</span>:<span>45</span>:<span>18</span>
          </div>
        </div>
      </div>

      <div v-if="loadingDiscount" class="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <div v-for="n in 4" :key="n" class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse">
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <ProductCard
          v-for="(prod, index) in discounted"
          :key="prod._id"
          :product="prod"
          :class="['reveal-scale', `delay-${(index % 4) * 100}`]"
          @add-to-cart="addToCart"
        />
      </div>
    </section>

    <!-- Chapter 5: Editorial Visual Break -->
    <section class="relative min-h-[50vh] flex items-center justify-center bg-slate-900 text-white overflow-hidden py-16 px-4">
      <div class="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25" style="background-image: url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80');"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
      
      <div class="relative max-w-3xl mx-auto text-center space-y-6 z-10 reveal">
        <span class="text-xs font-bold text-amber-400 tracking-[0.3em] uppercase">Không Gian Cảm Hứng</span>
        <h2 class="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Nâng tầm góc làm việc & học tập của bạn
        </h2>
        <p class="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
          Góc làm việc gọn gàng, dụng cụ chất lượng là chiếc chìa khóa vạn năng khơi dậy động lực sáng tạo mỗi ngày. Hãy cùng Trường Thành trang trí không gian của bạn.
        </p>
        <div class="pt-2">
          <router-link to="/products" class="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs py-3 px-6 rounded-full transition-all cursor-pointer">
            <span>Tìm cảm hứng</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" /></svg>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Chapter 4: Best Sellers Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8">
      <div class="reveal flex items-end justify-between border-b border-slate-100 pb-4">
        <div>
          <span class="text-xs font-bold text-[#dc2626] tracking-[0.2em] uppercase">Mọi người yêu thích</span>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">🔥 Sản phẩm bán chạy</h2>
        </div>
        <router-link to="/products" class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group">
          <span>Xem tất cả</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        </router-link>
      </div>

      <div v-if="loadingBest" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <div v-for="n in 10" :key="n" class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse">
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <ProductCard
          v-for="(prod, index) in bestSelling"
          :key="prod._id"
          :product="prod"
          :class="['reveal-scale', `delay-${(index % 5) * 100}`]"
          @add-to-cart="addToCart"
        />
      </div>
    </section>

    <!-- Combo Văn Phòng & Story Card Section -->
    <section class="bg-slate-50 py-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div class="reveal flex items-end justify-between border-b border-slate-200 pb-4">
          <div>
            <span class="text-xs font-bold text-[#dc2626] tracking-[0.2em] uppercase">Tiết kiệm thông minh</span>
            <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">📦 Combo văn phòng</h2>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <ProductCard
            v-for="(prod, index) in combos"
            :key="prod._id"
            :product="prod"
            :class="['reveal-scale', `delay-${(index % 4) * 100}`]"
            @add-to-cart="addToCart"
          />
          
          <!-- Promo Narrative Card -->
          <div class="col-span-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white flex flex-col justify-between relative overflow-hidden shadow-md group reveal-right delay-200 min-h-[250px]">
            <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
            <div class="space-y-2 relative z-10">
              <span class="text-[10px] font-black tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded">Khuyên Dùng</span>
              <h3 class="text-xl sm:text-2xl font-black leading-tight">Bộ Học Tập Trọn Gói<br/>Dành Cho Học Sinh Lớp 1-12</h3>
              <p class="text-white/80 text-xs max-w-sm">Mua trọn bộ đầy đủ bút viết, thước kẻ, sổ ghi chép, máy tính bỏ túi giảm thêm 15% tổng đơn.</p>
            </div>
            <router-link to="/products?q=combo" class="w-fit bg-slate-950 text-white font-extrabold text-xs py-3 px-5 rounded-xl transition-all hover:bg-slate-800 relative z-10 cursor-pointer">
              Xem combo ngay
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- New Arrivals Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8">
      <div class="reveal flex items-end justify-between border-b border-slate-100 pb-4">
        <div>
          <span class="text-xs font-bold text-[#dc2626] tracking-[0.2em] uppercase">Vừa Cập Bến</span>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">✨ Hàng mới về</h2>
        </div>
        <router-link to="/products?sort=newest" class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group">
          <span>Xem tất cả</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        </router-link>
      </div>

      <div v-if="loadingNew" class="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <div v-for="n in 4" :key="n" class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse">
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <ProductCard
          v-for="(prod, index) in newProducts"
          :key="prod._id"
          :product="prod"
          :class="['reveal-scale', `delay-${(index % 4) * 100}`]"
          @add-to-cart="addToCart"
        />
      </div>
    </section>

    <!-- Chapter 7: Testimonials & Closing Newsletter -->
    <section class="bg-gradient-to-b from-slate-950 to-slate-900 text-white py-24 overflow-hidden border-b border-slate-800">
      <div class="max-w-4xl mx-auto px-4 text-center space-y-8 reveal">
        <span class="text-xs font-bold text-[#dc2626] tracking-[0.3em] uppercase">Khách Hàng Nói Gì</span>
        
        <blockquote class="text-lg sm:text-2xl font-medium italic text-slate-100 leading-relaxed">
          "Trường Thành Stationery có bộ dịch vụ khách hàng cực tốt. Tôi đặt mua combo văn phòng cho doanh nghiệp và được hỗ trợ in khắc logo, chất lượng bút và sổ tay thì cực kỳ đẳng cấp."
        </blockquote>
        
        <div class="space-y-1">
          <p class="font-extrabold text-sm text-white">Anh Hoàng Long</p>
          <p class="text-xs text-slate-400">CEO & Founder, Long Tech Media</p>
        </div>

        <div class="pt-6 border-t border-slate-800 max-w-md mx-auto space-y-4">
          <h3 class="text-sm font-bold tracking-wider text-slate-300 uppercase">Đăng ký nhận tin tức & khuyến mãi</h3>
          <form @submit.prevent class="flex gap-2">
            <input
              type="email"
              placeholder="Email của bạn..."
              class="flex-grow bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
            />
            <button type="submit" class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer">
              Đăng ký
            </button>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { useCartStore } from '@/stores/cart'
import { productService } from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import { formatCurrency, getDiscountPercent } from '@/utils/helpers'
import ProductCard from '@/components/ProductCard.vue'
import { useScrollReveal } from '@/composables/useScrollReveal'
import type { Product, Category } from '@/types'

const cartStore = useCartStore()
const toast = useToast()
const { observeNewElements } = useScrollReveal()

const parentCategories = ref<Category[]>([])
const bestSelling = ref<Product[]>([])
const discounted = ref<Product[]>([])
const newProducts = ref<Product[]>([])

const loadingBest = ref(true)
const loadingDiscount = ref(true)
const loadingNew = ref(true)

// Mapped styling system for highlighting categories in home layout
const categoryStyles = [
  { gradient: 'from-rose-400 to-pink-500', icon: 'pencil' },
  { gradient: 'from-amber-400 to-orange-500', icon: 'academic' },
  { gradient: 'from-blue-400 to-sky-500', icon: 'briefcase' },
  { gradient: 'from-emerald-400 to-teal-500', icon: 'document' },
  { gradient: 'from-fuchsia-400 to-purple-500', icon: 'paint' },
  { gradient: 'from-indigo-400 to-purple-500', icon: 'calculator' }
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
    const bestRes = await productService.getBestSelling(10)
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

  // Trigger observer scroll reveal setup once the items are in the DOM
  setTimeout(() => {
    observeNewElements()
  }, 150)
})

function addToCart(product: Product) {
  cartStore.addToCart(product, 1)
  toast.success(`Đã thêm "${product.name}" vào giỏ hàng`)
}
</script>

<style scoped>
.hero-text {
  animation: hero-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-marquee {
  animation: marquee-scroll 35s linear infinite;
}

@keyframes marquee-scroll {
  0% {
    transform: translateX(-50%);
  }
  100% {
    transform: translateX(0);
  }
}

@keyframes hero-reveal {
  from {
    opacity: 0;
    transform: translateY(40px);
    filter: blur(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}
</style>
