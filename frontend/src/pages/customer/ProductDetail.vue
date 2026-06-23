<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
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
          <div class="aspect-square bg-slate-50/70 rounded-2xl overflow-hidden border border-slate-100 relative flex items-center justify-center">
            <!-- Sliding Track -->
            <div 
              v-if="product && product.images && product.images.length > 0"
              class="flex w-full h-full transition-transform duration-500 ease-in-out"
              :style="{ transform: `translateX(-${Math.max(0, product.images.indexOf(selectedImage)) * 100}%)` }"
            >
              <div 
                v-for="(img, idx) in product.images" 
                :key="idx" 
                class="w-full h-full flex-shrink-0 flex items-center justify-center bg-slate-50/70"
              >
                <img :src="img" class="w-full h-full object-contain" />
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
              <img :src="img" class="w-full h-full object-contain" />
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
            <h1 class="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
              {{ product.name }}
            </h1>
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
                {{ product.stock > 0 ? `Còn hàng (${product.stock})` : 'Hết hàng' }}
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
              Mua ngay
            </button>
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
        <div class="prose max-w-none text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
          {{ product.description || 'Chưa có thông tin mô tả chi tiết cho sản phẩm này.' }}
        </div>
      </div>

      <!-- Product Specifications Block -->
      <div class="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
        <h2 class="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-4">Thông tin sản phẩm</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm">
          <div class="flex py-2 border-b border-slate-100/70">
            <span class="w-1/3 text-slate-400 font-medium">Thương hiệu</span>
            <span class="w-2/3 text-slate-800 font-semibold">{{ product.brand || 'Chưa rõ' }}</span>
          </div>
          <div class="flex py-2 border-b border-slate-100/70">
            <span class="w-1/3 text-slate-400 font-medium">Mã SKU</span>
            <span class="w-2/3 text-slate-800 font-mono font-semibold">{{ product.sku }}</span>
          </div>
          <div class="flex py-2 border-b border-slate-100/70">
            <span class="w-1/3 text-slate-400 font-medium">Danh mục</span>
            <span class="w-2/3 text-slate-800 font-semibold">{{ typeof product.category === 'object' ? product.category.name : 'Văn phòng phẩm' }}</span>
          </div>
          <div class="flex py-2 border-b border-slate-100/70">
            <span class="w-1/3 text-slate-400 font-medium">Tình trạng</span>
            <span class="w-2/3 text-slate-800 font-semibold">{{ product.stock > 0 ? 'Còn hàng' : 'Hết hàng' }}</span>
          </div>
          <div class="flex py-2 border-b border-slate-100/70">
            <span class="w-1/3 text-slate-400 font-medium">Xuất xứ</span>
            <span class="w-2/3 text-slate-800 font-semibold">Việt Nam</span>
          </div>
          <div class="flex py-2 border-b border-slate-100/70">
            <span class="w-1/3 text-slate-400 font-medium">Nhà cung cấp</span>
            <span class="w-2/3 text-slate-800 font-semibold">Trường Thanh Bookstore</span>
          </div>
        </div>
      </div>

      <!-- Reviews & Ratings Section -->
      <div class="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-8">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 class="text-lg font-extrabold text-slate-900">Đánh giá sản phẩm</h2>
          <button 
            v-if="authStore.isAuthenticated"
            @click="showReviewForm = !showReviewForm" 
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors cursor-pointer focus:outline-none"
          >
            {{ showReviewForm ? 'Hủy đánh giá' : 'Viết đánh giá' }}
          </button>
        </div>

        <!-- Rating Stats -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div class="md:col-span-4 text-center space-y-2 border-r border-slate-100 py-4">
            <div class="text-5xl font-black text-slate-800">{{ averageRating }}</div>
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
            <p class="text-xs text-slate-400 font-medium">Dựa trên {{ reviews.length }} đánh giá</p>
          </div>

          <div class="md:col-span-8 space-y-2">
            <div 
              v-for="ratingVal in [5, 4, 3, 2, 1]" 
              :key="ratingVal"
              class="flex items-center gap-3 text-xs"
            >
              <span class="w-12 text-right text-slate-500 font-bold">{{ ratingVal }} sao</span>
              <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-yellow-500 rounded-full transition-all duration-500"
                  :style="{ width: `${ratingStats[ratingVal].percent}%` }"
                ></div>
              </div>
              <span class="w-12 text-slate-400">{{ ratingStats[ratingVal].count }}</span>
            </div>
          </div>
        </div>

        <!-- Write Review Form -->
        <div v-if="showReviewForm && authStore.isAuthenticated" class="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <h3 class="text-sm font-extrabold text-slate-800">Đánh giá của bạn</h3>
          
          <!-- Rating Star Selector -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500 font-medium">Chọn số sao:</span>
            <div class="flex gap-1">
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
                  class="w-6 h-6"
                  :class="star <= newReviewRating ? 'text-yellow-500' : 'text-slate-300'"
                >
                  <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Tên của bạn *</label>
              <input 
                v-model="newReviewName" 
                type="text" 
                placeholder="Nhập tên của bạn"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white text-sm"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700">Nội dung đánh giá *</label>
            <textarea 
              v-model="newReviewContent" 
              rows="3"
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white text-sm"
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button 
              type="button"
              @click="showReviewForm = false"
              class="px-5 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button 
              type="button"
              @click="submitReview"
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl text-sm transition-colors cursor-pointer"
            >
              Gửi đánh giá
            </button>
          </div>
        </div>

        <!-- Prompt to Login -->
        <div v-if="!authStore.isAuthenticated" class="bg-slate-50 border border-slate-100/60 rounded-2xl p-6 text-center space-y-3">
          <p class="text-sm font-medium text-slate-500">Quý khách vui lòng đăng nhập tài khoản để gửi đánh giá và nhận xét sản phẩm.</p>
          <router-link to="/login" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors cursor-pointer">
            Đăng nhập ngay
          </router-link>
        </div>

        <!-- Reviews List -->
        <div class="space-y-6 divide-y divide-slate-100">
          <div 
            v-for="(rev, idx) in reviews" 
            :key="rev.id || idx"
            class="pt-6 first:pt-0 space-y-3"
          >
            <!-- Regular Mode -->
            <div v-if="editingReviewId !== rev.id" class="space-y-2">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
                    {{ rev.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <h4 class="text-sm font-extrabold text-slate-800">{{ rev.name }}</h4>
                    <div class="flex gap-0.5 mt-0.5">
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
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-slate-400">{{ rev.createdAt }}</span>
                  <div v-if="canModifyReview(rev)" class="flex items-center gap-1.5">
                    <button 
                      @click="startEditReview(rev)"
                      class="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100/80 px-2 py-1 rounded-md cursor-pointer focus:outline-none"
                    >
                      Sửa
                    </button>
                    <button 
                      @click="deleteReview(rev.id)"
                      class="text-xs font-bold text-red-600 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100/80 px-2 py-1 rounded-md cursor-pointer focus:outline-none"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
              <p class="text-sm text-slate-600 leading-relaxed pl-11">
                {{ rev.content }}
              </p>
            </div>

            <!-- Edit Mode Inline -->
            <div v-else class="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4 pl-11">
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
                  <label class="text-xs font-bold text-slate-700">Tên của bạn</label>
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
          <div v-if="reviews.length === 0" class="text-center py-6 text-slate-400 text-sm">
            Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên đánh giá!
          </div>
        </div>
      </div>

      <!-- Recommended Products styled like Fahasa "Gợi ý cho bạn" -->
      <section v-if="relatedProducts.length > 0" class="overflow-hidden border border-emerald-200/60 rounded-3xl shadow-xs">
        <!-- Header Banner -->
        <div class="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-8 py-5 flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-white animate-pulse">
            <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
          </svg>
          <h2 class="text-lg font-black text-white uppercase tracking-wider text-center">Gợi ý cho bạn</h2>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-white animate-pulse">
            <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
          </svg>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { productService } from '@/services/product.service'
import ProductCard from '@/components/ProductCard.vue'
import { formatCurrency, getDiscountPercent } from '@/utils/helpers'
import type { Product } from '@/types'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const toast = useToast()

function buyNow() {
  if (product.value) {
    cartStore.addToCart(product.value, quantity.value)
    router.push('/cart')
  }
}

const product = ref<Product | null>(null)
const relatedProducts = ref<Product[]>([])
const selectedImage = ref('')
const quantity = ref(1)
const loading = ref(true)

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

interface Review {
  id: string
  userId?: string
  name: string
  rating: number
  content: string
  createdAt: string
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

function canModifyReview(review: Review): boolean {
  if (authStore.isAdmin) return true
  
  const currentUserId = authStore.user?._id
  return !!currentUserId && review.userId === currentUserId
}

function startEditReview(review: Review) {
  editingReviewId.value = review.id
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

function saveEditReview() {
  if (!editReviewName.value.trim()) {
    toast.warning('Vui lòng nhập tên của bạn')
    return
  }
  if (!editReviewContent.value.trim()) {
    toast.warning('Vui lòng nhập nội dung đánh giá')
    return
  }

  const prodId = route.params.id as string
  const review = reviews.value.find(r => r.id === editingReviewId.value)
  if (review) {
    review.name = editReviewName.value
    review.rating = editReviewRating.value
    review.content = editReviewContent.value
    review.createdAt = new Date().toLocaleDateString('vi-VN')
    localStorage.setItem(`reviews_${prodId}`, JSON.stringify(reviews.value))
    toast.success('Đã cập nhật đánh giá!')
  }
  cancelEditReview()
}

function deleteReview(reviewId: string) {
  const prodId = route.params.id as string
  reviews.value = reviews.value.filter(r => r.id !== reviewId)
  localStorage.setItem(`reviews_${prodId}`, JSON.stringify(reviews.value))
  toast.success('Đã xóa đánh giá!')
}

function loadReviews() {
  const prodId = route.params.id as string
  const storedReviews = localStorage.getItem(`reviews_${prodId}`)
  if (storedReviews) {
    reviews.value = JSON.parse(storedReviews)
  } else {
    const productName = product.value ? product.value.name : 'sản phẩm'
    reviews.value = [
      {
        id: 'mock_1',
        userId: 'mock_system',
        name: 'Nguyễn Văn A',
        rating: 5,
        content: `Tôi đã mua sản phẩm "${productName}" này ở Trường Thanh Bookstore, chất lượng hoàn thiện cực kỳ tốt, đóng gói cẩn thận và giao hàng siêu nhanh. Sẽ tiếp tục ủng hộ shop!`,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN')
      },
      {
        id: 'mock_2',
        userId: 'mock_system',
        name: 'Trần Thị B',
        rating: 4,
        content: `Sản phẩm "${productName}" nhận được đúng như mô tả của cửa hàng, đóng gói kỹ lượng và có tem nhãn chính hãng đầy đủ. Sử dụng rất ưng ý.`,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN')
      }
    ]
    localStorage.setItem(`reviews_${prodId}`, JSON.stringify(reviews.value))
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

function submitReview() {
  if (!authStore.isAuthenticated) {
    toast.error('Vui lòng đăng nhập để đánh giá sản phẩm')
    return
  }
  if (!newReviewName.value.trim()) {
    toast.warning('Vui lòng nhập tên của bạn')
    return
  }
  if (!newReviewContent.value.trim()) {
    toast.warning('Vui lòng viết nội dung đánh giá')
    return
  }

  const prodId = route.params.id as string
  const currentUserId = authStore.user?._id

  const review: Review = {
    id: 'rev_' + Date.now(),
    userId: currentUserId,
    name: newReviewName.value,
    rating: newReviewRating.value,
    content: newReviewContent.value,
    createdAt: new Date().toLocaleDateString('vi-VN')
  }

  reviews.value.unshift(review)
  localStorage.setItem(`reviews_${prodId}`, JSON.stringify(reviews.value))

  newReviewName.value = ''
  newReviewRating.value = 5
  newReviewContent.value = ''
  showReviewForm.value = false
  
  toast.success('Cảm ơn bạn đã đánh giá sản phẩm!')
}

async function loadProduct() {
  loading.value = true
  try {
    const id = route.params.id as string
    const res = await productService.getById(id)
    product.value = res.data
    selectedImage.value = res.data.images[0] || ''
    quantity.value = 1
    
    // Load reviews
    loadReviews()
    
    // De-couple main page loader so users can view & purchase the product immediately (UX Optimization)
    loading.value = false
    
    startAutoplay()
    
    // Fetch related products asynchronously in the background
    productService.getAll({
      category: typeof res.data.category === 'object' ? res.data.category._id : res.data.category,
      limit: 11
    }).then(relatedRes => {
      relatedProducts.value = relatedRes.data.data.filter((p: Product) => p._id !== id)
    }).catch(err => {
      console.error('Error fetching related products:', err)
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
