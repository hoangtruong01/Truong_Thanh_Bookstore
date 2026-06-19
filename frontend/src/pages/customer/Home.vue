<template>
  <div class="space-y-20 pb-24 overflow-hidden">
    <!-- Hero Banner Redesign -->
    <div class="relative min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white px-6 md:px-16 overflow-hidden py-12">
      <!-- Glow blobs -->
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse-soft"></div>
      <div class="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-indigo-500/15 rounded-full blur-3xl animate-pulse-soft" style="animation-delay: -3s;"></div>
      
      <!-- Tech Grid Overlay -->
      <div class="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] [background-size:24px_24px]"></div>
      
      <div class="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-center gap-12 w-full">
        <!-- Text details -->
        <div class="lg:col-span-7 space-y-8 text-center lg:text-left flex flex-col items-center lg:items-start">
          <div class="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-md">
            <span class="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            <span>Trường Thành Stationery 2026</span>
          </div>
          
          <h1 class="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-blue-200">
            Nơi khơi nguồn <br/>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">cảm hứng sáng tạo</span>
          </h1>
          
          <p class="text-slate-300 text-lg md:text-xl font-medium max-w-xl leading-relaxed">
            Chúng tôi cung cấp giải pháp văn phòng phẩm toàn diện, dụng cụ học tập cao cấp và thiết bị trường học chính hãng 100%. Đồng hành cùng sự phát triển của tri thức Việt.
          </p>
          
          <div class="pt-4 flex flex-wrap justify-center lg:justify-start gap-4">
            <router-link to="/products" class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 px-10 rounded-full shadow-xl shadow-blue-500/20 hover:shadow-blue-500/35 transition-all text-base hover:-translate-y-0.5">
              Khám Phá Cửa Hàng
            </router-link>
            <a href="#brand-story" class="glass-panel-dark text-slate-200 hover:text-white font-bold py-4 px-8 rounded-full transition-all text-base hover:-translate-y-0.5">
              Hành Trình Thương Hiệu
            </a>
          </div>

          <!-- Quick stats widget -->
          <div class="grid grid-cols-3 gap-6 pt-8 w-full max-w-md border-t border-slate-800/80 mt-2">
            <div>
              <p class="text-2xl md:text-3xl font-black text-blue-400">10K+</p>
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Sản phẩm có sẵn</p>
            </div>
            <div>
              <p class="text-2xl md:text-3xl font-black text-indigo-400">99.8%</p>
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Hài lòng từ khách</p>
            </div>
            <div>
              <p class="text-2xl md:text-3xl font-black text-purple-400">Freeship</p>
              <p class="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Đơn từ 299.000đ</p>
            </div>
          </div>
        </div>

        <!-- Visual showcase item -->
        <div class="lg:col-span-5 hidden lg:flex justify-center relative">
          <!-- Decorative circle background -->
          <div class="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl animate-spin-slow"></div>
          
          <div class="relative animate-float bg-slate-900/60 p-6 rounded-[36px] border border-white/10 backdrop-blur-2xl shadow-2xl max-w-sm">
            <img
              src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600"
              alt="Stationery showcase"
              class="rounded-2xl shadow-lg object-cover aspect-[4/3] w-full mb-6 filter brightness-95"
            />
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs text-slate-400 font-bold uppercase">Sản phẩm tiêu biểu</p>
                <h4 class="font-extrabold text-white text-base mt-0.5">Sổ Tay Bìa Da Trường Thành</h4>
              </div>
              <router-link to="/products" class="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll prompt -->
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-55 animate-bounce">
        <span class="text-[10px] uppercase font-bold tracking-widest text-slate-400">Cuộn xuống khám phá</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-slate-400"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" /></svg>
      </div>
    </div>

    <!-- Main Container -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
      
      <!-- Brand Storytelling Section (Scroll-driven) -->
      <section id="brand-story" class="relative py-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div class="lg:col-span-5 space-y-6 reveal reveal-left">
            <span class="text-xs font-black tracking-widest text-blue-600 uppercase bg-blue-50 px-3.5 py-1.5 rounded-full inline-block border border-blue-100">Hành Trình Tri Thức</span>
            <h2 class="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
              Đồng hành cùng sự học và sáng tạo bền bỉ
            </h2>
            <p class="text-slate-500 font-medium text-base leading-relaxed">
              Trường Thành Stationery ra đời với khát vọng đơn giản: cung cấp những dụng cụ tốt nhất để lưu trữ ý tưởng của bạn. Từ nét chữ đầu tiên của học sinh tiểu học đến bản kế hoạch kinh doanh của doanh nghiệp lớn, chúng tôi đều ở đây để nâng niu từng nét bút.
            </p>
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 font-bold text-lg">100%</div>
              <div>
                <p class="text-sm font-bold text-slate-800">Chất lượng cam kết</p>
                <p class="text-xs text-slate-400">Sản phẩm xuất xứ rõ ràng từ các thương hiệu hàng đầu thế giới.</p>
              </div>
            </div>
          </div>
          
          <!-- Animated brand values cards -->
          <div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs reveal delay-100 space-y-4 hover:border-blue-400 transition-all">
              <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xl">💡</div>
              <h3 class="font-extrabold text-slate-900 text-lg">Khơi Nguồn Cảm Hứng</h3>
              <p class="text-xs text-slate-500 leading-relaxed font-medium">Chúng tôi không chỉ bán văn phòng phẩm, chúng tôi cung cấp công cụ để khơi dậy các ý tưởng đột phá của bạn.</p>
            </div>
            
            <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs reveal delay-200 space-y-4 hover:border-indigo-400 transition-all">
              <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xl">🛡️</div>
              <h3 class="font-extrabold text-slate-900 text-lg">Độ Bền & Tin Cậy</h3>
              <p class="text-xs text-slate-500 leading-relaxed font-medium">Thiết kế tinh xảo, chất lượng bền bỉ giúp bạn tập trung cao độ mà không phải bận tâm về sự cố hư hỏng.</p>
            </div>

            <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs reveal delay-300 space-y-4 hover:border-purple-400 transition-all">
              <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xl">📦</div>
              <h3 class="font-extrabold text-slate-900 text-lg">Đóng Gói Chuyên Nghiệp</h3>
              <p class="text-xs text-slate-500 leading-relaxed font-medium">Mỗi món hàng đều được đóng gói tỉ mỉ, chống sốc tuyệt đối nhằm đảm bảo trạng thái nguyên vẹn nhất khi tới tay.</p>
            </div>

            <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs reveal delay-400 space-y-4 hover:border-emerald-400 transition-all">
              <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl">🚚</div>
              <h3 class="font-extrabold text-slate-900 text-lg">Giao Hàng Siêu Tốc</h3>
              <p class="text-xs text-slate-500 leading-relaxed font-medium">Hệ thống xử lý đơn hàng thông minh giúp chuyển phát nhanh chóng tới nhà sách hoặc cơ quan của bạn.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Highlighted Categories -->
      <section class="space-y-8 reveal">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
          <div>
            <span class="text-xs font-black tracking-widest text-blue-600 uppercase">Khám Phá Ngay</span>
            <h2 class="text-2xl md:text-4xl font-extrabold text-slate-900 mt-1">Danh Mục Nổi Bật</h2>
          </div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          <router-link
            v-for="(cat, idx) in parentCategories"
            :key="cat._id"
            :to="`/products?category=${cat._id}`"
            class="bg-white border border-slate-150 rounded-3xl p-6 text-center hover:shadow-xl hover:border-blue-400 transition-all flex flex-col items-center group reveal"
            :class="'delay-' + ((idx + 1) * 100)"
          >
            <div class="w-16 h-16 rounded-full bg-blue-50/70 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xs">
              <img :src="cat.image" class="w-10 h-10 object-cover rounded-full" />
            </div>
            <span class="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{{ cat.name }}</span>
          </router-link>
        </div>
      </section>

      <!-- Best Sellers Grid -->
      <section id="featured-products" class="space-y-8 reveal">
        <div class="flex items-end justify-between">
          <div>
            <span class="text-xs font-black tracking-widest text-indigo-600 uppercase">Được yêu thích nhất</span>
            <h2 class="text-2xl md:text-4xl font-extrabold text-slate-900 mt-1">Sản Phẩm Bán Chạy</h2>
          </div>
          <router-link to="/products?sort=best_selling" class="text-blue-600 hover:text-blue-800 font-bold text-sm flex items-center gap-1">
            <span>Xem tất cả</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          </router-link>
        </div>
        
        <div v-if="loadingBest" class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div v-for="n in 4" :key="n" class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse">
            <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
            <div class="h-4 bg-slate-200 rounded w-2/3"></div>
            <div class="h-6 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>

        <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div
            v-for="(prod, idx) in bestSelling"
            :key="prod._id"
            class="bg-white border border-slate-200/80 rounded-3xl p-4 hover:shadow-xl hover:border-blue-300 transition-all flex flex-col group relative reveal"
            :class="'delay-' + ((idx + 1) * 100)"
          >
            <!-- Discount badge -->
            <span v-if="getDiscountPercent(prod.price, prod.discountPrice) > 0" class="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full z-10 shadow-md">
              -{{ getDiscountPercent(prod.price, prod.discountPrice) }}%
            </span>
            <!-- Image container -->
            <div class="aspect-square bg-slate-50/70 rounded-2xl overflow-hidden mb-4 relative">
              <img :src="prod.images[0] || 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <!-- Title -->
            <h3 class="text-sm font-bold text-slate-800 line-clamp-2 min-h-[40px] group-hover:text-blue-700 transition-colors">
              <router-link :to="`/products/${prod._id}`">{{ prod.name }}</router-link>
            </h3>
            <!-- Price and Rating -->
            <div class="mt-2 flex items-center justify-between">
              <div class="flex flex-col">
                <template v-if="prod.discountPrice > 0">
                  <span class="text-base font-extrabold text-blue-700">{{ formatCurrency(prod.discountPrice) }}</span>
                  <span class="text-xs text-slate-400 line-through">{{ formatCurrency(prod.price) }}</span>
                </template>
                <template v-else>
                  <span class="text-base font-extrabold text-slate-800">{{ formatCurrency(prod.price) }}</span>
                </template>
              </div>
              <div class="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-full">
                <span class="text-xs font-bold text-yellow-700">{{ prod.rating || 5 }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3 text-yellow-500">
                  <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <!-- Add to Cart -->
            <button @click="addToCart(prod)" class="mt-4 w-full bg-slate-950 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
              <span>Thêm vào giỏ</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Exclusive Coupon station (Visual design overhaul) -->
      <section class="relative reveal rounded-[40px] bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-8 md:p-12 overflow-hidden border border-white/5 shadow-2xl">
        <div class="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse-soft"></div>
        <div class="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div class="space-y-3 text-center lg:text-left max-w-xl">
            <span class="text-[10px] font-black tracking-widest text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30 uppercase">Ưu đãi độc quyền</span>
            <h3 class="text-3xl md:text-4xl font-black leading-tight text-white">Tiết kiệm nhiều hơn với Voucher đặc quyền</h3>
            <p class="text-indigo-200 text-sm font-medium">Nhấn vào mã bên dưới để sao chép nhanh và áp dụng giảm giá ngay khi thanh toán đơn hàng của bạn.</p>
          </div>
          
          <div class="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div v-for="code in ['WELCOME10', 'SUMMER50K', 'FREESHIP']" :key="code" class="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center min-w-[140px] hover:bg-white/15 transition-all">
              <span class="font-mono font-black text-indigo-300 text-base tracking-wider uppercase">
                {{ code }}
              </span>
              <button @click="copyCode(code)" class="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 rounded-full transition-colors">
                Sao chép
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Discounted Products Grid -->
      <section class="space-y-8 reveal">
        <div class="flex items-end justify-between">
          <div>
            <span class="text-xs font-black tracking-widest text-red-600 uppercase">Ưu đãi sốc</span>
            <h2 class="text-2xl md:text-4xl font-extrabold text-slate-900 mt-1">Đang Giảm Giá Cực Sốc</h2>
          </div>
          <router-link to="/products?discounted=true" class="text-blue-600 hover:text-blue-800 font-bold text-sm flex items-center gap-1">
            <span>Xem tất cả</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          </router-link>
        </div>

        <div v-if="loadingDiscount" class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div v-for="n in 4" :key="n" class="bg-white rounded-3xl border border-slate-200 p-4 animate-pulse space-y-4">
            <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
            <div class="h-4 bg-slate-200 rounded w-2/3"></div>
            <div class="h-6 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>

        <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div
            v-for="(prod, idx) in discounted"
            :key="prod._id"
            class="bg-white border border-slate-200/80 rounded-3xl p-4 hover:shadow-xl hover:border-blue-300 transition-all flex flex-col group relative reveal"
            :class="'delay-' + ((idx + 1) * 100)"
          >
            <span class="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full z-10 shadow-md">
              -{{ getDiscountPercent(prod.price, prod.discountPrice) }}%
            </span>
            <div class="aspect-square bg-slate-50/70 rounded-2xl overflow-hidden mb-4 relative">
              <img :src="prod.images[0] || 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h3 class="text-sm font-bold text-slate-800 line-clamp-2 min-h-[40px] group-hover:text-blue-700 transition-colors">
              <router-link :to="`/products/${prod._id}`">{{ prod.name }}</router-link>
            </h3>
            <div class="mt-2 flex items-center justify-between">
              <div class="flex flex-col">
                <span class="text-base font-extrabold text-blue-700">{{ formatCurrency(prod.discountPrice) }}</span>
                <span class="text-xs text-slate-400 line-through">{{ formatCurrency(prod.price) }}</span>
              </div>
              <div class="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-full">
                <span class="text-xs font-bold text-yellow-700">{{ prod.rating || 5 }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3 text-yellow-500">
                  <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <button @click="addToCart(prod)" class="mt-4 w-full bg-slate-950 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm">
              <span>Thêm vào giỏ</span>
            </button>
          </div>
        </div>
      </section>

      <!-- New Products Grid -->
      <section class="space-y-8 reveal">
        <div class="flex items-end justify-between">
          <div>
            <span class="text-xs font-black tracking-widest text-purple-600 uppercase">Hàng mới</span>
            <h2 class="text-2xl md:text-4xl font-extrabold text-slate-900 mt-1">Hàng Mới Về</h2>
          </div>
          <router-link to="/products?sort=newest" class="text-blue-600 hover:text-blue-800 font-bold text-sm flex items-center gap-1">
            <span>Xem tất cả</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          </router-link>
        </div>

        <div v-if="loadingNew" class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div v-for="n in 4" :key="n" class="bg-white rounded-3xl border border-slate-200 p-4 animate-pulse space-y-4">
            <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
            <div class="h-4 bg-slate-200 rounded w-2/3"></div>
            <div class="h-6 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>

        <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div
            v-for="(prod, idx) in newProducts"
            :key="prod._id"
            class="bg-white border border-slate-200/80 rounded-3xl p-4 hover:shadow-xl hover:border-blue-300 transition-all flex flex-col group relative reveal"
            :class="'delay-' + ((idx + 1) * 100)"
          >
            <span v-if="getDiscountPercent(prod.price, prod.discountPrice) > 0" class="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full z-10 shadow-md">
              -{{ getDiscountPercent(prod.price, prod.discountPrice) }}%
            </span>
            <div class="aspect-square bg-slate-50/70 rounded-2xl overflow-hidden mb-4 relative">
              <img :src="prod.images[0] || 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h3 class="text-sm font-bold text-slate-800 line-clamp-2 min-h-[40px] group-hover:text-blue-700 transition-colors">
              <router-link :to="`/products/${prod._id}`">{{ prod.name }}</router-link>
            </h3>
            <div class="mt-2 flex items-center justify-between">
              <div class="flex flex-col">
                <template v-if="prod.discountPrice > 0">
                  <span class="text-base font-extrabold text-blue-700">{{ formatCurrency(prod.discountPrice) }}</span>
                  <span class="text-xs text-slate-400 line-through">{{ formatCurrency(prod.price) }}</span>
                </template>
                <template v-else>
                  <span class="text-base font-extrabold text-slate-800">{{ formatCurrency(prod.price) }}</span>
                </template>
              </div>
              <div class="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-full">
                <span class="text-xs font-bold text-yellow-700">{{ prod.rating || 5 }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3 text-yellow-500">
                  <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <button @click="addToCart(prod)" class="mt-4 w-full bg-slate-950 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm">
              <span>Thêm vào giỏ</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
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

let scrollObserver: IntersectionObserver | null = null

onMounted(async () => {
  // Load data
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

  // Setup Scroll-Driven storytelling animations
  setupScrollAnimations()
})

onBeforeUnmount(() => {
  if (scrollObserver) {
    scrollObserver.disconnect()
  }
})

function setupScrollAnimations() {
  scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed')
      }
    })
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  })

  // Start observing
  setTimeout(() => {
    const animatedElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
    animatedElements.forEach((el) => {
      scrollObserver?.observe(el)
    })
  }, 350)
}

function addToCart(product: Product) {
  cartStore.addToCart(product, 1)
  toast.success(`Đã thêm "${product.name}" vào giỏ hàng`)
}

function copyCode(code: string) {
  navigator.clipboard.writeText(code)
  toast.success(`Đã sao chép mã: ${code}`)
}
</script>
