<template>
  <div class="space-y-0 pb-0 bg-slate-50/50 overflow-hidden">
    <!-- Category Navigation Bar -->
    <div class="bg-white border-b border-slate-100 hidden md:block">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          class="flex items-center justify-start lg:justify-center gap-2 lg:gap-6 py-2.5 overflow-x-auto scrollbar-none"
        >
          <router-link
            v-for="item in navItems"
            :key="item.name"
            :to="item.to"
            class="flex items-center gap-1.5 text-xs font-extrabold text-[#0f172a] hover:text-[#dc2626] px-4 py-2 rounded-full hover:bg-red-50 transition-all whitespace-nowrap flex-shrink-0"
          >
            <span>{{ item.icon }}</span>
            {{ item.name }}
          </router-link>
          <router-link
            to="/products?discounted=true"
            class="flex items-center gap-1.5 text-xs font-extrabold text-white bg-[#dc2626] hover:bg-[#b91c1c] px-4 py-2 rounded-full transition-all whitespace-nowrap flex-shrink-0"
          >
            % Ưu đãi hot
          </router-link>
        </div>
      </div>
    </div>

    <!-- Section 1: Hero Section (Full width background) -->
    <div
      class="relative overflow-hidden bg-gradient-to-br from-[#fff7ed] via-[#fff9f2] to-[#ffffff] border-b border-orange-100/30 py-14 md:py-24 min-h-[520px] md:min-h-[580px] flex items-center"
    >
      <!-- Subtle dot grid & decorations pattern -->
      <div
        class="absolute inset-0 opacity-[0.04]"
        style="
          background-image: radial-gradient(#000 1px, transparent 1px);
          background-size: 20px 20px;
        "
      ></div>
      <!-- Absolute decorative icons -->
      <div
        class="absolute top-10 left-10 text-slate-300 text-xl font-bold select-none opacity-20 pointer-events-none"
      >
        ✏️
      </div>
      <div
        class="absolute bottom-10 left-[40%] text-slate-300 text-2xl font-bold select-none opacity-20 pointer-events-none"
      >
        📎
      </div>
      <div
        class="absolute top-20 right-[45%] text-slate-300 text-lg font-bold select-none opacity-20 pointer-events-none"
      >
        📐
      </div>
      <div
        class="absolute bottom-20 right-[35%] text-slate-300 text-xl font-bold select-none opacity-20 pointer-events-none"
      >
        📓
      </div>

      <div
        class="absolute -right-20 -top-20 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl animate-pulse-soft"
      ></div>
      <div
        class="absolute left-10 bottom-10 w-80 h-80 bg-rose-200/20 rounded-full blur-3xl animate-pulse-soft delay-1000"
      ></div>

      <!-- Decorative stars -->
      <div
        class="absolute top-16 left-[45%] text-orange-300/60 text-xs animate-float pointer-events-none select-none"
      >
        ✦
      </div>
      <div
        class="absolute top-32 left-[52%] text-rose-300/50 text-[10px] animate-float-reverse pointer-events-none select-none"
      >
        ✦
      </div>
      <div
        class="absolute bottom-20 left-[48%] text-amber-300/40 text-sm animate-float pointer-events-none select-none"
      >
        +
      </div>
      <div
        class="absolute top-24 right-[15%] text-orange-200/50 text-lg animate-float-reverse pointer-events-none select-none"
      >
        ✦
      </div>

      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center relative z-10"
      >
        <!-- Left Column: Text content -->
        <div class="lg:col-span-7 space-y-5 text-left relative z-20">
          <div
            class="inline-flex items-center gap-1.5 bg-orange-100/70 border border-orange-200 text-orange-800 text-[11px] font-black px-4 py-1.5 rounded-full w-fit animate-float"
          >
            <span>✨ Siêu Ưu Đãi Mùa Tựu Trường</span>
          </div>
          <h1
            class="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-black tracking-tight leading-[1.1] uppercase hero-text text-[#0f172a]"
          >
            Khởi nguồn <br />
            <span
              class="inline-block pt-4 pb-3 pr-8 pl-4 -mt-4 -ml-4 overflow-visible bg-gradient-to-r from-[#e11d24] via-rose-500 to-[#fb5607] bg-clip-text text-transparent italic"
              >Sự Sáng Tạo</span
            >
          </h1>
          <p
            class="text-slate-600 text-sm sm:text-base max-w-lg leading-relaxed reveal"
          >
            Khám phá bộ sưu tập dụng cụ học tập & văn phòng phẩm Trường Thành
            chất lượng vượt trội, đồng hành trên con đường chinh phục đỉnh cao
            tri thức của bạn.
          </p>

          <div class="pt-1 flex flex-wrap gap-3 reveal delay-100">
            <router-link
              to="/products"
              class="bg-gradient-to-r from-[#e11d24] to-[#fb5607] hover:opacity-95 text-white font-extrabold py-3.5 px-7 rounded-full shadow-lg shadow-red-500/20 transition-all text-sm flex items-center gap-2 group cursor-pointer"
            >
              <span>Mua sắm ngay</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2.5"
                stroke="currentColor"
                class="w-4 h-4 group-hover:translate-x-1 transition-transform"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </router-link>
            <router-link
              to="/products?discounted=true"
              class="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold py-3.5 px-7 rounded-full transition-all text-sm flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span>🏷️ Xem ưu đãi</span>
            </router-link>
          </div>

          <div
            class="pt-4 flex flex-wrap gap-6 text-[11px] text-slate-500 font-bold"
          >
            <div class="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="w-4 h-4 text-emerald-500"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>100% Chính Hãng</span>
            </div>
            <div class="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="w-4 h-4 text-emerald-500"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>Giao Nhanh Toàn Quốc</span>
            </div>
            <div class="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="w-4 h-4 text-emerald-500"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>Đổi Trả 7 Ngày</span>
            </div>
          </div>
        </div>

        <!-- Right Column: Product image showcase -->
        <div
          class="lg:col-span-5 relative flex justify-center lg:justify-end reveal delay-200 mt-8 lg:mt-0 overflow-hidden"
        >
          <!-- Orange organic blob behind the image -->
          <div
            class="absolute w-[110%] h-[110%] -left-[5%] -top-[5%] bg-gradient-to-br from-[#FDBA74]/50 to-[#FB923C]/40 rounded-[45%_55%_60%_40%/50%_60%_40%_50%] z-0 pointer-events-none"
          ></div>

          <div class="relative w-full max-w-[520px] z-10">
            <img
              :src="heroStationery"
              alt="Truong Thanh Stationery Showcase"
              class="w-full h-auto max-h-[420px] object-cover rounded-[20px] shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
            />
            <!-- Upper-right badge -->
            <div
              class="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-2.5 sm:p-3 pr-4 sm:pr-5 flex items-center gap-2 sm:gap-2.5 border border-slate-100/60"
            >
              <div
                class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#059669] flex items-center justify-center text-white flex-shrink-0 text-sm sm:text-base"
              >
                ✨
              </div>
              <div class="text-left leading-tight">
                <p
                  class="text-[7px] sm:text-[8px] text-slate-400 font-bold uppercase tracking-wider"
                >
                  ĐỘC QUYỀN
                </p>
                <p
                  class="text-[10px] sm:text-xs font-black text-slate-800 mt-0.5 whitespace-nowrap"
                >
                  10k+ Khách Hàng
                </p>
              </div>
            </div>
            <!-- Lower-left badge -->
            <div
              class="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 z-20 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-2.5 sm:p-3 pr-4 sm:pr-5 flex items-center gap-2 sm:gap-2.5 border border-slate-100/60"
            >
              <div
                class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-r from-[#e11d24] to-[#fb5607] flex items-center justify-center text-white font-black text-[10px] sm:text-xs flex-shrink-0"
              >
                -30%
              </div>
              <div class="text-left leading-tight">
                <p
                  class="text-[7px] sm:text-[8px] text-slate-400 font-bold uppercase tracking-wider"
                >
                  ƯU ĐÃI MÙA HÈ
                </p>
                <p
                  class="text-[10px] sm:text-xs font-black text-slate-800 mt-0.5 whitespace-nowrap"
                >
                  Giảm giá cực sốc
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Trust Bar (Overlaid on bottom of Hero Card) -->
    <div class="max-w-7xl mx-auto px-4 md:px-8 -mt-16 mb-10 relative z-20">
      <div
        class="bg-white border border-slate-100 rounded-[20px] shadow-lg py-5 px-6"
      >
        <div
          class="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-slate-600 font-bold"
        >
          <div
            class="flex items-center gap-3 justify-center border-r border-slate-100 last:border-0"
          >
            <span class="text-orange-500 text-xl">🔥</span>
            <div class="text-left">
              <p class="font-extrabold text-slate-800 leading-none">
                Deal sốc mỗi ngày
              </p>
              <p class="text-[10px] text-slate-400 font-normal mt-1">
                Cập nhật liên tục hàng giờ
              </p>
            </div>
          </div>
          <div
            class="flex items-center gap-3 justify-center md:border-r border-slate-100 last:border-0"
          >
            <span class="text-orange-500 text-xl">🏷️</span>
            <div class="text-left">
              <p class="font-extrabold text-slate-800 leading-none">
                Tiết kiệm đến 30%
              </p>
              <p class="text-[10px] text-slate-400 font-normal mt-1">
                Với hàng ngàn ưu đãi
              </p>
            </div>
          </div>
          <div
            class="flex items-center gap-3 justify-center border-r border-slate-100 last:border-0"
          >
            <span class="text-orange-500 text-xl">👥</span>
            <div class="text-left">
              <p class="font-extrabold text-slate-800 leading-none">
                10.000+ Khách hàng
              </p>
              <p class="text-[10px] text-slate-400 font-normal mt-1">
                Đã tin tưởng và ủng hộ
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3 justify-center last:border-0">
            <span class="text-orange-500 text-xl">🛡️</span>
            <div class="text-left">
              <p class="font-extrabold text-slate-800 leading-none">
                Mua sắm an tâm
              </p>
              <p class="text-[10px] text-slate-400 font-normal mt-1">
                Đổi trả dễ dàng trong 7 ngày
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: DEAL SỐC GIỜ VÀNG (Flash Sale) (Placed above Categories) -->
    <section
      :style="{
        backgroundImage: `url(${flashSaleBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }"
      class="w-full py-16 relative overflow-hidden"
    >
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10"
      >
        <!-- Section Header -->
        <div
          class="reveal flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10"
        >
          <div class="space-y-2 text-left">
            <span
              class="inline-flex items-center gap-1 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider"
            >
              🔥 ĐỪNG BỎ LỠ HÔM NAY!
            </span>
            <div class="flex items-center gap-3">
              <div
                class="bg-gradient-to-br from-red-500 to-orange-600 text-white p-2.5 rounded-2xl shadow-lg rotate-12 flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2.5"
                  stroke="currentColor"
                  class="w-5 h-5"
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
              <h2
                class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
              >
                DEAL <span class="text-[#dc2626]">SỐC</span> GIỜ VÀNG
              </h2>
            </div>
            <p class="text-slate-500 text-xs sm:text-sm font-medium">
              Giảm giá đến
              <span class="text-red-600 font-extrabold">30%</span> cho dụng cụ
              học tập & văn phòng phẩm
            </p>
          </div>

          <!-- Countdown timer -->
          <div
            class="flex flex-col items-center md:items-end gap-2 shrink-0 bg-white/80 border border-orange-200/30 rounded-3xl p-4 backdrop-blur-xs"
          >
            <span
              class="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1"
            >
              ⏰ KẾT THÚC SAU:
            </span>
            <div class="flex items-center gap-2">
              <div class="flex flex-col items-center">
                <div
                  class="bg-slate-900 text-white font-mono font-black text-xl px-3 py-2 rounded-xl shadow-md min-w-[42px] text-center tracking-wider leading-none"
                >
                  {{ hours }}
                </div>
                <span class="text-[9px] font-bold text-slate-400 mt-1 uppercase"
                  >Giờ</span
                >
              </div>
              <span class="font-black text-slate-900 text-lg -mt-3">:</span>
              <div class="flex flex-col items-center">
                <div
                  class="bg-slate-900 text-white font-mono font-black text-xl px-3 py-2 rounded-xl shadow-md min-w-[42px] text-center tracking-wider leading-none"
                >
                  {{ minutes }}
                </div>
                <span class="text-[9px] font-bold text-slate-400 mt-1 uppercase"
                  >Phút</span
                >
              </div>
              <span class="font-black text-slate-900 text-lg -mt-3">:</span>
              <div class="flex flex-col items-center">
                <div
                  class="bg-slate-900 text-white font-mono font-black text-xl px-3 py-2 rounded-xl shadow-md min-w-[42px] text-center tracking-wider leading-none"
                >
                  {{ seconds }}
                </div>
                <span class="text-[9px] font-bold text-slate-400 mt-1 uppercase"
                  >Giây</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Products -->
        <div
          v-if="loadingDiscount"
          class="responsive-flex-grid relative z-10"
        >
          <div
            v-for="n in 5"
            :key="n"
            class="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 animate-pulse"
          >
            <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
            <div class="h-4 bg-slate-200 rounded w-2/3"></div>
            <div class="h-6 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>

        <div v-else class="relative w-full overflow-hidden px-1">
          <!-- Slider Track -->
          <div
            class="flex flex-row transition-transform duration-700 ease-in-out"
            :style="{ transform: `translate3d(-${currentPageIndex * 100}%, 0, 0)` }"
          >
            <!-- Page Wrapper -->
            <div
              v-for="(page, pageIdx) in dealPages"
              :key="pageIdx"
              class="w-full flex-shrink-0 px-1"
            >
              <div class="responsive-flex-grid relative z-10">
                <div
                  v-for="(prod, n) in page"
                  :key="prod._id + '-' + pageIdx + '-' + n"
                  @click="goToDetail(prod._id)"
                  class="bg-white border border-slate-100/80 rounded-[2rem] p-5 space-y-4 shadow-xs hover:shadow-xl hover:border-orange-200 transition-all duration-300 relative group flex flex-col justify-between cursor-pointer"
                >
                  <!-- Badge -->
                  <div
                    class="absolute top-4 inset-x-4 flex items-center justify-between z-10 pointer-events-none"
                  >
                    <span
                      class="bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider"
                    >
                      -{{ getDiscountPercent(prod.price, prod.discountPrice) }}%
                    </span>
                    <span
                      v-if="n === 0"
                      class="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-0.5"
                    >
                      🔥 HOT
                    </span>
                  </div>

                  <!-- Image/Fallback -->
                  <div class="block space-y-3">
                    <div
                      class="aspect-square bg-slate-50/50 rounded-2xl overflow-hidden flex items-center justify-center relative"
                    >
                      <!-- Blurred background to fill empty space -->
                      <img 
                        v-if="prod.images && prod.images[0] && !brokenImages[prod._id]" 
                        :src="prod.images[0]" 
                        class="absolute inset-0 w-full h-full object-cover blur-xl opacity-[0.22] scale-125 select-none pointer-events-none" 
                      />
                      
                      <!-- Main product image with drop shadow -->
                      <img
                        v-if="
                          prod.images && prod.images[0] && !brokenImages[prod._id]
                        "
                        :src="prod.images[0]"
                        @error="handleImageError(prod._id)"
                        class="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 relative z-10 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.06)]"
                        :alt="prod.name"
                      />
                      <!-- Fallback SVG -->
                      <div
                        v-else
                        :class="[
                          'w-full h-full flex items-center justify-center p-4 group-hover:scale-105 transition-transform duration-300',
                          getProductPlaceholder(prod.name).gradient,
                        ]"
                      >
                        <svg
                          v-if="getProductPlaceholder(prod.name).icon === 'pencil'"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-12 h-12 text-white/90"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                          />
                        </svg>
                        <svg
                          v-else-if="
                            getProductPlaceholder(prod.name).icon === 'document'
                          "
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-12 h-12 text-white/90"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                          />
                        </svg>
                        <svg
                          v-else-if="
                            getProductPlaceholder(prod.name).icon === 'calculator'
                          "
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-12 h-12 text-white/90"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M15.75 15.75h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm-2.25 2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008Zm0-2.25h.008v.008h-.008v-.008ZM2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.379-3.379a.75.75 0 0 0-1.06 1.06l1.25 1.25a.75.75 0 0 0 1.06-1.06l-1.25-1.25Z"
                          />
                        </svg>
                        <svg
                          v-else-if="
                            getProductPlaceholder(prod.name).icon === 'folder'
                          "
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-12 h-12 text-white/90"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-19.5 0A2.25 2.25 0 0 0 4.5 15h15a2.25 2.25 0 0 0 2.25-2.25m-19.5 0v.225C2.25 14.28 3.52 15 5.04 15h13.92c1.52 0 2.79-.72 2.79-2.025v-.225M3 9V6a3 3 0 0 1 3-3h3.75a3 3 0 0 1 2.25 1.025L13.5 6h6.75A3 3 0 0 1 23 9v2.25m-20.25 0h17.5"
                          />
                        </svg>
                        <svg
                          v-else-if="
                            getProductPlaceholder(prod.name).icon === 'briefcase'
                          "
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-12 h-12 text-white/90"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M20.25 14.15v4.25c0 .994-.806 1.8-1.8 1.8H5.55c-.994 0-1.8-.806-1.8-1.8v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.45.258-.717.258H5.184c-.267 0-.523-.093-.717-.258m16.5 0V8.706c0-1.08-.768-2.014-1.837-2.174a47.79 47.79 0 0 0-3.413-.387m-7.5 0V5.25A2.25 2.25 0 0 1 10.5 3h3a2.25 2.25 0 0 1 2.25 2.25v.819M6.75 7.5v.75m0-1.5h10.5M6.75 7.5H4.25m13 0h2.5M6.75 7.5v8.25M17.25 7.5v8.25M3 16.5h18"
                          />
                        </svg>
                        <svg
                          v-else-if="
                            getProductPlaceholder(prod.name).icon === 'academic'
                          "
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-12 h-12 text-white/90"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M12 21v-4.5"
                          />
                        </svg>
                        <svg
                          v-else
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-12 h-12 text-white/90"
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
                    </div>

                    <!-- Product Info -->
                    <div class="space-y-1.5">
                      <h3
                        class="text-xs sm:text-sm font-extrabold text-slate-800 line-clamp-2 hover:text-red-600 transition-colors leading-tight min-h-[36px]"
                      >
                        {{ prod.name }}
                      </h3>
                      <div class="flex items-center gap-1.5 text-[10px]">
                        <div class="flex items-center text-amber-400">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            class="w-3 h-3"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                              clip-rule="evenodd"
                            />
                          </svg>
                        </div>
                        <span class="font-bold text-slate-700 text-[11px]">{{
                          Number(prod.rating || 5).toFixed(1)
                        }}</span>
                        <span class="text-slate-300">|</span>
                        <span class="text-slate-500 font-medium"
                          >Đã bán {{ prod.sold || 0 }}</span
                        >
                      </div>
                    </div>

                    <!-- Price -->
                    <div
                      class="flex items-baseline gap-2 pt-1 border-t border-slate-100"
                    >
                      <span class="text-sm sm:text-base font-black text-[#dc2626]">
                        {{ formatCurrency(prod.discountPrice || prod.price) }}
                      </span>
                      <span
                        v-if="prod.discountPrice"
                        class="text-xs text-slate-400 line-through"
                      >
                        {{ formatCurrency(prod.price) }}
                      </span>
                    </div>

                    <!-- Stock Bar -->
                    <div class="space-y-1.5 pt-1">
                      <div
                        class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"
                      >
                        <div
                          class="bg-gradient-to-r from-orange-500 to-[#dc2626] h-full rounded-full transition-all duration-500"
                          :style="{
                            width: `${Math.min(Math.round((prod.sold / (prod.stock + prod.sold || 100)) * 100), 95) || 30}%`,
                          }"
                        ></div>
                      </div>
                      <div
                        class="flex justify-between items-center text-[10px] font-bold text-slate-500 leading-none"
                      >
                        <span>Đã bán {{ prod.sold }}</span>
                        <span
                          >{{
                            Math.min(
                              Math.round(
                                (prod.sold / (prod.stock + prod.sold || 100)) * 100,
                              ),
                              95,
                            ) || 30
                          }}%</span
                        >
                      </div>
                    </div>
                  </div>

                  <!-- Action Button -->
                  <button
                    @click.stop="addToCart(prod)"
                    class="w-full mt-3 bg-gradient-to-r from-orange-500 to-[#dc2626] hover:from-orange-600 hover:to-[#b91c1c] text-white font-extrabold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-[10px] uppercase tracking-wider"
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
                        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                      />
                    </svg>
                    <span>MUA NGAY</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation Arrows -->
          <button
            v-if="dealPages.length > 1"
            @click="prevPage"
            class="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-3 rounded-full shadow-lg border border-slate-100/50 z-20 transition-all hover:scale-110 active:scale-95 cursor-pointer hidden md:flex items-center justify-center"
            aria-label="Previous page"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="3"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <button
            v-if="dealPages.length > 1"
            @click="nextPage"
            class="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-3 rounded-full shadow-lg border border-slate-100/50 z-20 transition-all hover:scale-110 active:scale-95 cursor-pointer hidden md:flex items-center justify-center"
            aria-label="Next page"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="3"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>

          <!-- Dots indicators -->
          <div v-if="dealPages.length > 1" class="flex justify-center gap-2 mt-6">
            <button
              v-for="(_, idx) in dealPages"
              :key="idx"
              @click="setPage(idx)"
              class="h-2.5 rounded-full transition-all duration-300 cursor-pointer"
              :class="currentPageIndex === idx ? 'bg-[#dc2626] w-8' : 'bg-slate-300 w-2.5 hover:bg-slate-400'"
              :aria-label="'Trang ' + (idx + 1)"
            ></button>
          </div>
        </div>

        <!-- See More Button -->
        <div class="flex justify-center pt-2 relative z-10">
          <router-link
            to="/products?discounted=true"
            class="bg-white border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
          >
            Xem Thêm Deal Hot
          </router-link>
        </div>
      </div>
    </section>

    <!-- Section 4: Horizontal Featured Categories -->
    <section class="py-10 px-4 md:px-8 bg-white border-y border-slate-100/80">
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Section Header -->
        <div class="reveal flex items-end justify-between">
          <div class="text-left">
            <h2
              class="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight flex items-center gap-2"
            >
              ✨ Danh mục nổi bật
            </h2>
          </div>
          <router-link
            to="/products"
            class="text-xs font-bold text-slate-500 hover:text-red-600 flex items-center gap-1 group"
          >
            <span>Xem tất cả</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </router-link>
        </div>

        <!-- Cards Container -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-6"
        >
          <router-link
            v-for="cat in featuredCategoriesList"
            :key="cat.name"
            :to="cat.to"
            :class="[
              'relative overflow-hidden rounded-[18px] p-5 border flex items-center justify-between group transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer min-h-[100px]',
              cat.gradient,
            ]"
          >
            <!-- Card Background Image with hover zoom effect -->
            <div
              class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 pointer-events-none"
              :style="{ backgroundImage: `url(${cat.bgImage})` }"
            ></div>

            <!-- Soft gradient overlay to ensure text contrast/readability on the left -->
            <div
              class="absolute inset-0 bg-gradient-to-r from-white/60 via-white/30 to-transparent pointer-events-none"
            ></div>

            <!-- Text on the left -->
            <div class="space-y-1 text-left relative z-10 max-w-[65%]">
              <h3
                class="text-sm font-black tracking-tight leading-tight text-[#0f172a] group-hover:text-[#dc2626] transition-colors"
              >
                {{ cat.name }}
              </h3>
              <p
                class="text-[10px] text-slate-600 font-extrabold leading-none mt-1"
              >
                {{ cat.desc }}
              </p>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Section 6: Best Sellers -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8">
      <div
        class="reveal flex items-end justify-between border-b border-slate-100 pb-4"
      >
        <div class="text-left">
          <span
            class="text-xs font-bold text-rose-600 tracking-[0.2em] uppercase"
            >Mọi người yêu thích</span
          >
          <h2
            class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1"
          >
            🔥 Sản phẩm bán chạy nhất
          </h2>
        </div>
        <router-link
          to="/products"
          class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group"
        >
          <span>Xem tất cả</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </router-link>
      </div>

      <div
        v-if="loadingBest"
        class="responsive-flex-grid"
      >
        <div
          v-for="n in 5"
          :key="n"
          class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse"
        >
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <div
        v-else
        class="responsive-flex-grid"
      >
        <ProductCard
          v-for="(prod, idx) in bestSelling.slice(0, 10)"
          :key="prod._id"
          :product="prod"
          :class="['reveal-scale', `delay-${(idx % 5) * 100}`]"
          @add-to-cart="addToCart"
        />
      </div>

      <div class="flex justify-center pt-6">
        <router-link
          to="/products"
          class="border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
        >
          Xem Thêm Sản Phẩm
        </router-link>
      </div>
    </section>

    <!-- Section 7: New Arrivals -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8">
      <div
        class="reveal flex items-end justify-between border-b border-slate-100 pb-4"
      >
        <div class="text-left">
          <span
            class="text-xs font-bold text-rose-600 tracking-[0.2em] uppercase font-black"
            >Bộ sưu tập mới</span
          >
          <h2
            class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1"
          >
            ✨ Hàng mới cập bến
          </h2>
        </div>
        <router-link
          to="/products?sort=newest"
          class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group"
        >
          <span>Xem tất cả</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </router-link>
      </div>

      <div
        v-if="loadingNew"
        class="responsive-flex-grid"
      >
        <div
          v-for="n in 5"
          :key="n"
          class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse"
        >
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <div
        v-else
        class="responsive-flex-grid"
      >
        <ProductCard
          v-for="(prod, idx) in newProducts.slice(0, 10)"
          :key="prod._id"
          :product="prod"
          :class="['reveal-scale', `delay-${(idx % 5) * 100}`]"
          @add-to-cart="addToCart"
        />
      </div>

      <div class="flex justify-center pt-6">
        <router-link
          to="/products?sort=newest"
          class="border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
        >
          Khám Phá Bộ Sưu Tập Mới
        </router-link>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8">
      <div
        class="reveal flex items-end justify-between border-b border-slate-100 pb-4"
      >
        <div class="text-left">
          <span
            class="text-xs font-bold text-rose-600 tracking-[0.2em] uppercase font-black font-bold"
            >Bộ sưu tập nổi bật</span
          >
          <h2
            class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1"
          >
            ✨ Sách Giáo Khoa 2026
          </h2>
        </div>
        <router-link
          :to="'/products?category=' + getCategoryIdBySlug('sach-giao-khoa')"
          class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group"
        >
          <span>Xem tất cả</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </router-link>
      </div>

      <div
        v-if="loadingTextbook"
        class="responsive-flex-grid"
      >
        <div
          v-for="n in 5"
          :key="n"
          class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse"
        >
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <div
        v-else
        class="responsive-flex-grid"
      >
        <ProductCard
          v-for="(prod, idx) in textbookProducts.slice(0, 10)"
          :key="prod._id"
          :product="prod"
          :class="['reveal-scale', `delay-${(idx % 5) * 100}`]"
          @add-to-cart="addToCart"
        />
      </div>

      <div class="flex justify-center pt-6">
        <router-link
          :to="'/products?category=' + getCategoryIdBySlug('sach-giao-khoa')"
          class="border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
        >
          Khám Phá Sách Giáo Khoa
        </router-link>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8">
      <div
        class="reveal flex items-end justify-between border-b border-slate-100 pb-4"
      >
        <div class="text-left">
          <span
            class="text-xs font-bold text-rose-600 tracking-[0.2em] uppercase font-black font-bold"
            >Bộ sưu tập nổi bật</span
          >
          <h2
            class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1"
          >
            ✨ Sách Tham Khảo
          </h2>
        </div>
        <router-link
          :to="'/products?category=' + getCategoryIdBySlug('sach-tham-khao')"
          class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group"
        >
          <span>Xem tất cả</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </router-link>
      </div>

      <div
        v-if="loadingReference"
        class="responsive-flex-grid"
      >
        <div
          v-for="n in 5"
          :key="n"
          class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse"
        >
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <div
        v-else
        class="responsive-flex-grid"
      >
        <ProductCard
          v-for="(prod, idx) in referenceProducts.slice(0, 10)"
          :key="prod._id"
          :product="prod"
          :class="['reveal-scale', `delay-${(idx % 5) * 100}`]"
          @add-to-cart="addToCart"
        />
      </div>

      <div class="flex justify-center pt-6">
        <router-link
          :to="'/products?category=' + getCategoryIdBySlug('sach-tham-khao')"
          class="border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
        >
          Khám Phá Sách Tham Khảo
        </router-link>
      </div>
    </section>

    <!-- Section 5: Editorial Banner -->
    <section
      :style="{
        backgroundImage: `url(${inspirationBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'right center',
      }"
      class="relative min-h-[50vh] flex items-center bg-no-repeat py-20 px-4 md:px-8 overflow-hidden border-t border-b border-orange-100/50"
    >
      <!-- Soft warm glow overlays for premium feel -->
      <div
        class="absolute inset-0 bg-gradient-to-r from-amber-50/90 via-amber-50/70 to-transparent pointer-events-none"
      ></div>

      <div class="max-w-7xl mx-auto w-full relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- Text content aligned to the left, taking up 8 columns on large screens to prevent awkward line breaks -->
          <div
            class="lg:col-span-8 xl:col-span-7 space-y-4 sm:space-y-6 text-left bg-white/70 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none p-6 sm:p-8 lg:p-0 rounded-[2rem] border border-orange-200/20 lg:border-none shadow-lg lg:shadow-none reveal"
          >
            <div>
              <span
                class="inline-flex items-center gap-1.5 bg-orange-100/60 border border-orange-200/50 text-[#b25e1d] text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider"
              >
                ✨ Không Gian Cảm Hứng
              </span>
            </div>

            <h2
              class="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-slate-900 uppercase"
            >
              Nâng tầm
              <span
                class="bg-gradient-to-r from-[#b25e1d] to-[#d97706] bg-clip-text text-transparent"
                >góc làm việc & học tập</span
              >
              của bạn
            </h2>

            <p
              class="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium max-w-2xl"
            >
              Góc làm việc gọn gàng, dụng cụ chất lượng là chiếc chìa khóa vạn
              năng khơi dậy động lực sáng tạo mỗi ngày. Hãy cùng Trường Thành
              trang trí không gian học tập và sáng tạo của bạn.
            </p>

            <div class="pt-2">
              <router-link
                to="/products"
                class="inline-flex items-center gap-2 bg-gradient-to-r from-[#b25e1d] to-[#d97706] hover:from-[#964c14] hover:to-[#b45309] text-white font-extrabold text-xs py-3.5 px-7 sm:py-4 sm:px-8 rounded-xl shadow-lg shadow-orange-700/20 hover:shadow-xl transition-all cursor-pointer group"
              >
                <span>Tìm cảm hứng sáng tạo</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2.5"
                  stroke="currentColor"
                  class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3"
                  />
                </svg>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8">
      <div
        class="reveal flex items-end justify-between border-b border-slate-100 pb-4"
      >
        <div class="text-left">
          <span
            class="text-xs font-bold text-rose-600 tracking-[0.2em] uppercase font-black font-bold"
            >Bộ sưu tập nổi bật</span
          >
          <h2
            class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1"
          >
            ✨ Đồ Chơi
          </h2>
        </div>
        <router-link
          :to="'/products?category=' + getCategoryIdBySlug('do-choi')"
          class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group"
        >
          <span>Xem tất cả</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </router-link>
      </div>

      <div
        v-if="loadingToy"
        class="responsive-flex-grid"
      >
        <div
          v-for="n in 5"
          :key="n"
          class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse"
        >
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <div
        v-else
        class="responsive-flex-grid"
      >
        <ProductCard
          v-for="(prod, idx) in toyProducts.slice(0, 10)"
          :key="prod._id"
          :product="prod"
          :class="['reveal-scale', `delay-${(idx % 5) * 100}`]"
          @add-to-cart="addToCart"
        />
      </div>

      <div class="flex justify-center pt-6">
        <router-link
          :to="'/products?category=' + getCategoryIdBySlug('do-choi')"
          class="border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
        >
          Khám Phá Đồ Chơi
        </router-link>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8">
      <div
        class="reveal flex items-end justify-between border-b border-slate-100 pb-4"
      >
        <div class="text-left">
          <span
            class="text-xs font-bold text-rose-600 tracking-[0.2em] uppercase font-black font-bold"
            >Bộ sưu tập nổi bật</span
          >
          <h2
            class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1"
          >
            ✨ Truyện Tranh
          </h2>
        </div>
        <router-link
          :to="'/products?category=' + getCategoryIdBySlug('truyen-tranh')"
          class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group"
        >
          <span>Xem tất cả</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </router-link>
      </div>

      <div
        v-if="loadingComic"
        class="responsive-flex-grid"
      >
        <div
          v-for="n in 5"
          :key="n"
          class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse"
        >
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <div
        v-else
        class="responsive-flex-grid"
      >
        <ProductCard
          v-for="(prod, idx) in comicProducts.slice(0, 10)"
          :key="prod._id"
          :product="prod"
          :class="['reveal-scale', `delay-${(idx % 5) * 100}`]"
          @add-to-cart="addToCart"
        />
      </div>

      <div class="flex justify-center pt-6">
        <router-link
          :to="'/products?category=' + getCategoryIdBySlug('truyen-tranh')"
          class="border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
        >
          Khám Phá Truyện Tranh
        </router-link>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8">
      <div
        class="reveal flex items-end justify-between border-b border-slate-100 pb-4"
      >
        <div class="text-left">
          <span
            class="text-xs font-bold text-rose-600 tracking-[0.2em] uppercase font-black font-bold"
            >Bộ sưu tập nổi bật</span
          >
          <h2
            class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1"
          >
            ✨ COMBO
          </h2>
        </div>
        <router-link
          :to="'/products?category=' + getCategoryIdBySlug('combo')"
          class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group"
        >
          <span>Xem tất cả</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </router-link>
      </div>

      <div
        v-if="loadingCombo"
        class="responsive-flex-grid"
      >
        <div
          v-for="n in 5"
          :key="n"
          class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse"
        >
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <div
        v-else
        class="responsive-flex-grid"
      >
        <ProductCard
          v-for="(prod, idx) in comboProducts.slice(0, 10)"
          :key="prod._id"
          :product="prod"
          :class="['reveal-scale', `delay-${(idx % 5) * 100}`]"
          @add-to-cart="addToCart"
        />
      </div>

      <div class="flex justify-center pt-6">
        <router-link
          :to="'/products?category=' + getCategoryIdBySlug('combo')"
          class="border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
        >
          Khám Phá Combo
        </router-link>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8">
      <div
        class="reveal flex items-end justify-between border-b border-slate-100 pb-4"
      >
        <div class="text-left">
          <span
            class="text-xs font-bold text-rose-600 tracking-[0.2em] uppercase font-black font-bold"
            >Bộ sưu tập nổi bật</span
          >
          <h2
            class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1"
          >
            ✨ Đồ Lưu Niệm
          </h2>
        </div>
        <router-link
          :to="'/products?category=' + getCategoryIdBySlug('do-luu-niem')"
          class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group"
        >
          <span>Xem tất cả</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </router-link>
      </div>

      <div
        v-if="loadingGift"
        class="responsive-flex-grid"
      >
        <div
          v-for="n in 5"
          :key="n"
          class="bg-white rounded-3xl border border-slate-200 p-4 space-y-4 animate-pulse"
        >
          <div class="bg-slate-200 rounded-2xl aspect-square w-full"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
        </div>
      </div>

      <div
        v-else
        class="responsive-flex-grid"
      >
        <ProductCard
          v-for="(prod, idx) in giftProducts.slice(0, 10)"
          :key="prod._id"
          :product="prod"
          :class="['reveal-scale', `delay-${(idx % 5) * 100}`]"
          @add-to-cart="addToCart"
        />
      </div>

      <div class="flex justify-center pt-6">
        <router-link
          :to="'/products?category=' + getCategoryIdBySlug('do-luu-niem')"
          class="border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-300 font-extrabold text-sm px-12 py-3.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md"
        >
          Khám Phá Đồ Lưu Niệm
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useCartStore } from "@/stores/cart";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import { formatCurrency, getDiscountPercent } from "@/utils/helpers";
import ProductCard from "@/components/ProductCard.vue";
import { useScrollReveal } from "@/composables/useScrollReveal";
import type { Product, Category } from "@/types";
import flashSaleBg from "@/assets/flash-sale-bg.png";
import heroStationery from "@/assets/hero_stationery.png";
import sgkBg from "@/assets/sgk-bg.jpg";
import doChoiBg from "@/assets/do-choi-bg.png";
import comboBg from "@/assets/combo-bg.png";
import truyenTranhBg from "@/assets/truyen-tranh-bg.png";
import sachThamKhaoBg from "@/assets/sach-tham-khao-bg.png";
import doLuuNiemBg from "@/assets/do-luu-niem-bg.jpg";
import inspirationBg from "@/assets/inspiration-bg.png";

const cartStore = useCartStore();
const toast = useToast();
const router = useRouter();

function goToDetail(id: string) {
  router.push(`/products/${id}`);
}

function getCatNavIcon(slug: string): string {
  const iconMap: Record<string, string> = {
    "sach-giao-khoa": "📚",
    "sach-tham-khao": "📖",
    "van-phong-pham": "✏️",
    "do-choi": "🧸",
    "truyen-tranh": "📕",
    "do-luu-niem": "🎁",
    combo: "🔥",
  };
  return iconMap[slug] || "📦";
}
const { observeNewElements } = useScrollReveal();

const parentCategories = ref<Category[]>([]);

const navItems = computed(() => {
  if (!parentCategories.value.length) return [];

  const sgk = parentCategories.value.find((c) => c.slug === "sach-giao-khoa");
  const stk = parentCategories.value.find((c) => c.slug === "sach-tham-khao");
  const doChoi = parentCategories.value.find((c) => c.slug === "do-choi");
  const truyenTranh = parentCategories.value.find(
    (c) => c.slug === "truyen-tranh",
  );
  const combo = parentCategories.value.find((c) => c.slug === "combo");
  const luuNiem = parentCategories.value.find((c) => c.slug === "do-luu-niem");

  return [
    {
      name: "Sách giáo khoa",
      to: sgk ? `/products?category=${sgk._id}` : "/products",
      icon: "📚",
    },
    {
      name: "Sách tham khảo",
      to: stk ? `/products?category=${stk._id}` : "/products",
      icon: "📖",
    },
    {
      name: "Văn phòng phẩm",
      to: luuNiem
        ? `/products?category=${luuNiem._id}&search=bút`
        : "/products",
      icon: "✏️",
    },
    {
      name: "Đồ chơi",
      to: doChoi ? `/products?category=${doChoi._id}` : "/products",
      icon: "🧸",
    },
    {
      name: "Truyện tranh",
      to: truyenTranh ? `/products?category=${truyenTranh._id}` : "/products",
      icon: "📕",
    },
    {
      name: "Lưu niệm",
      to: luuNiem ? `/products?category=${luuNiem._id}` : "/products",
      icon: "🎁",
    },
    {
      name: "Combo ưu đãi",
      to: combo ? `/products?category=${combo._id}` : "/products",
      icon: "🔥",
    },
  ];
});

const featuredCategoriesList = computed(() => {
  if (!parentCategories.value.length) return [];

  const sgk = parentCategories.value.find((c) => c.slug === "sach-giao-khoa");
  const stk = parentCategories.value.find((c) => c.slug === "sach-tham-khao");
  const doChoi = parentCategories.value.find((c) => c.slug === "do-choi");
  const combo = parentCategories.value.find((c) => c.slug === "combo");
  const luuNiem = parentCategories.value.find((c) => c.slug === "do-luu-niem");
  const truyenTranh = parentCategories.value.find(
    (c) => c.slug === "truyen-tranh",
  );

  return [
    {
      name: "Sách giáo khoa",
      desc: "Đầy đủ cấp 1, 2, 3",
      bgImage: sgkBg,
      gradient:
        "bg-white border-orange-100 hover:border-orange-300 text-orange-950",
      to: sgk ? `/products?category=${sgk._id}` : "/products",
    },
    {
      name: "Sách tham khảo",
      desc: "Ôn luyện thi nâng cao",
      bgImage: sachThamKhaoBg,
      gradient: "bg-white border-pink-100 hover:border-pink-300 text-pink-950",
      to: stk ? `/products?category=${stk._id}` : "/products",
    },
    {
      name: "Truyện tranh",
      desc: "Manga, anime nổi bật",
      bgImage: truyenTranhBg,
      gradient: "bg-white border-rose-100 hover:border-rose-300 text-rose-950",
      to: truyenTranh ? `/products?category=${truyenTranh._id}` : "/products",
    },
    {
      name: "Văn phòng phẩm",
      desc: "Bút, sổ tay, file hồ sơ",
      bgImage: doLuuNiemBg,
      gradient: "bg-white border-blue-100 hover:border-blue-300 text-blue-950",
      to: luuNiem
        ? `/products?category=${luuNiem._id}&search=bút`
        : "/products",
    },
    {
      name: "Đồ chơi",
      desc: "Lego, Rubik trí tuệ",
      bgImage: doChoiBg,
      gradient:
        "bg-white border-indigo-100 hover:border-indigo-300 text-indigo-950",
      to: doChoi ? `/products?category=${doChoi._id}` : "/products",
    },
    {
      name: "Đồ lưu niệm",
      desc: "Quà tặng, phụ kiện xinh xắn",
      bgImage: doLuuNiemBg,
      gradient:
        "bg-white border-purple-100 hover:border-purple-300 text-purple-950",
      to: luuNiem ? `/products?category=${luuNiem._id}` : "/products",
    },
    {
      name: "Combo ưu đãi",
      desc: "Trọn bộ học tập giá sốc",
      bgImage: comboBg,
      gradient:
        "bg-white border-teal-100 hover:border-teal-300 text-emerald-950",
      to: combo ? `/products?category=${combo._id}` : "/products",
    },
  ];
});

const bestSelling = ref<Product[]>([]);
const discounted = ref<Product[]>([]);
const newProducts = ref<Product[]>([]);

const loadingBest = ref(true);
const loadingDiscount = ref(true);
const loadingNew = ref(true);

const textbookProducts = ref<Product[]>([]);
const referenceProducts = ref<Product[]>([]);
const toyProducts = ref<Product[]>([]);
const comicProducts = ref<Product[]>([]);
const comboProducts = ref<Product[]>([]);
const giftProducts = ref<Product[]>([]);

const loadingTextbook = ref(true);
const loadingReference = ref(true);
const loadingToy = ref(true);
const loadingComic = ref(true);
const loadingCombo = ref(true);
const loadingGift = ref(true);

const getCategoryIdBySlug = (slug: string) => {
  const cat = parentCategories.value.find((c) => c.slug === slug);
  return cat ? cat._id : "";
};

const brokenImages = ref<Record<string, boolean>>({});

function handleImageError(id: string) {
  brokenImages.value[id] = true;
}

const currentPageIndex = ref(0);
const autoplayInterval = ref<any>(null);

const dealPages = computed(() => {
  const pages: Product[][] = [];
  if (!discounted.value || discounted.value.length === 0) return [];
  
  let i = 0;
  while (i < discounted.value.length) {
    const page: Product[] = [];
    for (let j = 0; j < 5; j++) {
      const index = (i + j) % discounted.value.length;
      page.push(discounted.value[index]);
    }
    pages.push(page);
    i += 5;
  }
  return pages;
});

function startAutoplay() {
  stopAutoplay();
  if (dealPages.value.length > 1) {
    autoplayInterval.value = setInterval(() => {
      currentPageIndex.value = (currentPageIndex.value + 1) % dealPages.value.length;
    }, 5000);
  }
}

function stopAutoplay() {
  if (autoplayInterval.value) {
    clearInterval(autoplayInterval.value);
    autoplayInterval.value = null;
  }
}

function nextPage() {
  stopAutoplay();
  if (dealPages.value.length > 0) {
    currentPageIndex.value = (currentPageIndex.value + 1) % dealPages.value.length;
  }
  startAutoplay();
}

function prevPage() {
  stopAutoplay();
  if (dealPages.value.length > 0) {
    currentPageIndex.value = (currentPageIndex.value - 1 + dealPages.value.length) % dealPages.value.length;
  }
  startAutoplay();
}

function setPage(idx: number) {
  stopAutoplay();
  currentPageIndex.value = idx;
  startAutoplay();
}

watch(dealPages, (newPages) => {
  if (newPages.length > 1) {
    startAutoplay();
  } else {
    stopAutoplay();
  }
});

// Countdown timer refs
const hours = ref("00");
const minutes = ref("00");
const seconds = ref("00");
let countdownTimer: any = null;

function startCountdown() {
  const updateTimer = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    if (diff <= 0) {
      return;
    }
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    hours.value = h.toString().padStart(2, "0");
    minutes.value = m.toString().padStart(2, "0");
    seconds.value = s.toString().padStart(2, "0");
  };
  updateTimer();
  countdownTimer = setInterval(updateTimer, 1000);
}

const categoryStyles = [
  {
    gradient:
      "bg-gradient-to-br from-amber-50 to-orange-100/70 text-orange-950 border-orange-200/40 hover:border-orange-300",
    iconColor: "text-orange-600",
    icon: "academic",
    label: "Học tập chính hãng",
    desc: "Sách giáo khoa, sách tham khảo & dụng cụ học sinh đầy đủ",
  },
  {
    gradient:
      "bg-gradient-to-br from-sky-50 to-blue-100/70 text-blue-950 border-blue-200/40 hover:border-blue-300",
    iconColor: "text-blue-600",
    icon: "document",
    label: "Góc làm việc hiện đại",
    desc: "Bút ký cao cấp, sổ tay lập kế hoạch & tài liệu tiện ích",
  },
  {
    gradient:
      "bg-gradient-to-br from-rose-50 to-pink-100/70 text-pink-950 border-pink-200/40 hover:border-pink-300",
    iconColor: "text-pink-600",
    icon: "pencil",
    label: "Mỹ thuật sáng tạo",
    desc: "Màu vẽ chuyên nghiệp, họa cụ sáng tạo & giấy thủ công",
  },
  {
    gradient:
      "bg-gradient-to-br from-fuchsia-50 to-purple-100/70 text-purple-950 border-purple-200/40 hover:border-purple-300",
    iconColor: "text-purple-600",
    icon: "briefcase",
    label: "Quà tặng độc đáo",
    desc: "Bút ký doanh nhân, hộp quà sang trọng nâng tầm đẳng cấp",
  },
  {
    gradient:
      "bg-gradient-to-br from-emerald-50 to-teal-100/70 text-teal-950 border-teal-200/40 hover:border-teal-300",
    iconColor: "text-teal-600",
    icon: "paint",
    label: "Đồ chơi phát triển",
    desc: "Rubik, Lego, bộ đồ chơi rèn luyện tư duy logic & trí tuệ",
  },
  {
    gradient:
      "bg-gradient-to-br from-indigo-50 to-purple-100/70 text-indigo-950 border-indigo-200/40 hover:border-indigo-300",
    iconColor: "text-indigo-600",
    icon: "calculator",
    label: "Hỗ trợ kỹ thuật",
    desc: "Máy tính học sinh Casio, thước vẽ kỹ thuật chính xác cao",
  },
];

function getCategoryStyle(cat: any, index: number) {
  const slug = cat && cat.slug ? cat.slug : "";
  switch (slug) {
    case "sach-giao-khoa":
      return {
        gradient:
          "bg-amber-50/10 text-orange-950 border-orange-200/40 hover:border-orange-300",
        iconColor: "text-orange-600",
        icon: "academic",
        label: "Học tập chính hãng",
        desc: "Sách giáo khoa đầy đủ môn học cho học sinh cấp 1, 2, 3",
        bgImage: sgkBg,
      };
    case "sach-tham-khao":
      return {
        gradient:
          "bg-sky-50/10 text-blue-950 border-blue-200/40 hover:border-blue-300",
        iconColor: "text-blue-600",
        icon: "document",
        label: "Ôn thi & Luyện đề",
        desc: "Sách tham khảo bồi dưỡng học sinh giỏi & ôn tập nâng cao",
        bgImage: sachThamKhaoBg,
      };
    case "truyen-tranh":
      return {
        gradient:
          "bg-rose-50/10 text-pink-950 border-pink-200/40 hover:border-pink-300",
        iconColor: "text-pink-600",
        icon: "paint",
        label: "Giải trí & Manga",
        desc: "Thế giới truyện tranh, manga & nhân vật siêu anh hùng",
        bgImage: truyenTranhBg,
      };
    case "combo":
      return {
        gradient:
          "bg-fuchsia-50/10 text-purple-950 border-purple-200/40 hover:border-purple-300",
        iconColor: "text-purple-600",
        icon: "briefcase",
        label: "Combo siêu tiết kiệm",
        desc: "Set dụng cụ học tập & văn phòng phẩm trọn bộ giá sốc",
        bgImage: comboBg,
      };
    case "do-choi":
      return {
        gradient:
          "bg-emerald-50/10 text-teal-950 border-teal-200/40 hover:border-teal-300",
        iconColor: "text-teal-600",
        icon: "pencil",
        label: "Phát triển tư duy",
        desc: "Lego lắp ráp, Rubik thi đấu & bộ boardgame rèn luyện tư duy",
        bgImage: doChoiBg,
      };
    case "do-luu-niem":
      return {
        gradient:
          "bg-indigo-50/10 text-indigo-950 border-indigo-200/40 hover:border-indigo-300",
        iconColor: "text-indigo-600",
        icon: "tag",
        label: "Quà tặng xinh xắn",
        desc: "Móc khóa Capybara, sổ tay khắc tên & đồ lưu niệm xinh xắn",
        bgImage: doLuuNiemBg,
      };
    default:
      return categoryStyles[index % categoryStyles.length];
  }
}

function getBentoSpanClass(index: number) {
  if (index === 0) return "md:col-span-2 md:row-span-1";
  if (index === 1) return "md:col-span-1 md:row-span-1";
  if (index === 2) return "md:col-span-1 md:row-span-1";
  if (index === 3) return "md:col-span-2 md:row-span-1";
  if (index === 4) return "md:col-span-2 md:row-span-1";
  return "md:col-span-1 md:row-span-1";
}

function getProductPlaceholder(name: string) {
  const nameLower = (name || "").toLowerCase();
  if (
    nameLower.includes("bút") ||
    nameLower.includes("viết") ||
    nameLower.includes("chì")
  ) {
    return {
      gradient: "bg-gradient-to-br from-red-400 to-rose-500",
      icon: "pencil",
    };
  }
  if (
    nameLower.includes("giấy") ||
    nameLower.includes("sổ") ||
    nameLower.includes("vở") ||
    nameLower.includes("tập") ||
    nameLower.includes("note")
  ) {
    return {
      gradient: "bg-gradient-to-br from-emerald-400 to-teal-500",
      icon: "document",
    };
  }
  if (nameLower.includes("máy tính") || nameLower.includes("casio")) {
    return {
      gradient: "bg-gradient-to-br from-indigo-400 to-purple-500",
      icon: "calculator",
    };
  }
  if (
    nameLower.includes("hồ sơ") ||
    nameLower.includes("bìa") ||
    nameLower.includes("kẹp") ||
    nameLower.includes("keo") ||
    nameLower.includes("thước")
  ) {
    return {
      gradient: "bg-gradient-to-br from-blue-400 to-sky-500",
      icon: "folder",
    };
  }
  if (nameLower.includes("combo") || nameLower.includes("văn phòng")) {
    return {
      gradient: "bg-gradient-to-br from-blue-500 to-indigo-600",
      icon: "briefcase",
    };
  }
  if (
    nameLower.includes("học sinh") ||
    nameLower.includes("tiểu học") ||
    nameLower.includes("bộ dụng cụ")
  ) {
    return {
      gradient: "bg-gradient-to-br from-amber-400 to-orange-500",
      icon: "academic",
    };
  }
  return {
    gradient: "bg-gradient-to-br from-pink-400 to-rose-500",
    icon: "tag",
  };
}

onMounted(() => {
  startCountdown();

  categoryService
    .getParents()
    .then(async (catRes) => {
      parentCategories.value = catRes.data;

      const fetchCatProds = async (
        slug: string,
        refVar: any,
        loadingVar: any,
      ) => {
        const cat = parentCategories.value.find((c) => c.slug === slug);
        if (cat) {
          try {
            const res = await productService.getAll({
              category: cat._id,
              limit: 10,
            });
            refVar.value = res.data.data || [];
          } catch (err) {
            console.error(`Error loading products for category ${slug}`, err);
          } finally {
            loadingVar.value = false;
          }
        } else {
          loadingVar.value = false;
        }
      };

      await Promise.all([
        fetchCatProds("sach-giao-khoa", textbookProducts, loadingTextbook),
        fetchCatProds("sach-tham-khao", referenceProducts, loadingReference),
        fetchCatProds("do-choi", toyProducts, loadingToy),
        fetchCatProds("truyen-tranh", comicProducts, loadingComic),
        fetchCatProds("combo", comboProducts, loadingCombo),
        fetchCatProds("do-luu-niem", giftProducts, loadingGift),
      ]);
    })
    .catch((err) => {
      console.error("Error loading parent categories", err);
    });

  productService
    .getBestSelling(10)
    .then((bestRes) => {
      bestSelling.value = bestRes.data;
    })
    .catch((err) => {
      console.error("Error loading best sellers", err);
    })
    .finally(() => {
      loadingBest.value = false;
    });

  productService
    .getDiscounted(50)
    .then((discRes) => {
      discounted.value = discRes.data;
    })
    .catch((err) => {
      console.error("Error loading discounted products", err);
    })
    .finally(() => {
      loadingDiscount.value = false;
    });

  productService
    .getNew(10)
    .then((newRes) => {
      newProducts.value = newRes.data;
    })
    .catch((err) => {
      console.error("Error loading new products", err);
    })
    .finally(() => {
      loadingNew.value = false;
    });

  setTimeout(() => {
    observeNewElements();
  }, 350);
});

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  stopAutoplay();
});

function addToCart(product: Product) {
  cartStore.addToCart(product, 1);
  toast.success(`Đã thêm "${product.name}" vào giỏ hàng`);
}
</script>

<style scoped>
.hero-text {
  animation: hero-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes float-reverse {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(10px);
  }
}

@keyframes pulse-soft {
  0%,
  100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.4;
  }
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

.animate-float-reverse {
  animation: float-reverse 4s ease-in-out infinite;
}

.animate-pulse-soft {
  animation: pulse-soft 3s ease-in-out infinite;
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
