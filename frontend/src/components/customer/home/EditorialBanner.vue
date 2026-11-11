<template>
  <!-- Section 5: Editorial Banner -->
  <section
    :style="{
      backgroundImage: optimizedBackground(homeBackgrounds.inspiration),
      backgroundSize: 'cover',
      backgroundPosition: 'right center',
    }"
    class="keep-light relative min-h-[50vh] flex items-center bg-no-repeat py-20 px-4 md:px-8 overflow-hidden border-t border-b border-orange-100/50"
  >
    <!-- Soft warm glow overlays for premium feel -->
    <div
      class="absolute inset-0 bg-gradient-to-r from-amber-50/90 via-amber-50/70 to-transparent pointer-events-none"
    ></div>

    <div class="max-w-[1500px] mx-auto w-full relative z-10">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Text content aligned to the left, taking up 8 columns on large screens to prevent awkward line breaks -->
        <div
          class="lg:col-span-8 xl:col-span-7 space-y-4 sm:space-y-6 text-left reveal"
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
</template>

<script setup lang="ts">
import { homeBackgrounds, optimizedBackground } from './homeBackgrounds'
</script>
