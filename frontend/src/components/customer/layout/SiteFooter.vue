<template>
  <footer
    class="bg-gradient-to-b from-[#0a0f1d] via-[#070b14] to-[#04070d] text-slate-300 border-t border-slate-800/50 font-sans"
  >
    <!-- Top Section: Testimonial & Google Maps -->
    <div
      class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
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
        <form class="space-y-3 pt-2 flex flex-col items-center lg:items-start w-full max-w-md" @submit.prevent="handleNewsletter">
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
            title="Bản đồ cửa hàng Trường Thành"
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
            rel="noopener noreferrer"
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
      class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"
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
            rel="noopener noreferrer"
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
            rel="noopener noreferrer"
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
            rel="noopener noreferrer"
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
              to="/info?tab=privacy"
              class="group flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 font-bold"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-[#dc2626] scale-0 group-hover:scale-100 transition-all duration-300 flex-shrink-0"></span>
              <span class="group-hover:translate-x-1.5 transition-transform duration-300">Chính sách bảo mật</span>
            </router-link>
          </li>
          <li>
            <router-link
              to="/info?tab=shipping"
              class="group flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 font-bold"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-[#dc2626] scale-0 group-hover:scale-100 transition-all duration-300 flex-shrink-0"></span>
              <span class="group-hover:translate-x-1.5 transition-transform duration-300">Chính sách giao hàng</span>
            </router-link>
          </li>
          <li>
            <router-link
              to="/info?tab=terms"
              class="group flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 font-bold"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-[#dc2626] scale-0 group-hover:scale-100 transition-all duration-300 flex-shrink-0"></span>
              <span class="group-hover:translate-x-1.5 transition-transform duration-300">Điều khoản dịch vụ</span>
            </router-link>
          </li>
          <li>
            <router-link
              to="/info?tab=contact"
              class="group flex items-center gap-2 text-slate-400 hover:text-white transition-all duration-300 font-bold"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-[#dc2626] scale-0 group-hover:scale-100 transition-all duration-300 flex-shrink-0"></span>
              <span class="group-hover:translate-x-1.5 transition-transform duration-300">Liên hệ - Góp ý</span>
            </router-link>
          </li>
          <li>
            <router-link
              to="/info?tab=guide"
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
      <div class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="font-medium">© 2026 Trường Thành Stationery. All rights reserved.</p>
        <div class="flex items-center gap-6 text-slate-600 text-[11px] font-semibold">
          <router-link to="/info?tab=privacy" class="hover:text-slate-400 transition-colors">Chính sách bảo mật</router-link>
          <span>•</span>
          <router-link to="/info?tab=terms" class="hover:text-slate-400 transition-colors">Điều khoản dịch vụ</router-link>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'vue-toastification'

const toast = useToast()
const newsletterEmail = ref('')

function handleNewsletter() {
  if (newsletterEmail.value.trim()) {
    toast.success('Đăng ký nhận tin tức thành công!')
    newsletterEmail.value = ''
  } else {
    toast.warning('Vui lòng nhập địa chỉ email hợp lệ.')
  }
}
</script>
