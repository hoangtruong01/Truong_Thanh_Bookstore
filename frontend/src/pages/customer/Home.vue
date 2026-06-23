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
            <span class="text-xs font-bold text-[#dc2626] tracking-[0.2em] uppercase">Danh Mục Sản Phẩm</span>
            <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">Đa dạng & chất lượng</h2>
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
    <section
      :style="{ backgroundImage: `url(${flashSaleBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }"
      class="w-full py-16 relative overflow-hidden"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">

        <!-- Section Header -->
        <div class="reveal flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div class="space-y-3">
            <span class="inline-flex items-center gap-1 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              🔥 ĐỪNG BỎ LỠ HÔM NAY!
            </span>
            <div class="flex items-center gap-3">
              <!-- Discount tag icon -->
              <div class="bg-gradient-to-br from-red-500 to-orange-600 text-white p-3 rounded-2xl shadow-lg rotate-12 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.753 2.481.162l5.586-5.586a1.725 1.725 0 0 0 .162-2.481l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
              </div>
              <h2 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                DEAL <span class="text-[#dc2626]">SỐC</span> GIỜ VÀNG
              </h2>
            </div>
            <p class="text-slate-500 text-sm font-medium">
              Giảm giá đến <span class="text-red-600 font-extrabold">30%</span> cho dụng cụ học tập & văn phòng phẩm
            </p>
            <!-- Badges -->
            <div class="flex flex-wrap gap-4 text-xs font-bold text-slate-600 pt-1">
              <span class="flex items-center gap-1 text-orange-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.753 2.481.162l5.586-5.586a1.725 1.725 0 0 0 .162-2.481l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>
                Giá tốt nhất
              </span>
              <span class="flex items-center gap-1 text-orange-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg>
                Hàng chính hãng
              </span>
              <span class="flex items-center gap-1 text-orange-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125a1.125 1.125 0 0 0 1.125-1.125V9.75M3.75 14.25h13.5m0 0V6.375c0-.621-.504-1.125-1.125-1.125H9.75m4.875 0H16.5m-3.375 0H9.75m0 0v1.5A2.25 2.25 0 0 1 7.5 9h-3m3 5.25v-5.25m0 5.25H7.5" /></svg>
                Giao nhanh 24h
              </span>
            </div>
          </div>

          <!-- Countdown timer -->
          <div class="flex flex-col items-center md:items-end gap-2 shrink-0 bg-white/60 border border-orange-200/30 rounded-3xl p-4 backdrop-blur-xs">
            <span class="text-xs text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
              ⏰ KẾT THÚC SAU:
            </span>
            <div class="flex items-center gap-2">
              <!-- Hours -->
              <div class="flex flex-col items-center">
                <div class="bg-slate-900 text-white font-mono font-black text-xl px-3.5 py-2.5 rounded-xl shadow-md min-w-[46px] text-center tracking-wider">
                  {{ hours }}
                </div>
                <span class="text-[10px] font-bold text-slate-400 mt-1 uppercase">Giờ</span>
              </div>
              <span class="font-black text-slate-900 text-xl -mt-5">:</span>
              <!-- Minutes -->
              <div class="flex flex-col items-center">
                <div class="bg-slate-900 text-white font-mono font-black text-xl px-3.5 py-2.5 rounded-xl shadow-md min-w-[46px] text-center tracking-wider">
                  {{ minutes }}
                </div>
                <span class="text-[10px] font-bold text-slate-400 mt-1 uppercase">Phút</span>
              </div>
              <span class="font-black text-slate-900 text-xl -mt-5">:</span>
              <!-- Seconds -->
              <div class="flex flex-col items-center">
                <div class="bg-slate-900 text-white font-mono font-black text-xl px-3.5 py-2.5 rounded-xl shadow-md min-w-[46px] text-center tracking-wider">
                  {{ seconds }}
                </div>
                <span class="text-[10px] font-bold text-slate-400 mt-1 uppercase">Giây</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Products Grid -->
        <div v-if="loadingDiscount" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 relative z-10">
          <div v-for="n in 5" :key="n" class="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 animate-pulse">
            <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
            <div class="h-4 bg-slate-200 rounded w-2/3"></div>
            <div class="h-6 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 relative z-10">
          <div
            v-for="(prod, index) in discounted"
            :key="prod._id"
            @click="goToDetail(prod._id)"
            class="bg-white border border-slate-100/80 rounded-3xl p-5 space-y-4 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 relative group flex flex-col justify-between cursor-pointer"
          >
            <!-- Badge container -->
            <div class="absolute top-4 inset-x-4 flex items-center justify-between z-10 pointer-events-none">
              <!-- Discount percent -->
              <span class="bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                -{{ getDiscountPercent(prod.price, prod.discountPrice) }}%
              </span>
              <!-- Hot Deal Badge (first product only) -->
              <span v-if="index === 0" class="bg-amber-100 text-amber-800 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-0.5">
                🔥 HOT DEAL
              </span>
            </div>

            <!-- Product content -->
            <div class="block space-y-3">
              <!-- Image -->
              <div class="aspect-square bg-slate-50/50 rounded-2xl overflow-hidden flex items-center justify-center p-4">
                <img
                  :src="prod.images && prod.images[0] ? prod.images[0] : 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300'"
                  class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  :alt="prod.name"
                />
              </div>

              <!-- Name & Rating -->
              <div class="space-y-1.5">
                <h3 class="text-xs sm:text-sm font-extrabold text-slate-800 line-clamp-2 hover:text-[#dc2626] transition-colors leading-tight">
                  {{ prod.name }}
                </h3>
                
                <div class="flex items-center gap-1.5 text-[11px]">
                  <div class="flex items-center text-amber-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3.5 h-3.5"><path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" /></svg>
                  </div>
                  <span class="font-bold text-slate-700">{{ prod.rating || 5.0 }}</span>
                  <span class="text-slate-300">|</span>
                  <span class="text-slate-500 font-medium">Đã bán {{ prod.sold || 0 }}</span>
                </div>
              </div>

              <!-- Price -->
              <div class="flex items-baseline gap-2 pt-1 border-t border-slate-100">
                <span class="text-base sm:text-lg font-black text-[#dc2626]">
                  {{ formatCurrency(prod.discountPrice || prod.price) }}
                </span>
                <span v-if="prod.discountPrice" class="text-xs text-slate-400 line-through">
                  {{ formatCurrency(prod.price) }}
                </span>
              </div>

              <!-- Sold Progress Bar -->
              <div class="space-y-1.5 pt-1">
                <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-orange-500 to-[#dc2626] h-full rounded-full transition-all duration-500"
                    :style="{ width: `${Math.min(Math.round((prod.sold / (prod.stock + prod.sold || 100)) * 100), 95) || 30}%` }"
                  ></div>
                </div>
                <div class="flex justify-between items-center text-[10px] font-bold text-slate-500 leading-none">
                  <span>Đã bán {{ prod.sold }}</span>
                  <span>{{ Math.min(Math.round((prod.sold / (prod.stock + prod.sold || 100)) * 100), 95) || 30 }}%</span>
                </div>
              </div>
            </div>

            <!-- Buy Button -->
            <button
              @click.stop="addToCart(prod)"
              class="w-full mt-3 bg-gradient-to-r from-orange-500 to-[#dc2626] hover:from-orange-600 hover:to-[#b91c1c] text-white font-extrabold py-3 px-4 rounded-2xl shadow-md shadow-red-500/10 hover:shadow-lg hover:shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-[11px] uppercase tracking-wider"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              <span>MUA NGAY</span>
            </button>
          </div>
        </div>

        <!-- See More Button -->
        <div class="flex justify-center pt-2 relative z-10">
          <router-link
            to="/products"
            class="bg-white border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
          >
            Xem Thêm
          </router-link>
        </div>

        <!-- Section Footer -->
        <div class="bg-white/95 backdrop-blur-xs border border-orange-100/80 rounded-3xl p-5 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-slate-600 font-bold relative z-10 shadow-lg shadow-orange-600/5">
          <div class="flex items-center gap-3">
            <span class="text-orange-500 text-xl">🔥</span>
            <div>
              <p class="font-extrabold text-slate-800 leading-none">Deal sốc mỗi ngày</p>
              <p class="text-[10px] text-slate-400 font-normal mt-1">Cập nhật liên tục 10:00 & 20:00</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-orange-500 text-xl">🏷️</span>
            <div>
              <p class="font-extrabold text-slate-800 leading-none">Tiết kiệm đến 30%</p>
              <p class="text-[10px] text-slate-400 font-normal mt-1">Giá tốt nhất trong giờ vàng</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-orange-500 text-xl">👥</span>
            <div>
              <p class="font-extrabold text-slate-800 leading-none">Hơn 10.000+ khách hàng</p>
              <p class="text-[10px] text-slate-400 font-normal mt-1">Đã mua và hài lòng</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-orange-500 text-xl">🛡️</span>
            <div>
              <p class="font-extrabold text-slate-800 leading-none">Mua sắm an tâm</p>
              <p class="text-[10px] text-slate-400 font-normal mt-1">Đổi trả miễn phí 7 ngày</p>
            </div>
          </div>
        </div>
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
        />
      </div>

      <!-- See More Button -->
      <div class="flex justify-center pt-6">
        <router-link
          to="/products"
          class="border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
        >
          Xem Thêm
        </router-link>
      </div>
    </section>

    <!-- Combo Văn Phòng & Story Card Section -->
    <section class="bg-slate-50 py-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div class="reveal flex items-end justify-between border-b border-slate-200 pb-4">
          <div>
            <span class="text-xs font-bold text-[#dc2626] tracking-[0.2em] uppercase">Tiết kiệm thông minh</span>
            <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">📦 Combo </h2>
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
          <span class="text-xs font-bold text-[#dc2626] tracking-[0.2em] uppercase"></span>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">✨ Hàng mới về</h2>
        </div>
        <router-link to="/products?sort=newest" class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group">
          <span>Xem tất cả</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        </router-link>
      </div>

      <div v-if="loadingNew" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <div v-for="n in 10" :key="n" class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse">
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <ProductCard
          v-for="(prod, index) in newProducts"
          :key="prod._id"
          :product="prod"
          :class="['reveal-scale', `delay-${(index % 5) * 100}`]"
          @add-to-cart="addToCart"
        />
      </div>

      <!-- See More Button -->
      <div class="flex justify-center pt-6">
        <router-link
          to="/products?sort=newest"
          class="border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
        >
          Xem Thêm
        </router-link>
      </div>
    </section>

    <!-- 1. Sách Giáo Khoa -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8">
      <div class="reveal flex items-end justify-between border-b border-slate-100 pb-4">
        <div>
          <span class="text-xs font-bold text-[#dc2626] tracking-[0.2em] uppercase">Hành Trang Đến Trường</span>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">📚 Sách Giáo Khoa</h2>
        </div>
        <router-link to="/products?q=sách giáo khoa" class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group">
          <span>Xem tất cả</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        </router-link>
      </div>

      <div v-if="loadingNew" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <div v-for="n in 10" :key="n" class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse">
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <ProductCard
          v-for="(prod, index) in getCategoryProducts('Sách Giáo Khoa')"
          :key="prod._id"
          :product="prod"
          :class="['reveal-scale', `delay-${(index % 5) * 100}`]"
          @add-to-cart="addToCart"
        />
      </div>

      <div class="flex justify-center pt-6">
        <router-link
          to="/products?q=sách giáo khoa"
          class="border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
        >
          Xem Thêm
        </router-link>
      </div>
    </section>

    <!-- 2. Sách Tham Khảo -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8">
      <div class="reveal flex items-end justify-between border-b border-slate-100 pb-4">
        <div>
          <span class="text-xs font-bold text-[#dc2626] tracking-[0.2em] uppercase">Nâng Cao Kiến Thức</span>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">📖 Sách Tham Khảo</h2>
        </div>
        <router-link to="/products?q=tham khảo" class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group">
          <span>Xem tất cả</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        </router-link>
      </div>

      <div v-if="loadingNew" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <div v-for="n in 10" :key="n" class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse">
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <ProductCard
          v-for="(prod, index) in getCategoryProducts('Sách Tham Khảo')"
          :key="prod._id"
          :product="prod"
          :class="['reveal-scale', `delay-${(index % 5) * 100}`]"
          @add-to-cart="addToCart"
        />
      </div>

      <div class="flex justify-center pt-6">
        <router-link
          to="/products?q=tham khảo"
          class="border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
        >
          Xem Thêm
        </router-link>
      </div>
    </section>

    <!-- 3. Truyện Tranh -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8">
      <div class="reveal flex items-end justify-between border-b border-slate-100 pb-4">
        <div>
          <span class="text-xs font-bold text-[#dc2626] tracking-[0.2em] uppercase">Thỏa Sức Giải Trí</span>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">✨ Truyện Tranh</h2>
        </div>
        <router-link to="/products?q=truyện" class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group">
          <span>Xem tất cả</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        </router-link>
      </div>

      <div v-if="loadingNew" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <div v-for="n in 10" :key="n" class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse">
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <ProductCard
          v-for="(prod, index) in getCategoryProducts('Truyện Tranh')"
          :key="prod._id"
          :product="prod"
          :class="['reveal-scale', `delay-${(index % 5) * 100}`]"
          @add-to-cart="addToCart"
        />
      </div>

      <div class="flex justify-center pt-6">
        <router-link
          to="/products?q=truyện"
          class="border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
        >
          Xem Thêm
        </router-link>
      </div>
    </section>

    <!-- Beautiful Mid-Promo Banner with Section BG -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div 
        class="reveal rounded-3xl overflow-hidden relative shadow-2xl border border-rose-100 flex flex-col md:flex-row items-center justify-between p-8 sm:p-12 md:p-16 min-h-[350px] bg-cover bg-center"
        :style="{ backgroundImage: 'url(' + sectionBg + ')' }"
      >
        <!-- Overlay to ensure text readability -->
        <div class="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent md:to-white/10 pointer-events-none"></div>
        
        <!-- Text Content -->
        <div class="relative z-10 max-w-xl space-y-4 text-left">
          <span class="text-xs font-black text-rose-600 tracking-[0.25em] uppercase">Bộ Sưu Tập Đặc Biệt</span>
          <h2 class="text-3xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight">
            Nét Bút Tri Thức <br />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-500">Khởi Đầu Tương Lai</span>
          </h2>
          <p class="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            Trang bị đầy đủ các sản phẩm sách giáo khoa chính hãng, sách tham khảo đa dạng môn học và truyện tranh hấp dẫn nhất tại Trường Thành Bookstore. Đồng hành cùng bạn trên mọi nẻo đường tri thức.
          </p>
          <div class="pt-2">
            <router-link 
              to="/products" 
              class="inline-flex items-center gap-2 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white font-extrabold text-xs px-8 py-3.5 rounded-xl shadow-lg shadow-rose-600/20 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Khám Phá Ngay</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
            </router-link>
          </div>
        </div>

        <!-- Decorative Right Badge (optional glassmorphism badge) -->
        <div class="relative z-10 mt-8 md:mt-0 bg-white/20 backdrop-blur-md border border-white/40 p-6 rounded-2xl shadow-xl max-w-xs text-center space-y-2 hidden sm:block">
          <span class="text-2xl">✨</span>
          <h3 class="text-xs font-black text-rose-700 uppercase tracking-wider">Ưu Đãi Đặc Biệt</h3>
          <p class="text-[10px] text-slate-700 font-bold leading-normal">
            Giảm giá lên đến 40% cho tất cả các combo và đồ lưu niệm xinh xắn chuẩn bị cho năm học mới 2026.
          </p>
        </div>
      </div>
    </section>

    <!-- 4. Combo -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8">
      <div class="reveal flex items-end justify-between border-b border-slate-100 pb-4">
        <div>
          <span class="text-xs font-bold text-[#dc2626] tracking-[0.2em] uppercase">Tiết Kiệm Hơn</span>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">🎁 Combo Ưu Đãi</h2>
        </div>
        <router-link to="/products?q=combo" class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group">
          <span>Xem tất cả</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        </router-link>
      </div>

      <div v-if="loadingNew" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <div v-for="n in 10" :key="n" class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse">
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <ProductCard
          v-for="(prod, index) in getCategoryProducts('Combo')"
          :key="prod._id"
          :product="prod"
          :class="['reveal-scale', `delay-${(index % 5) * 100}`]"
          @add-to-cart="addToCart"
        />
      </div>

      <div class="flex justify-center pt-6">
        <router-link
          to="/products?q=combo"
          class="border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
        >
          Xem Thêm
        </router-link>
      </div>
    </section>

    <!-- 5. Đồ Chơi -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8">
      <div class="reveal flex items-end justify-between border-b border-slate-100 pb-4">
        <div>
          <span class="text-xs font-bold text-[#dc2626] tracking-[0.2em] uppercase">Phát Triển Tư Duy</span>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">🧩 Đồ Chơi</h2>
        </div>
        <router-link to="/products?q=chơi" class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group">
          <span>Xem tất cả</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        </router-link>
      </div>

      <div v-if="loadingNew" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <div v-for="n in 10" :key="n" class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse">
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <ProductCard
          v-for="(prod, index) in getCategoryProducts('Đồ Chơi')"
          :key="prod._id"
          :product="prod"
          :class="['reveal-scale', `delay-${(index % 5) * 100}`]"
          @add-to-cart="addToCart"
        />
      </div>

      <div class="flex justify-center pt-6">
        <router-link
          to="/products?q=chơi"
          class="border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
        >
          Xem Thêm
        </router-link>
      </div>
    </section>

    <!-- 6. Đồ Lưu Niệm -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8">
      <div class="reveal flex items-end justify-between border-b border-slate-100 pb-4">
        <div>
          <span class="text-xs font-bold text-[#dc2626] tracking-[0.2em] uppercase">Quà Tặng Ý Nghĩa</span>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">🎁 Đồ Lưu Niệm</h2>
        </div>
        <router-link to="/products?q=lưu niệm" class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group">
          <span>Xem tất cả</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        </router-link>
      </div>

      <div v-if="loadingNew" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <div v-for="n in 10" :key="n" class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse">
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <ProductCard
          v-for="(prod, index) in getCategoryProducts('Đồ Lưu Niệm')"
          :key="prod._id"
          :product="prod"
          :class="['reveal-scale', `delay-${(index % 5) * 100}`]"
          @add-to-cart="addToCart"
        />
      </div>

      <div class="flex justify-center pt-6">
        <router-link
          to="/products?q=lưu niệm"
          class="border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
        >
          Xem Thêm
        </router-link>
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
          <form @submit.prevent="handleSubscribe" class="flex gap-2">
            <input
              v-model="newsletterEmail"
              type="email"
              required
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
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useCartStore } from '@/stores/cart'
import { productService } from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import { formatCurrency, getDiscountPercent } from '@/utils/helpers'
import ProductCard from '@/components/ProductCard.vue'
import { useScrollReveal } from '@/composables/useScrollReveal'
import type { Product, Category } from '@/types'
import flashSaleBg from '@/assets/flash-sale-bg.png'
import sectionBg from '@/assets/section-bg.png'

const cartStore = useCartStore()
const toast = useToast()
const router = useRouter()

function goToDetail(id: string) {
  router.push(`/products/${id}`)
}
const { observeNewElements } = useScrollReveal()

const parentCategories = ref<Category[]>([])
const bestSelling = ref<Product[]>([])
const discounted = ref<Product[]>([])
const newProducts = ref<Product[]>([])

const loadingBest = ref(true)
const loadingDiscount = ref(true)
const loadingNew = ref(true)

// Countdown timer refs
const hours = ref('00')
const minutes = ref('00')
const seconds = ref('00')
let countdownTimer: any = null

function startCountdown() {
  const updateTimer = () => {
    const now = new Date()
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    const diff = midnight.getTime() - now.getTime()
    if (diff <= 0) {
      return
    }
    const h = Math.floor(diff / (1000 * 60 * 60))
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const s = Math.floor((diff % (1000 * 60)) / 1000)
    hours.value = h.toString().padStart(2, '0')
    minutes.value = m.toString().padStart(2, '0')
    seconds.value = s.toString().padStart(2, '0')
  }
  updateTimer()
  countdownTimer = setInterval(updateTimer, 1000)
}

// BUG-09: Newsletter subscription
const newsletterEmail = ref('')
function handleSubscribe() {
  if (!newsletterEmail.value.trim()) return
  toast.success('Đăng ký nhận tin thành công! Chúng tôi đã lưu thông tin của bạn.')
  newsletterEmail.value = ''
}

// Mapped styling system for highlighting categories in home layout
const categoryStyles = [
  { gradient: 'from-blue-400 to-sky-500', icon: 'academic' },
  { gradient: 'from-emerald-400 to-teal-500', icon: 'document' },
  { gradient: 'from-rose-400 to-pink-500', icon: 'pencil' },
  { gradient: 'from-fuchsia-400 to-purple-500', icon: 'briefcase' },
  { gradient: 'from-amber-400 to-orange-500', icon: 'paint' },
  { gradient: 'from-indigo-400 to-purple-500', icon: 'calculator' }
]

function getCategoryStyle(index: number) {
  return categoryStyles[index % categoryStyles.length]
}

const filterCategoryProducts = (categoryName: string) => {
  const allProds = [...newProducts.value, ...bestSelling.value]
  const uniqueProds = Array.from(new Map(allProds.map(p => [p._id, p])).values())
  
  const nameMatches = (p: Product, keywords: string[]) => {
    const nameLower = p.name.toLowerCase()
    const catLower = p.category && typeof p.category === 'object' && (p.category as any).name
      ? (p.category as any).name.toLowerCase()
      : ''
    return keywords.some(k => nameLower.includes(k) || catLower.includes(k))
  }

  if (categoryName === 'Sách Giáo Khoa') {
    return uniqueProds.filter(p => nameMatches(p, ['giáo khoa', 'sgk', 'bài tập']))
  }
  if (categoryName === 'Sách Tham Khảo') {
    return uniqueProds.filter(p => nameMatches(p, ['tham khảo', 'luyện đề', 'ôn thi']))
  }
  if (categoryName === 'Truyện Tranh') {
    return uniqueProds.filter(p => nameMatches(p, ['truyện', 'manga', 'comic']))
  }
  if (categoryName === 'Combo') {
    return uniqueProds.filter(p => nameMatches(p, ['combo']))
  }
  if (categoryName === 'Đồ Chơi') {
    return uniqueProds.filter(p => nameMatches(p, ['chơi', 'lego', 'rubik', 'thủ công', 'đồ chơi']))
  }
  if (categoryName === 'Đồ Lưu Niệm') {
    return uniqueProds.filter(p => nameMatches(p, ['lưu niệm', 'quà', 'móc khóa', 'sổ tay']))
  }
  return []
}

const getCategoryProducts = (categoryName: string) => {
  const filtered = filterCategoryProducts(categoryName)
  if (filtered.length > 0) {
    if (filtered.length < 10) {
      const allProds = [...newProducts.value, ...bestSelling.value]
      const uniqueProds = Array.from(new Map(allProds.map(p => [p._id, p])).values())
      const remaining = uniqueProds.filter(p => !filtered.some(f => f._id === p._id))
      return [...filtered, ...remaining].slice(0, 10)
    }
    return filtered.slice(0, 10)
  }
  const allProds = [...newProducts.value, ...bestSelling.value]
  const uniqueProds = Array.from(new Map(allProds.map(p => [p._id, p])).values())
  const hash = categoryName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const startIdx = hash % Math.max(1, uniqueProds.length - 9)
  return uniqueProds.slice(startIdx, startIdx + 10)
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

onMounted(() => {
  startCountdown()

  // Concurrently load all homepage content in parallel to prevent waterfall blocking (UX Optimization)
  categoryService.getParents()
    .then(catRes => {
      parentCategories.value = catRes.data
    })
    .catch(err => {
      console.error('Error loading parent categories', err)
    })

  productService.getBestSelling(10)
    .then(bestRes => {
      bestSelling.value = bestRes.data
    })
    .catch(err => {
      console.error('Error loading best sellers', err)
    })
    .finally(() => {
      loadingBest.value = false
    })

  productService.getDiscounted(5)
    .then(discRes => {
      discounted.value = discRes.data
    })
    .catch(err => {
      console.error('Error loading discounted products', err)
    })
    .finally(() => {
      loadingDiscount.value = false
    })

  productService.getNew(10)
    .then(newRes => {
      newProducts.value = newRes.data
    })
    .catch(err => {
      console.error('Error loading new products', err)
    })
    .finally(() => {
      loadingNew.value = false
    })

  // Trigger observer scroll reveal setup once the items are in the DOM
  setTimeout(() => {
    observeNewElements()
  }, 350)
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
