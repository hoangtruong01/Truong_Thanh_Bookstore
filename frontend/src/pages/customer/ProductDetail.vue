<template>
  <div class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <!-- Breadcrumb -->
    <Breadcrumb :items="breadcrumbItems" />

    <div v-if="loading" class="bg-white border border-slate-200 rounded-3xl p-8 animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
      <div class="space-y-6">
        <div class="h-8 bg-slate-200 rounded w-2/3"></div>
        <div class="h-4 bg-slate-200 rounded w-1/3"></div>
        <div class="h-10 bg-slate-200 rounded w-1/2"></div>
        <div class="h-20 bg-slate-200 rounded w-full"></div>
      </div>
    </div>

    <div v-else-if="!product" class="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-4">
      <h3 class="text-lg font-bold text-slate-800">Không tìm thấy sản phẩm</h3>
      <router-link to="/products" class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-2.5 px-6 rounded-xl transition-colors inline-block text-sm">
        Trở về danh sách sản phẩm
      </router-link>
    </div>

    <div v-else class="space-y-12">
      <!-- Product Main Grid -->
      <div class="bg-white border border-slate-200 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-2 gap-12 shadow-xs">
        <!-- Gallery -->
        <div class="space-y-4">
          <div class="aspect-square bg-slate-50/70 rounded-2xl overflow-hidden border border-slate-100 relative flex items-center justify-center group">
            <!-- Sliding Track -->
            <div 
              v-if="product && product.images && product.images.length > 0"
              class="flex w-full h-full transition-transform duration-500 ease-in-out cursor-zoom-in"
              :style="{ transform: `translateX(-${Math.max(0, product.images.indexOf(selectedImage)) * 100}%)` }"
              @click="openLightbox(Math.max(0, product.images.indexOf(selectedImage)))"
            >
              <div 
                v-for="(img, idx) in product.images" 
                :key="idx" 
                class="w-full h-full flex-shrink-0 flex items-center justify-center bg-slate-50/70 relative"
              >
                <!-- Blurred background to fill empty space -->
                <img 
                  v-if="!brokenImages[img]"
                  :src="img" 
                  class="absolute inset-0 w-full h-full object-cover blur-xl opacity-[0.22] scale-125 select-none pointer-events-none" 
                />
                
                <!-- Main product image with drop shadow -->
                <img 
                  v-if="!brokenImages[img]"
                  :src="img" 
                  @error="handleImageError(img)"
                  class="w-full h-full object-contain p-4 relative z-10 filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.06)] group-hover:scale-105 transition-transform duration-300" 
                />
                <div v-else :class="`w-full h-full ${getProductPlaceholder(product ? product.name : '').gradient} flex items-center justify-center`">
                  <svg v-if="getProductPlaceholder(product ? product.name : '').icon === 'pencil'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
                  <svg v-else-if="getProductPlaceholder(product ? product.name : '').icon === 'document'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <svg v-else-if="getProductPlaceholder(product ? product.name : '').icon === 'calculator'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008ZM2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.379-3.379a.75.75 0 0 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06-1.06l-1.25-1.25Z" />
                  </svg>
                  <svg v-else-if="getProductPlaceholder(product ? product.name : '').icon === 'folder'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-19.5 0A2.25 2.25 0 0 0 4.5 15h15a2.25 2.25 0 0 0 2.25-2.25m-19.5 0v.225C2.25 14.28 3.52 15 5.04 15h13.92c1.52 0 2.79-.72 2.79-2.025v-.225M3 9V6a3 3 0 0 1 3-3h3.75a3 3 0 0 1 2.25 1.025L13.5 6h6.75A3 3 0 0 1 23 9v2.25m-20.25 0h17.5" />
                  </svg>
                  <svg v-else-if="getProductPlaceholder(product ? product.name : '').icon === 'briefcase'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 .994-.806 1.8-1.8 1.8H5.55c-.994 0-1.8-.806-1.8-1.8v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.45.258-.717.258H5.184c-.267 0-.523-.093-.717-.258m16.5 0V8.706c0-1.08-.768-2.014-1.837-2.174a47.79 47.79 0 0 0-3.413-.387m-7.5 0V5.25A2.25 2.25 0 0 1 10.5 3h3a2.25 2.25 0 0 1 2.25 2.25v.819M6.75 7.5v.75m0-1.5h10.5M6.75 7.5H4.25m13 0h2.5M6.75 7.5v8.25M17.25 7.5v8.25M3 16.5h18" />
                  </svg>
                  <svg v-else-if="getProductPlaceholder(product ? product.name : '').icon === 'academic'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M12 21v-4.5" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.753 2.481.162l5.586-5.586a1.725 1.725 0 0 0 .162-2.481l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
                  </svg>
                </div>
              </div>
            </div>
            <div v-else :class="`w-full h-full ${getProductPlaceholder(product ? product.name : '').gradient} flex items-center justify-center`">
              <svg v-if="getProductPlaceholder(product ? product.name : '').icon === 'pencil'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
              <svg v-else-if="getProductPlaceholder(product ? product.name : '').icon === 'document'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <svg v-else-if="getProductPlaceholder(product ? product.name : '').icon === 'calculator'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008ZM2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.379-3.379a.75.75 0 0 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06-1.06l-1.25-1.25Z" />
              </svg>
              <svg v-else-if="getProductPlaceholder(product ? product.name : '').icon === 'folder'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-19.5 0A2.25 2.25 0 0 0 4.5 15h15a2.25 2.25 0 0 0 2.25-2.25m-19.5 0v.225C2.25 14.28 3.52 15 5.04 15h13.92c1.52 0 2.79-.72 2.79-2.025v-.225M3 9V6a3 3 0 0 1 3-3h3.75a3 3 0 0 1 2.25 1.025L13.5 6h6.75A3 3 0 0 1 23 9v2.25m-20.25 0h17.5" />
              </svg>
              <svg v-else-if="getProductPlaceholder(product ? product.name : '').icon === 'briefcase'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 .994-.806 1.8-1.8 1.8H5.55c-.994 0-1.8-.806-1.8-1.8v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.45.258-.717.258H5.184c-.267 0-.523-.093-.717-.258m16.5 0V8.706c0-1.08-.768-2.014-1.837-2.174a47.79 47.79 0 0 0-3.413-.387m-7.5 0V5.25A2.25 2.25 0 0 1 10.5 3h3a2.25 2.25 0 0 1 2.25 2.25v.819M6.75 7.5v.75m0-1.5h10.5M6.75 7.5H4.25m13 0h2.5M6.75 7.5v8.25M17.25 7.5v8.25M3 16.5h18" />
              </svg>
              <svg v-else-if="getProductPlaceholder(product ? product.name : '').icon === 'academic'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M12 21v-4.5" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-24 h-24 text-white/90">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.753 2.481.162l5.586-5.586a1.725 1.725 0 0 0 .162-2.481l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
              </svg>
            </div>
          </div>
          <div v-if="product.images.length > 1" class="flex gap-3 overflow-x-auto py-1">
            <button
              v-for="(img, idx) in product.images"
              :key="idx"
              @click="selectProductImage(img)"
              class="w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-slate-50"
              :class="[selectedImage === img ? 'border-[#dc2626]' : 'border-transparent opacity-70 hover:opacity-100']"
            >
              <img v-if="!brokenImages[img]" :src="img" @error="handleImageError(img)" class="w-full h-full object-contain" />
              <div v-else :class="`w-full h-full ${getProductPlaceholder(product ? product.name : '').gradient} flex items-center justify-center text-white text-[10px] font-bold`">
                Ảnh {{ idx + 1 }}
              </div>
            </button>
          </div>
        </div>

        <!-- Meta and Actions -->
        <div class="space-y-6">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Thương hiệu: {{ product.brand || 'Khác' }}</span>
              <span>•</span>
              <span>Mã SKU: {{ product.sku }}</span>
            </div>
            <div class="flex items-start justify-between gap-4">
              <h1 class="text-2xl md:text-3xl font-black text-slate-900 leading-tight flex-1">
                {{ product.name }}
              </h1>
              <button
                @click="onWishlistToggle"
                class="w-10 h-10 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-500 hover:text-red-500 hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer flex-shrink-0"
                :title="isWishlisted ? 'Xóa khỏi danh sách yêu thích' : 'Lưu sản phẩm yêu thích'"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  :fill="isWishlisted ? '#dc2626' : 'none'"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                  :stroke="isWishlisted ? '#dc2626' : 'currentColor'"
                  class="w-5 h-5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                  />
                </svg>
              </button>
            </div>
            <div class="flex items-center gap-4 text-sm mt-2">
              <div class="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-lg">
                <span class="font-bold text-yellow-700">{{ averageRating }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-yellow-500">
                  <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
                </svg>
              </div>
              <span class="text-slate-400">|</span>
              <span class="text-slate-500 font-medium">Đã bán {{ product.sold }}</span>
              <span class="text-slate-400">|</span>
              <span :class="[product.stock > 0 ? 'text-green-600' : 'text-red-600', 'font-semibold']">
                {{ product.stock > 0 ? `Còn hàng (${product.stock} ${product.unit || 'cái'})` : 'Hết hàng' }}
              </span>
            </div>
          </div>

          <!-- Price Block -->
          <div class="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between">
            <div class="space-y-1">
              <template v-if="product.discountPrice > 0">
                <div class="flex items-baseline gap-3">
                  <span class="text-3xl font-black text-[#dc2626]">{{ formatCurrency(product.discountPrice) }}</span>
                  <span class="text-slate-400 line-through text-sm font-medium">{{ formatCurrency(product.price) }}</span>
                </div>
                <p class="text-xs text-red-500 font-bold">
                  Tiết kiệm {{ formatCurrency(product.price - product.discountPrice) }} (-{{ getDiscountPercent(product.price, product.discountPrice) }}%)
                </p>
              </template>
              <template v-else>
                <span class="text-3xl font-black text-slate-800">{{ formatCurrency(product.price) }}</span>
              </template>
            </div>
          </div>

          <!-- Combo Bundle List -->
          <div v-if="categoryDetail && categoryDetail.products && categoryDetail.products.length > 0 && categoryDetail.comboPrice" class="border-2 border-[#dc2626]/20 rounded-2xl p-5 bg-[#dc2626]/5 space-y-4">
            <h3 class="text-sm font-black text-slate-800 tracking-wide flex items-center gap-1.5">
              <span class="text-[#dc2626]">🎁</span> Các sản phẩm đi kèm trong Combo:
            </h3>
            
            <div class="space-y-3">
              <div v-for="item in (showAllComboProducts ? categoryDetail.products : categoryDetail.products.slice(0, 5))" :key="item._id" class="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-100 shadow-xs">
                <img 
                  :src="item.images && item.images[0] ? item.images[0] : 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=100'" 
                  class="w-12 h-12 object-cover rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0"
                  alt="Combo member thumbnail"
                />
                <div class="min-w-0 flex-1">
                  <div class="text-xs font-bold text-slate-800 truncate">{{ item.name }}</div>
                  <div class="text-[10px] text-slate-400 font-medium">Thương hiệu: {{ item.brand || 'Khác' }}</div>
                </div>
                <div class="text-right">
                  <div class="text-xs font-black text-slate-900">{{ formatCurrency(item.discountPrice || item.price) }}</div>
                  <div v-if="item.discountPrice" class="text-[9px] text-slate-400 line-through">{{ formatCurrency(item.price) }}</div>
                </div>
              </div>
            </div>

            <!-- Expand/Collapse Toggle Button -->
            <div v-if="categoryDetail.products.length > 5" class="flex justify-center pt-1 border-t border-slate-100/50">
              <button 
                type="button"
                @click="showAllComboProducts = !showAllComboProducts"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold text-[#dc2626] hover:bg-[#dc2626]/5 active:scale-95 transition-all cursor-pointer focus:outline-none"
              >
                <span>{{ showAllComboProducts ? 'Thu gọn danh sách' : `Xem thêm ${categoryDetail.products.length - 5} sản phẩm` }}</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke-width="2.5" 
                  stroke="currentColor" 
                  class="w-3.5 h-3.5 transition-transform duration-300"
                  :class="{ 'rotate-180': showAllComboProducts }"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>
            
            <div class="pt-3 border-t border-dashed border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
              <div class="font-medium text-slate-600">
                Tổng giá bán lẻ: <span class="line-through text-slate-400 font-bold">{{ formatCurrency(comboRetailTotal) }}</span>
              </div>
              <div class="bg-[#dc2626] text-white font-extrabold px-3 py-1 rounded-full text-[10px] tracking-wide uppercase">
                Tiết kiệm {{ formatCurrency(comboSavings) }} (-{{ comboSavingsPercent }}%)
              </div>
            </div>
          </div>

          <!-- Quantity Selector -->
          <div class="space-y-3">
            <span class="text-sm font-bold text-slate-700">Số lượng</span>
            <div class="flex items-center gap-3">
              <div class="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                <button
                  @click="changeQuantity(-1)"
                  :disabled="quantity <= 1"
                  class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white text-slate-500 font-bold transition-colors disabled:opacity-50"
                >
                  -
                </button>
                <input
                  v-model.number="quantity"
                  type="number"
                  min="1"
                  :max="product.stock"
                  class="w-14 text-center bg-transparent border-none focus:outline-none font-bold text-slate-800 text-sm"
                  @change="validateQuantity"
                />
                <button
                  @click="changeQuantity(1)"
                  :disabled="quantity >= product.stock"
                  class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white text-slate-500 font-bold transition-colors disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4 pt-4">
            <button
              @click="addToCart()"
              :disabled="product.stock === 0"
              class="flex-1 bg-white hover:bg-slate-50 text-[#dc2626] border-2 border-[#dc2626] font-bold py-3.5 px-4 rounded-2xl transition-colors flex items-center justify-center gap-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-300 disabled:cursor-not-allowed text-sm uppercase tracking-wider cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
              Thêm vào giỏ hàng
            </button>
            <button
              @click="buyNow()"
              :disabled="product.stock === 0"
              class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed text-sm uppercase tracking-wider cursor-pointer"
            >
              {{ categoryDetail && categoryDetail.comboPrice ? 'Mua trọn bộ Combo' : 'Mua ngay' }}
            </button>
          </div>

          <!-- Back in Stock Alert Subscription -->
          <div v-if="product.stock === 0" class="border border-amber-200 rounded-2xl p-5 bg-amber-50/40 space-y-3 shadow-xs">
            <div class="flex items-center gap-2 text-amber-700 text-xs font-black uppercase tracking-wider">
              <span>🔔</span> Nhận thông báo khi có hàng
            </div>
            <p class="text-xs text-slate-500 leading-relaxed font-medium">
              Sản phẩm này hiện tại đang tạm hết hàng. Vui lòng để lại email của bạn, chúng tôi sẽ tự động gửi thư thông báo ngay khi có hàng trở lại!
            </p>
            <form @submit.prevent="handleStockAlertSubscribe" class="flex gap-2">
              <input
                v-model="stockAlertEmail"
                type="email"
                placeholder="Nhập email nhận thông báo..."
                class="flex-grow bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626]/80 text-slate-700 font-bold"
                required
              />
              <button
                type="submit"
                class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm flex-shrink-0 active:scale-95"
              >
                Đăng ký
              </button>
            </form>
          </div>

          <!-- Share buttons -->
          <div class="border border-slate-200 rounded-2xl p-5 bg-white space-y-3 shadow-xs">
            <h3 class="text-xs font-black text-slate-800 uppercase tracking-wider">
              Chia sẻ sản phẩm
            </h3>
            <div class="flex flex-wrap gap-2.5">
              <button 
                @click="shareOnFacebook"
                class="bg-[#1877F2] text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95 transition-all"
              >
                <span>📘</span> Facebook
              </button>
              <button 
                @click="shareOnZalo"
                class="bg-[#0068ff] text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95 transition-all"
              >
                <span>💬</span> Zalo
              </button>
              <button 
                @click="copyProductLink"
                class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <span>🔗</span> Sao chép link
              </button>
            </div>
          </div>

          <!-- Chính sách ưu đãi của Trường Thanh -->
          <div class="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 shadow-xs">
            <h3 class="text-sm font-extrabold text-slate-800 tracking-wide">
              Chính sách ưu đãi của Trường Thanh
            </h3>
            <div class="divide-y divide-slate-100">
              <!-- Item 1: Vận chuyển -->
              <button 
                @click="activePolicy = 'delivery'"
                class="w-full flex items-center justify-between py-3 text-left hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors group focus:outline-none"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM19.5 18.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m-7.487-9h-1.11a2 2 0 0 0-1.872 1.302l-.994 2.98a2 2 0 0 0-1.872 1.302v4.416a.75.75 0 0 0 .75.75h.588M19.5 12h-3.076M19.5 12V9.382a2 2 0 0 0-1.106-1.79l-2.472-1.236A2 2 0 0 0 15 6.223V12m4.5 0v3.75m-4.5-3.75h-3m3 3.75h-3.076" />
                    </svg>
                  </div>
                  <div class="text-sm">
                    <span class="font-bold text-slate-700">Thời gian giao hàng: </span>
                    <span class="text-slate-600">Giao nhanh và uy tín</span>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              <!-- Item 2: Đổi trả -->
              <button 
                @click="activePolicy = 'return'"
                class="w-full flex items-center justify-between py-3 text-left hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors group focus:outline-none"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                  </div>
                  <div class="text-sm">
                    <span class="font-bold text-slate-700">Chính sách đổi trả: </span>
                    <span class="text-slate-600">Đổi trả miễn phí toàn quốc</span>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              <!-- Item 3: Khách sỉ -->
              <button 
                @click="activePolicy = 'wholesale'"
                class="w-full flex items-center justify-between py-3 text-left hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors group focus:outline-none"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.015a2.993 2.993 0 0 0 2.25 1.015c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                    </svg>
                  </div>
                  <div class="text-sm">
                    <span class="font-bold text-slate-700">Chính sách khách sỉ: </span>
                    <span class="text-slate-600">Ưu đãi khi mua số lượng lớn</span>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Description Block -->
      <div class="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
        <h2 class="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-4 mb-6">Mô tả sản phẩm</h2>
        <div 
          class="prose max-w-none text-slate-600 text-sm leading-relaxed" 
          v-html="parseMarkdown(product.description || 'Chưa có thông tin mô tả chi tiết cho sản phẩm này.')"
        ></div>
      </div>

      <!-- Product Specifications Block -->
      <div class="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
        <h2 class="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
          <span>📋</span> Thông tin chi tiết & Thông số kỹ thuật
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm">
          <div v-if="product.author" class="flex py-2.5 border-b border-slate-100/70">
            <span class="w-1/3 text-slate-400 font-medium">Tác giả</span>
            <span class="w-2/3 text-slate-800 font-bold text-red-600">{{ product.author }}</span>
          </div>
          <div v-if="product.publisher" class="flex py-2.5 border-b border-slate-100/70">
            <span class="w-1/3 text-slate-400 font-medium">Nhà xuất bản</span>
            <span class="w-2/3 text-slate-800 font-semibold">{{ product.publisher }}</span>
          </div>
          <div v-if="product.publicationYear" class="flex py-2.5 border-b border-slate-100/70">
            <span class="w-1/3 text-slate-400 font-medium">Năm xuất bản</span>
            <span class="w-2/3 text-slate-800 font-semibold">{{ product.publicationYear }}</span>
          </div>
          <div v-if="product.isbn" class="flex py-2.5 border-b border-slate-100/70">
            <span class="w-1/3 text-slate-400 font-medium">Mã ISBN</span>
            <span class="w-2/3 text-slate-800 font-mono font-semibold">{{ product.isbn }}</span>
          </div>
          <div class="flex py-2.5 border-b border-slate-100/70">
            <span class="w-1/3 text-slate-400 font-medium">Thương hiệu</span>
            <span class="w-2/3 text-slate-800 font-semibold">{{ product.brand || 'Khác' }}</span>
          </div>
          <div class="flex py-2.5 border-b border-slate-100/70">
            <span class="w-1/3 text-slate-400 font-medium">Mã SKU</span>
            <span class="w-2/3 text-slate-800 font-mono font-semibold">{{ product.sku }}</span>
          </div>
          <div class="flex py-2.5 border-b border-slate-100/70">
            <span class="w-1/3 text-slate-400 font-medium">Danh mục</span>
            <span class="w-2/3 text-slate-800 font-semibold">{{ typeof product.category === 'object' && product.category ? product.category.name : 'Văn phòng phẩm' }}</span>
          </div>
          <div class="flex py-2.5 border-b border-slate-100/70">
            <span class="w-1/3 text-slate-400 font-medium">Đơn vị tính</span>
            <span class="w-2/3 text-slate-800 font-semibold">{{ product.unit || 'Quyển/Cái' }}</span>
          </div>
          <div class="flex py-2.5 border-b border-slate-100/70">
            <span class="w-1/3 text-slate-400 font-medium">Tình trạng kho</span>
            <span :class="[product.stock > 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold']" class="w-2/3">
              {{ product.stock > 0 ? `Còn hàng (${product.stock} ${product.unit || 'cái'})` : 'Tạm hết hàng' }}
            </span>
          </div>
          <div class="flex py-2.5 border-b border-slate-100/70">
            <span class="w-1/3 text-slate-400 font-medium">Xuất xứ</span>
            <span class="w-2/3 text-slate-800 font-semibold">Việt Nam</span>
          </div>
          <div class="flex py-2.5 border-b border-slate-100/70">
            <span class="w-1/3 text-slate-400 font-medium">Nhà phân phối</span>
            <span class="w-2/3 text-slate-800 font-semibold">Trường Thành Bookstore</span>
          </div>
        </div>
      </div>

      <!-- Reviews & Ratings Section -->
      <div class="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-8">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 class="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span>⭐</span> Đánh giá & Nhận xét từ khách hàng
            </h2>
            <p class="text-xs text-slate-400 mt-0.5 font-medium">Đánh giá trung thực từ người mua hàng thực tế</p>
          </div>
          <button 
            v-if="authStore.isAuthenticated"
            @click="showReviewForm = !showReviewForm" 
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {{ showReviewForm ? 'Đóng form' : '+ Viết đánh giá' }}
          </button>
        </div>

        <!-- Rating Stats -->
        <div class="rating-stats-panel grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
          <div class="md:col-span-4 text-center space-y-2 md:border-r border-slate-200/80 py-2">
            <div class="text-5xl font-black text-slate-800">{{ averageRating }} <span class="text-2xl text-slate-400 font-medium">/ 5</span></div>
            <div class="flex justify-center gap-1">
              <svg 
                v-for="star in 5" 
                :key="star"
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                class="w-5 h-5"
                :class="star <= Math.round(averageRating) ? 'text-yellow-500' : 'text-slate-200'"
              >
                <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
              </svg>
            </div>
            <p class="text-xs text-slate-500 font-bold">Dựa trên {{ reviews.length }} lượt đánh giá</p>
          </div>

          <div class="md:col-span-8 space-y-2">
            <div 
              v-for="ratingVal in [5, 4, 3, 2, 1]" 
              :key="ratingVal"
              class="flex items-center gap-3 text-xs"
            >
              <span class="w-12 text-right text-slate-600 font-bold flex items-center justify-end gap-1">
                {{ ratingVal }} <span class="text-yellow-500">★</span>
              </span>
              <div class="flex-1 h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-yellow-500 rounded-full transition-all duration-500"
                  :style="{ width: `${ratingStats[ratingVal].percent}%` }"
                ></div>
              </div>
              <span class="w-16 text-slate-500 font-semibold">{{ ratingStats[ratingVal].count }} ({{ Math.round(ratingStats[ratingVal].percent) }}%)</span>
            </div>
          </div>
        </div>

        <!-- Star Filter Tabs -->
        <div class="flex flex-wrap items-center gap-2 pt-2 border-b border-slate-100 pb-4">
          <span class="text-xs font-bold text-slate-500 mr-2">Lọc theo số sao:</span>
          <button
            @click="selectedRatingFilter = null"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            :class="[selectedRatingFilter === null ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
          >
            Tất cả ({{ reviews.length }})
          </button>
          <button
            v-for="star in [5, 4, 3, 2, 1]"
            :key="star"
            @click="selectedRatingFilter = star"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            :class="[selectedRatingFilter === star ? 'bg-yellow-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
          >
            <span>{{ star }}</span>
            <span>★</span>
            <span class="text-[10px] opacity-80">({{ ratingStats[star].count }})</span>
          </button>
        </div>

        <!-- Write Review Form -->
        <div v-if="showReviewForm && authStore.isAuthenticated" class="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <h3 class="text-sm font-extrabold text-slate-800">Đánh giá của bạn về sản phẩm này</h3>
          
          <!-- Rating Star Selector -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500 font-medium">Chọn mức đánh giá:</span>
            <div class="flex gap-1.5">
              <button 
                v-for="star in 5" 
                :key="star"
                type="button"
                @click="newReviewRating = star"
                class="hover:scale-110 transition-transform focus:outline-none cursor-pointer"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  class="w-7 h-7"
                  :class="star <= newReviewRating ? 'text-yellow-500' : 'text-slate-300'"
                >
                  <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
            <span class="text-xs font-bold text-yellow-600 ml-2">
              {{ newReviewRating === 5 ? 'Tuyệt vời' : newReviewRating === 4 ? 'Hài lòng' : newReviewRating === 3 ? 'Bình thường' : newReviewRating === 2 ? 'Không hài lòng' : 'Rất tệ' }}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Tên hiển thị *</label>
              <input 
                v-model="newReviewName" 
                type="text" 
                placeholder="Nhập họ và tên hiển thị..."
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white text-sm"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Nội dung nhận xét chi tiết *</label>
            <textarea 
              v-model="newReviewContent" 
              rows="3"
              placeholder="Chia sẻ cảm nhận, chất lượng đóng gói và độ hoàn thiện của sản phẩm..."
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white text-sm"
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button 
              type="button"
              @click="showReviewForm = false"
              class="px-5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button 
              type="button"
              @click="submitReview"
              class="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2 rounded-xl text-xs transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              Gửi đánh giá
            </button>
          </div>
        </div>

        <!-- Prompt to Login -->
        <div v-if="!authStore.isAuthenticated" class="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center space-y-3">
          <p class="text-sm font-medium text-slate-600">Quý khách vui lòng đăng nhập tài khoản để gửi đánh giá và nhận xét sản phẩm.</p>
          <router-link to="/login" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer">
            Đăng nhập ngay
          </router-link>
        </div>

        <!-- Reviews List -->
        <div class="space-y-6 divide-y divide-slate-100">
          <div 
            v-for="(rev, idx) in displayedReviews" 
            :key="rev._id || rev.id || idx"
            class="pt-6 first:pt-0 space-y-3"
          >
            <!-- Regular Mode -->
            <div v-if="editingReviewId !== (rev._id || rev.id)" class="space-y-2">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center font-black text-slate-700 text-sm border border-slate-200">
                    {{ rev.name ? rev.name.charAt(0).toUpperCase() : 'U' }}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h4 class="text-sm font-extrabold text-slate-800">{{ rev.name || 'Khách hàng' }}</h4>
                      <span class="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200/60 px-2 py-0.5 rounded-full">
                        <span>✓</span> Đã mua hàng
                      </span>
                    </div>
                    <div class="flex items-center gap-2 mt-0.5">
                      <div class="flex gap-0.5">
                        <svg 
                          v-for="star in 5" 
                          :key="star"
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="currentColor" 
                          class="w-3.5 h-3.5"
                          :class="star <= rev.rating ? 'text-yellow-500' : 'text-slate-200'"
                        >
                          <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
                        </svg>
                      </div>
                      <span class="text-[11px] text-slate-400">• {{ formatDate(rev.createdAt) }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <div v-if="canModifyReview(rev)" class="flex items-center gap-1.5">
                    <button 
                      @click="startEditReview(rev)"
                      class="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg cursor-pointer focus:outline-none"
                    >
                      Sửa
                    </button>
                    <button 
                      @click="deleteReview(rev._id || rev.id)"
                      class="text-xs font-bold text-red-600 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg cursor-pointer focus:outline-none"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
              <p class="text-sm text-slate-700 leading-relaxed pl-12">
                {{ rev.content }}
              </p>

              <!-- Admin Reply Badge -->
              <div v-if="rev.adminReply" class="mt-3 ml-12 p-3.5 bg-red-50/60 rounded-xl border border-red-100/80 text-xs space-y-1">
                <div class="flex items-center gap-1.5 font-extrabold text-[#dc2626]">
                  <span>💬 Phản hồi từ Cửa hàng Trường Thành</span>
                </div>
                <p class="text-slate-700 font-medium leading-relaxed">{{ rev.adminReply }}</p>
              </div>
            </div>

            <!-- Edit Mode Inline -->
            <div v-else class="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4 pl-12">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-extrabold text-slate-800">Chỉnh sửa đánh giá</h4>
                <!-- Star Rating Selector -->
                <div class="flex items-center gap-1.5">
                  <button 
                    v-for="star in 5" 
                    :key="star"
                    type="button"
                    @click="editReviewRating = star"
                    class="hover:scale-110 transition-transform focus:outline-none cursor-pointer"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="currentColor" 
                      class="w-5 h-5"
                      :class="star <= editReviewRating ? 'text-yellow-500' : 'text-slate-300'"
                    >
                      <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-xs font-bold text-slate-700">Tên hiển thị</label>
                  <input 
                    v-model="editReviewName" 
                    type="text" 
                    placeholder="Nhập tên của bạn"
                    class="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white text-sm"
                  />
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-700">Nội dung đánh giá</label>
                <textarea 
                  v-model="editReviewContent" 
                  rows="2"
                  placeholder="Nhập nội dung đánh giá..."
                  class="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white text-sm"
                ></textarea>
              </div>

              <div class="flex justify-end gap-3 pt-1">
                <button 
                  type="button"
                  @click="cancelEditReview"
                  class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  type="button"
                  @click="saveEditReview"
                  class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
          <div v-if="displayedReviews.length === 0" class="text-center py-8 text-slate-400 text-sm">
            <span v-if="selectedRatingFilter">Không có đánh giá nào cho mức {{ selectedRatingFilter }} sao.</span>
            <span v-else>Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên đánh giá!</span>
          </div>
        </div>
      </div>

      <!-- Recommended / Related Products -->
      <section v-if="relatedProducts.length > 0" class="overflow-hidden border border-emerald-200/60 rounded-3xl shadow-xs">
        <!-- Header Banner -->
        <div class="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-8 py-5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-white animate-pulse">
              <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
            </svg>
            <h2 class="text-lg font-black text-white uppercase tracking-wider">Sản phẩm liên quan & Gợi ý cho bạn</h2>
          </div>
          <router-link 
            :to="product.category ? `/products?category=${typeof product.category === 'object' ? product.category._id : product.category}` : '/products'" 
            class="text-xs font-bold text-white/90 hover:text-white underline hover:no-underline"
          >
            Xem tất cả →
          </router-link>
        </div>

        <!-- Content Grid -->
        <div class="bg-emerald-50/5 p-6 md:p-8">
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <ProductCard
              v-for="related in relatedProducts"
              :key="related._id"
              :product="related"
              @add-to-cart="addToCart"
            />
          </div>
        </div>
      </section>
    </div>

    <!-- Policy Detail Modal -->
    <div 
      v-if="activePolicy" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      @click.self="activePolicy = null"
    >
      <div 
        class="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
      >
        <!-- Modal Header -->
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-lg font-black text-slate-900">
            {{ policyDetails[activePolicy].title }}
          </h3>
          <button 
            @click="activePolicy = null" 
            class="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Content -->
        <div class="p-6 space-y-6">
          <p class="text-sm text-slate-500 italic leading-relaxed">
            {{ policyDetails[activePolicy].description }}
          </p>

          <div class="space-y-4">
            <div 
              v-for="(item, index) in policyDetails[activePolicy].items" 
              :key="index"
              class="flex gap-4"
            >
              <div class="w-6 h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                {{ index + 1 }}
              </div>
              <div class="space-y-1">
                <h4 class="text-sm font-extrabold text-slate-800">{{ item.title }}</h4>
                <p class="text-xs text-slate-600 leading-relaxed">{{ item.content }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            @click="activePolicy = null" 
            class="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors focus:outline-none"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>

    <!-- Image Lightbox Modal -->
    <div 
      v-if="isLightboxOpen && product && product.images && product.images.length > 0"
      class="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md transition-all select-none"
      @click.self="closeLightbox"
    >
      <!-- Top controls bar -->
      <div class="w-full max-w-5xl flex items-center justify-between text-white pb-3 px-2">
        <div class="text-xs font-bold text-slate-300">
          Ảnh {{ activeLightboxIndex + 1 }} / {{ product.images.length }} • {{ product.name }}
        </div>
        <button 
          @click="closeLightbox"
          class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Đóng (ESC)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Main Display -->
      <div class="relative w-full max-w-4xl max-h-[75vh] flex items-center justify-center">
        <!-- Prev Button -->
        <button 
          v-if="product.images.length > 1"
          @click="prevLightboxImage"
          class="absolute left-2 z-10 w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        <!-- Current Zoomed Image -->
        <img 
          :src="product.images[activeLightboxIndex]" 
          :alt="product.name" 
          class="max-h-[72vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-300"
        />

        <!-- Next Button -->
        <button 
          v-if="product.images.length > 1"
          @click="nextLightboxImage"
          class="absolute right-2 z-10 w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      <!-- Bottom Thumbnails Strip -->
      <div v-if="product.images.length > 1" class="flex gap-2.5 mt-4 overflow-x-auto max-w-xl py-2 px-4 bg-white/5 rounded-2xl backdrop-blur-xs border border-white/10">
        <button
          v-for="(thumb, tIdx) in product.images"
          :key="tIdx"
          @click="activeLightboxIndex = tIdx"
          class="w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-white/10 cursor-pointer"
          :class="[activeLightboxIndex === tIdx ? 'border-red-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100']"
        >
          <img :src="thumb" class="w-full h-full object-contain p-1" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { productService } from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import ProductCard from '@/components/ProductCard.vue'
import { formatCurrency, getDiscountPercent, parseMarkdown } from '@/utils/helpers'
import type { Product, Category } from '@/types'
import { useSeoMeta } from '@/composables/useSeoMeta'
import { useProductSchema } from '@/composables/useStructuredData'
import Breadcrumb from '@/components/Breadcrumb.vue'

const route = useRoute()
const router = useRouter()
const showAllComboProducts = ref(false)

const breadcrumbItems = computed(() => {
  const items = [
    { label: 'Trang chủ', to: '/' },
    { label: 'Sản phẩm', to: '/products' }
  ]
  if (product.value) {
    if (typeof product.value.category === 'object' && product.value.category) {
      items.push({
        label: product.value.category.name,
        to: `/products?category=${product.value.category._id}`
      })
    } else if (categoryDetail.value) {
      items.push({
        label: categoryDetail.value.name,
        to: `/products?category=${categoryDetail.value._id}`
      })
    }
    items.push({
      label: product.value.name,
      to: `/products/${product.value._id}`
    })
  }
  return items
})
const cartStore = useCartStore()
const authStore = useAuthStore()
const toast = useToast()

function buyNow() {
  if (product.value) {
    cartStore.addToCart(product.value, quantity.value)
    router.push('/cart')
  }
}

// Wishlist toggle
const isWishlisted = computed(() => {
  if (!authStore.isAuthenticated || !authStore.user?.wishlist || !product.value) return false
  return authStore.user.wishlist.includes(product.value._id)
})

async function onWishlistToggle() {
  if (!authStore.isAuthenticated) {
    toast.info('Vui lòng đăng nhập để lưu sản phẩm yêu thích!')
    return
  }
  if (!product.value) return
  const success = await authStore.toggleWishlist(product.value._id)
  if (success) {
    if (isWishlisted.value) {
      toast.success('Đã thêm vào danh sách yêu thích!')
    } else {
      toast.success('Đã xóa khỏi danh sách yêu thích!')
    }
  }
}

// Sharing functions
function shareOnFacebook() {
  const url = encodeURIComponent(window.location.href)
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
}

function shareOnZalo() {
  const url = encodeURIComponent(window.location.href)
  window.open(`https://zalo.me/share?to=&utm_source=&utm_medium=&utm_campaign=&url=${url}`, '_blank')
}

function copyProductLink() {
  navigator.clipboard.writeText(window.location.href)
  toast.success('Đã sao chép liên kết sản phẩm!')
}

// Stock Alert Alert form state
const stockAlertEmail = ref(authStore.user?.email || '')
async function handleStockAlertSubscribe() {
  if (!product.value) return
  try {
    await productService.subscribeStockAlert(product.value._id, stockAlertEmail.value)
    toast.success('Đăng ký nhận thông báo thành công!')
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký nhận thông báo.')
  }
}

const product = ref<Product | null>(null)
const relatedProducts = ref<Product[]>([])
const selectedImage = ref('')
const quantity = ref(1)
const loading = ref(true)
const categoryDetail = ref<Category | null>(null)

useSeoMeta(() => ({
  title: product.value?.name || 'Chi tiết sản phẩm',
  description:
    product.value?.description ||
    'Sản phẩm chính hãng tại Trường Thành Stationery. Giá tốt, giao hàng nhanh.',
  ogImage: product.value?.images?.[0] || '',
  ogType: 'product',
}))

useProductSchema({
  get name() { return product.value?.name || '' },
  get description() { return product.value?.description },
  get image() { return product.value?.images?.[0] },
  get sku() { return product.value?.sku || '' },
  get brand() { return product.value?.brand },
  get price() { return product.value?.price || 0 },
  get discountPrice() { return product.value?.discountPrice },
  get stock() { return product.value?.stock || 0 },
  get rating() { return product.value?.rating },
})

const comboRetailTotal = computed(() => {
  if (!categoryDetail.value || !categoryDetail.value.products || !categoryDetail.value.products.length) return 0
  if (!categoryDetail.value.comboPrice) return 0
  return categoryDetail.value.products.reduce((sum: number, p: any) => {
    return sum + (p.discountPrice || p.price || 0)
  }, 0)
})

const comboSavings = computed(() => {
  if (!product.value || comboRetailTotal.value === 0) return 0
  const comboPrice = product.value.discountPrice || product.value.price
  return Math.max(0, comboRetailTotal.value - comboPrice)
})

const comboSavingsPercent = computed(() => {
  if (comboRetailTotal.value === 0 || comboSavings.value === 0) return 0
  return Math.round((comboSavings.value / comboRetailTotal.value) * 100)
})

// Autoplay slideshow for ProductDetail page images
let autoplayInterval: any = null

function startAutoplay() {
  stopAutoplay()
  if (product.value?.images && product.value.images.length > 1) {
    autoplayInterval = setInterval(() => {
      const prod = product.value
      if (!prod || !prod.images) return
      const idx = prod.images.indexOf(selectedImage.value)
      const nextIdx = (idx + 1) % prod.images.length
      selectedImage.value = prod.images[nextIdx]
    }, 3800) // switch product image every 3.8s
  }
}

function stopAutoplay() {
  if (autoplayInterval) {
    clearInterval(autoplayInterval)
    autoplayInterval = null
  }
}

function selectProductImage(img: string) {
  selectedImage.value = img
  startAutoplay()
}

const activePolicy = ref<'delivery' | 'return' | 'wholesale' | null>(null)

const policyDetails = {
  delivery: {
    title: 'Chính sách vận chuyển & giao hàng',
    description: 'Trường Thanh Bookstore cam kết mang đến dịch vụ giao hàng nhanh chóng, an toàn và uy tín nhất cho khách hàng.',
    items: [
      {
        title: 'Giao hàng hỏa tốc',
        content: 'Hỗ trợ giao hàng siêu tốc trong vòng 2h - 4h đối với các khu vực lân cận và nội thành.'
      },
      {
        title: 'Giao hàng toàn quốc',
        content: 'Hợp tác cùng các đơn vị vận chuyển uy tín (Giao Hàng Nhanh, Viettel Post...) giao tận tay khách hàng từ 2 - 4 ngày làm việc.'
      },
      {
        title: 'Bảo đảm hàng hóa',
        content: 'Sản phẩm được đóng gói 3 lớp chống sốc, bảo vệ bìa sách và sản phẩm văn phòng phẩm không bị móp méo.'
      },
      {
        title: 'Theo dõi hành trình',
        content: 'Mã vận đơn được gửi qua email/số điện thoại giúp quý khách dễ dàng tra cứu vị trí đơn hàng mọi lúc mọi nơi.'
      }
    ]
  },
  return: {
    title: 'Chính sách đổi trả miễn phí',
    description: 'Chúng tôi hiểu rằng sự hài lòng của khách hàng là ưu tiên hàng đầu. Bạn có thể dễ dàng đổi trả sản phẩm theo quy định dưới đây.',
    items: [
      {
        title: 'Đổi trả miễn phí 7 ngày',
        content: 'Áp dụng cho mọi sản phẩm phát hiện lỗi của nhà sản xuất, rách hỏng trong quá trình vận chuyển hoặc giao sai mẫu mã.'
      },
      {
        title: 'Điều kiện đơn giản',
        content: 'Sản phẩm chưa qua sử dụng, giữ nguyên bao bì, nhãn mác ban đầu và kèm theo hóa đơn/thông tin mua hàng.'
      },
      {
        title: 'Hoàn tiền nhanh chóng',
        content: 'Thực hiện hoàn tiền qua tài khoản ngân hàng hoặc đổi sản phẩm mới thay thế trong vòng 2-3 ngày làm việc sau khi nhận được hàng hoàn trả.'
      }
    ]
  },
  wholesale: {
    title: 'Chính sách ưu đãi khách sỉ',
    description: 'Chương trình chiết khấu và ưu đãi đặc biệt dành cho khách hàng mua số lượng lớn, đại lý, trường học và doanh nghiệp.',
    items: [
      {
        title: 'Chiết khấu hấp dẫn',
        content: 'Hưởng mức chiết khấu cực cao lên tới 15% - 35% trên tổng giá trị đơn hàng tùy theo số lượng và phân loại sản phẩm.'
      },
      {
        title: 'Tư vấn dự án',
        content: 'Cung cấp báo giá nhanh chóng trong 15 phút, hỗ trợ chọn lọc combo văn phòng phẩm, quà tặng, sách giáo khoa phù hợp ngân sách.'
      },
      {
        title: 'Hồ sơ pháp lý đầy đủ',
        content: 'Hỗ trợ xuất hóa đơn tài chính (VAT), làm hợp đồng mua bán, biên bản bàn giao đầy đủ theo quy định của pháp luật.'
      },
      {
        title: 'Hỗ trợ vận chuyển',
        content: 'Miễn phí hoặc hỗ trợ phí vận chuyển tận kho/địa chỉ nhận hàng cho các đơn hàng sỉ giá trị lớn.'
      }
    ]
  }
}

const brokenImages = ref<Record<string, boolean>>({})
function handleImageError(imgUrl: string) {
  brokenImages.value[imgUrl] = true
}

interface Review {
  _id?: string
  id?: string
  user?: string
  userId?: string
  name: string
  rating: number
  content: string
  createdAt: string
  isVerifiedPurchase?: boolean
  adminReply?: string
  adminReplyAt?: string
  images?: string[]
}

const reviews = ref<Review[]>([])
const newReviewName = ref('')
const newReviewRating = ref(5)
const newReviewContent = ref('')
const showReviewForm = ref(false)

watch(showReviewForm, (newVal) => {
  if (newVal && authStore.isAuthenticated && authStore.user) {
    newReviewName.value = authStore.user.fullName || ''
  }
})

// Edit comment states
const editingReviewId = ref<string | null>(null)
const editReviewName = ref('')
const editReviewRating = ref(5)
const editReviewContent = ref('')

function formatDate(dateStr: any): string {
  if (!dateStr) return ''
  // Support both local format and ISO string
  if (typeof dateStr === 'string' && dateStr.includes('/')) return dateStr
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

function canModifyReview(review: Review): boolean {
  if (authStore.isAdmin) return true
  
  const currentUserId = authStore.user?._id
  const reviewUserId = review.user || review.userId
  return !!currentUserId && reviewUserId === currentUserId
}

function startEditReview(review: Review) {
  editingReviewId.value = review._id || review.id || null
  editReviewName.value = review.name
  editReviewRating.value = review.rating
  editReviewContent.value = review.content
}

function cancelEditReview() {
  editingReviewId.value = null
  editReviewName.value = ''
  editReviewRating.value = 5
  editReviewContent.value = ''
}

async function saveEditReview() {
  if (!editReviewContent.value.trim()) {
    toast.warning('Vui lòng nhập nội dung đánh giá')
    return
  }

  const prodId = route.params.id as string
  try {
    const res = await productService.updateReview(prodId, editingReviewId.value!, {
      rating: editReviewRating.value,
      content: editReviewContent.value
    })
    const index = reviews.value.findIndex(r => (r._id || r.id) === editingReviewId.value)
    if (index !== -1) {
      reviews.value[index] = res.data
    }
    toast.success('Đã cập nhật đánh giá!')
    cancelEditReview()
  } catch (err) {
    toast.error('Có lỗi xảy ra khi cập nhật đánh giá')
  }
}

async function deleteReview(reviewId?: string) {
  if (!reviewId) return
  const prodId = route.params.id as string
  try {
    await productService.deleteReview(prodId, reviewId)
    reviews.value = reviews.value.filter(r => (r._id || r.id) !== reviewId)
    toast.success('Đã xóa đánh giá!')
  } catch (err) {
    toast.error('Có lỗi xảy ra khi xóa đánh giá')
  }
}

async function loadReviews() {
  const prodId = route.params.id as string
  try {
    const res = await productService.getReviews(prodId)
    reviews.value = res.data
  } catch (err) {
    console.error('Error loading reviews:', err)
  }
}

const averageRating = computed(() => {
  if (reviews.value.length === 0) return 5
  const sum = reviews.value.reduce((acc, r) => acc + r.rating, 0)
  return Math.round((sum / reviews.value.length) * 10) / 10
})

const ratingStats = computed(() => {
  const stats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.value.forEach(r => {
    const rate = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5
    if (stats[rate] !== undefined) {
      stats[rate]++
    }
  })
  
  const total = reviews.value.length || 1
  return {
    5: { count: stats[5], percent: (stats[5] / total) * 100 },
    4: { count: stats[4], percent: (stats[4] / total) * 100 },
    3: { count: stats[3], percent: (stats[3] / total) * 100 },
    2: { count: stats[2], percent: (stats[2] / total) * 100 },
    1: { count: stats[1], percent: (stats[1] / total) * 100 }
  }
})

const selectedRatingFilter = ref<number | null>(null)
const displayedReviews = computed(() => {
  if (selectedRatingFilter.value === null) return reviews.value
  return reviews.value.filter(r => Math.round(r.rating) === selectedRatingFilter.value)
})

// Lightbox state and methods
const isLightboxOpen = ref(false)
const activeLightboxIndex = ref(0)

function openLightbox(idx = 0) {
  if (!product.value?.images || product.value.images.length === 0) return
  activeLightboxIndex.value = Math.max(0, Math.min(idx, product.value.images.length - 1))
  isLightboxOpen.value = true
  stopAutoplay()
}

function closeLightbox() {
  isLightboxOpen.value = false
  startAutoplay()
}

function nextLightboxImage() {
  if (!product.value?.images || product.value.images.length === 0) return
  activeLightboxIndex.value = (activeLightboxIndex.value + 1) % product.value.images.length
}

function prevLightboxImage() {
  if (!product.value?.images || product.value.images.length === 0) return
  activeLightboxIndex.value = (activeLightboxIndex.value - 1 + product.value.images.length) % product.value.images.length
}

function handleKeydown(e: KeyboardEvent) {
  if (!isLightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  else if (e.key === 'ArrowRight') nextLightboxImage()
  else if (e.key === 'ArrowLeft') prevLightboxImage()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

async function submitReview() {
  if (!authStore.isAuthenticated) {
    toast.error('Vui lòng đăng nhập để đánh giá sản phẩm')
    return
  }
  if (!newReviewContent.value.trim()) {
    toast.warning('Vui lòng viết nội dung đánh giá')
    return
  }

  const prodId = route.params.id as string
  try {
    const res = await productService.addReview(prodId, {
      rating: newReviewRating.value,
      content: newReviewContent.value
    })
    reviews.value.unshift(res.data)
    
    newReviewName.value = ''
    newReviewRating.value = 5
    newReviewContent.value = ''
    showReviewForm.value = false
    
    toast.success('Cảm ơn bạn đã đánh giá sản phẩm!')
  } catch (err) {
    toast.error('Có lỗi xảy ra khi gửi đánh giá')
  }
}

async function loadProduct() {
  loading.value = true
  categoryDetail.value = null
  try {
    const id = route.params.id as string
    const res = await productService.getById(id)
    product.value = res.data
    selectedImage.value = res.data.images?.[0] || ''
    quantity.value = 1
    
    // Load reviews
    loadReviews()
    
    // De-couple main page loader so users can view & purchase the product immediately (UX Optimization)
    loading.value = false
    
    startAutoplay()

    // Fetch category detail asynchronously to check for combo/bundle info
    const catId = typeof res.data.category === 'object' && res.data.category ? res.data.category._id : res.data.category
    if (catId) {
      categoryService.getById(catId).then(catRes => {
        categoryDetail.value = catRes.data
      }).catch(err => {
        console.error('Error loading category detail for combo:', err)
      })
    }
    
    // Fetch related products using dedicated getRelated API with fallback
    productService.getRelated(res.data._id, 10).then((relatedRes: any) => {
      const items = Array.isArray(relatedRes.data) ? relatedRes.data : (relatedRes.data?.data || [])
      relatedProducts.value = items.filter((p: Product) => p._id !== res.data._id)
    }).catch(err => {
      console.warn('Fallback fetching related products via getAll:', err)
      productService.getAll({ category: catId, limit: 11 }).then((fallbackRes: any) => {
        const items = Array.isArray(fallbackRes.data) ? fallbackRes.data : (fallbackRes.data?.data || [])
        relatedProducts.value = items.filter((p: Product) => p._id !== res.data._id)
      })
    })
  } catch (err) {
    toast.error('Lỗi khi tải chi tiết sản phẩm')
    loading.value = false
  }
}

onMounted(loadProduct)
watch(() => route.params.id, (newId) => {
  stopAutoplay()
  loadProduct()
})
onUnmounted(stopAutoplay)

function changeQuantity(val: number) {
  const newQty = quantity.value + val
  if (product.value && newQty >= 1 && newQty <= product.value.stock) {
    quantity.value = newQty
  }
}

function validateQuantity() {
  if (product.value) {
    if (quantity.value < 1) quantity.value = 1
    if (quantity.value > product.value.stock) quantity.value = product.value.stock
  }
}

function addToCart(prod?: Product) {
  if (prod) {
    cartStore.addToCart(prod, 1)
    toast.success(`Đã thêm "${prod.name}" vào giỏ hàng`)
  } else if (product.value) {
    cartStore.addToCart(product.value, quantity.value)
    toast.success(`Đã thêm ${quantity.value} "${product.value.name}" vào giỏ hàng`)
  }
}



function getProductPlaceholder(prodName?: string) {
  const name = (prodName || '').toLowerCase()
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
    icon: 'paint'
  }
}
</script>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-right-enter-from {
  transform: translateX(-30px);
  opacity: 0;
}
.slide-right-leave-to {
  transform: translateX(30px);
  opacity: 0;
}
</style>
