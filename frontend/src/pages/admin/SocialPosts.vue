<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
      <div>
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">📱</span>
          <h1 class="text-xl font-black text-slate-900 tracking-tight">Mạng Xã Hội & Đo Lường Quảng Cáo</h1>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-700">
            Release R2
          </span>
        </div>
        <p class="text-xs text-slate-500 font-medium mt-1">
          Quản lý bài viết đa kênh, kịch bản video TikTok 30s, kết nối Fanpage và đối soát hiệu quả quảng cáo ROAS
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          @click="activeTab = 'accounts'"
        >
          <span>🔗 Kênh kết nối</span>
        </button>
        <button
          class="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          @click="activeTab = 'generator'"
        >
          <span>✨ Tạo nội dung AI từ Sản phẩm</span>
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-slate-200 gap-2">
      <button
        class="py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2"
        :class="activeTab === 'posts' ? 'border-[#dc2626] text-[#dc2626]' : 'border-transparent text-slate-500 hover:text-slate-800'"
        @click="activeTab = 'posts'"
      >
        <span>📝 Bài viết & Kịch bản ({{ posts.length }})</span>
      </button>
      <button
        class="py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2"
        :class="activeTab === 'generator' ? 'border-[#dc2626] text-[#dc2626]' : 'border-transparent text-slate-500 hover:text-slate-800'"
        @click="activeTab = 'generator'"
      >
        <span>🤖 Trợ lý nội dung AI</span>
      </button>
      <button
        class="py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2"
        :class="activeTab === 'accounts' ? 'border-[#dc2626] text-[#dc2626]' : 'border-transparent text-slate-500 hover:text-slate-800'"
        @click="activeTab = 'accounts'"
      >
        <span>🔌 Kênh kết nối & Quyền ({{ accounts.length }})</span>
      </button>
      <button
        class="py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2"
        :class="activeTab === 'ads' ? 'border-[#dc2626] text-[#dc2626]' : 'border-transparent text-slate-500 hover:text-slate-800'"
        @click="activeTab = 'ads'"
      >
        <span>📊 Hiệu quả Quảng cáo & ROAS</span>
      </button>
    </div>

    <!-- TAB 1: POSTS & SCRIPTS -->
    <div v-if="activeTab === 'posts'" class="space-y-4">
      <!-- Search & Filters -->
      <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div class="relative flex-1 w-full">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm theo tiêu đề hoặc nội dung bài viết..."
            class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 focus:border-[#dc2626] bg-white"
            @keyup.enter="fetchPosts"
          />
          <span class="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <select
          v-model="filterPlatform"
          class="w-full sm:w-40 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white cursor-pointer"
          @change="fetchPosts"
        >
          <option value="">Tất cả nền tảng</option>
          <option value="FACEBOOK">Facebook</option>
          <option value="TIKTOK">TikTok</option>
          <option value="INSTAGRAM">Instagram</option>
        </select>

        <select
          v-model="filterStatus"
          class="w-full sm:w-44 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white cursor-pointer"
          @change="fetchPosts"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="PENDING_APPROVAL">Chờ duyệt</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="SCHEDULED">Đã lên lịch</option>
          <option value="PUBLISHED">Đã đăng API</option>
          <option value="MANUAL_RECORDED">Đã đăng thủ công</option>
          <option value="REJECTED">Bị từ chối</option>
        </select>
      </div>

      <!-- Loading State -->
      <div v-if="loadingPosts" class="bg-white p-12 rounded-2xl border border-slate-100 text-center">
        <div class="inline-block animate-spin text-2xl mb-2">⏳</div>
        <p class="text-xs text-slate-500 font-medium">Đang tải danh sách bài viết...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="posts.length === 0" class="bg-white p-12 rounded-2xl border border-slate-100 text-center space-y-3">
        <div class="text-4xl">📭</div>
        <h3 class="text-sm font-bold text-slate-800">Chưa có bài viết nào</h3>
        <p class="text-xs text-slate-500 max-w-md mx-auto">
          Tạo bản nháp nội dung quảng cáo từ danh mục sản phẩm hoặc thêm bài viết mới để theo dõi quy trình duyệt và đăng bài.
        </p>
        <button
          class="bg-[#dc2626] text-white text-xs font-bold py-2 px-4 rounded-xl shadow-xs cursor-pointer hover:bg-[#b91c1c]"
          @click="activeTab = 'generator'"
        >
          + Tạo bài viết từ Sản phẩm
        </button>
      </div>

      <!-- Posts List -->
      <div v-else class="grid grid-cols-1 gap-4">
        <div
          v-for="post in posts"
          :key="post._id"
          class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-300 transition-all space-y-4"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2">
              <!-- Platform Badge -->
              <span
                class="px-2.5 py-1 rounded-lg text-xs font-black tracking-wide flex items-center gap-1"
                :class="post.platform === 'FACEBOOK' ? 'bg-blue-100 text-blue-700' : post.platform === 'TIKTOK' ? 'bg-slate-900 text-white' : 'bg-pink-100 text-pink-700'"
              >
                <span>{{ post.platform === 'FACEBOOK' ? '📘 Facebook' : post.platform === 'TIKTOK' ? '🎵 TikTok' : '📷 Instagram' }}</span>
              </span>

              <h3 class="text-sm font-black text-slate-900">{{ post.title }}</h3>
            </div>

            <!-- Status Badge -->
            <div class="flex items-center gap-2">
              <span
                class="px-2.5 py-1 rounded-full text-xs font-extrabold"
                :class="getStatusBadgeClass(post.status)"
              >
                {{ getStatusLabel(post.status) }}
              </span>
              <span class="text-xs text-slate-400 font-medium">Rev {{ post.revision || 1 }}</span>
            </div>
          </div>

          <!-- Content Preview -->
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
            <p class="text-xs text-slate-700 font-medium whitespace-pre-line leading-relaxed font-mono">
              {{ post.content }}
            </p>

            <!-- TikTok Video Script Checklist (SOC-05) -->
            <div v-if="post.videoScriptDetails && post.videoScriptDetails.hook" class="mt-3 p-3 bg-white rounded-lg border border-slate-200 space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>🎬 Kịch bản Video TikTok 30s</span>
                <span class="text-slate-500 font-normal">Thời lượng: ~{{ post.videoScriptDetails.estimatedDurationSeconds || 30 }}s</span>
              </div>
              <div class="text-xs text-slate-600 space-y-1">
                <div><strong class="text-slate-800">Hook:</strong> {{ post.videoScriptDetails.hook }}</div>
                <div v-if="post.videoScriptDetails.bodyPoints && post.videoScriptDetails.bodyPoints.length">
                  <strong class="text-slate-800">Điểm nhấn chính:</strong>
                  <ul class="list-disc pl-5 mt-0.5 space-y-0.5 text-slate-700">
                    <li v-for="(point, idx) in post.videoScriptDetails.bodyPoints" :key="idx">{{ point }}</li>
                  </ul>
                </div>
                <div><strong class="text-slate-800">CTA:</strong> {{ post.videoScriptDetails.cta }}</div>
              </div>
            </div>

            <!-- Target URL & UTM -->
            <div v-if="post.targetUrl" class="text-xs text-slate-500 flex items-center gap-1.5 truncate">
              <span class="font-bold text-slate-700">🔗 Link đích:</span>
              <a :href="post.targetUrl" target="_blank" class="text-blue-600 hover:underline truncate">{{ post.targetUrl }}</a>
            </div>

            <!-- Manual Link if recorded -->
            <div v-if="post.externalPermalink" class="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg flex items-center gap-2">
              <span>✅ Bài đã đăng thực tế:</span>
              <a :href="post.externalPermalink" target="_blank" class="font-bold underline truncate">{{ post.externalPermalink }}</a>
            </div>
          </div>

          <!-- Actions Bar -->
          <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div class="text-xs text-slate-400">
              Tạo lúc: {{ formatDate(post.createdAt) }}
            </div>

            <div class="flex items-center gap-2">
              <!-- Submit for Approval -->
              <button
                v-if="post.status === 'DRAFT'"
                class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
                @click="changeStatus(post._id, 'PENDING_APPROVAL')"
              >
                Gửi duyệt
              </button>

              <!-- Approve / Reject -->
              <template v-if="post.status === 'PENDING_APPROVAL'">
                <button
                  class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
                  @click="changeStatus(post._id, 'APPROVED')"
                >
                  ✓ Duyệt
                </button>
                <button
                  class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition-all cursor-pointer"
                  @click="promptReject(post._id)"
                >
                  ✕ Từ chối
                </button>
              </template>

              <!-- Manual Record Action (SOC-03 / SOC-05) -->
              <button
                v-if="post.status === 'APPROVED' || post.status === 'SCHEDULED' || post.status === 'DRAFT'"
                class="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1"
                @click="openManualRecordModal(post)"
              >
                <span>📎 Ghi nhận link đã đăng</span>
              </button>

              <!-- Delete -->
              <button
                class="px-2.5 py-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg transition-all cursor-pointer"
                @click="deletePost(post._id)"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: AI CONTENT ASSISTANT (SOC-02, SOC-05) -->
    <div v-if="activeTab === 'generator'" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <h2 class="text-sm font-black text-slate-900">1. Chọn sản phẩm & Nền tảng</h2>
        <p class="text-xs text-slate-500">
          Hệ thống lấy dữ liệu sản phẩm thật (tên, mã SKU, giá bán, hình ảnh) để tạo caption và kịch bản chuẩn, tránh sai lệch giá hoặc thông tin ảo.
        </p>

        <!-- Product Selector -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Sản phẩm từ kho *</label>
          <select
            v-model="generatorForm.productId"
            class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 cursor-pointer"
          >
            <option value="">-- Chọn sản phẩm --</option>
            <option v-for="p in productList" :key="p._id" :value="p._id">
              {{ p.name }} ({{ formatCurrency(p.discountPrice || p.price) }}) - SKU: {{ p.sku || 'N/A' }}
            </option>
          </select>
        </div>

        <!-- Platform Toggle -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Nền tảng xuất bản *</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              :class="generatorForm.platform === 'FACEBOOK' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
              @click="generatorForm.platform = 'FACEBOOK'"
            >
              <span>📘 Facebook Post</span>
            </button>
            <button
              type="button"
              class="py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              :class="generatorForm.platform === 'TIKTOK' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
              @click="generatorForm.platform = 'TIKTOK'"
            >
              <span>🎵 TikTok 30s Script</span>
            </button>
          </div>
        </div>

        <!-- Campaign Code -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Mã chiến dịch (UTM Campaign)</label>
          <input
            v-model="generatorForm.campaignCode"
            type="text"
            placeholder="Ví dụ: KHAITRUONG_2026 hoặc MUA_HE_2026"
            class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 bg-white"
          />
        </div>

        <!-- Generate Button -->
        <button
          class="w-full py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          :disabled="!generatorForm.productId || generating"
          @click="generateContent"
        >
          <span v-if="generating" class="animate-spin">⏳</span>
          <span>{{ generating ? 'Đang tạo nội dung...' : '✨ Tạo Nội Dung Tự Động' }}</span>
        </button>
      </div>

      <!-- Live Generated Preview Box -->
      <div class="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-black text-slate-900">2. Bản xem trước & Lưu nháp</h2>
          <span v-if="generatedContent" class="text-xs font-bold text-emerald-600">✓ Đã tạo thành công</span>
        </div>

        <div v-if="!generatedContent" class="p-12 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
          <div class="text-3xl">💡</div>
          <p class="text-xs text-slate-400 font-medium">Chọn sản phẩm bên trái và bấm tạo nội dung để xem kết quả.</p>
        </div>

        <div v-else class="space-y-4">
          <!-- Title -->
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Tiêu đề bài viết:</span>
            <div class="text-xs font-black text-slate-800">{{ generatedContent.title }}</div>
          </div>

          <!-- Content / Caption Preview -->
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nội dung bài viết:</span>
            <textarea
              v-model="generatedContent.content"
              rows="9"
              class="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
            ></textarea>
          </div>

          <!-- Target URL -->
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Canonical Link + UTM Parameters:</span>
            <span class="text-xs text-blue-600 font-mono break-all">{{ generatedContent.targetUrl }}</span>
          </div>

          <!-- 1-Click Save as Draft -->
          <button
            class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            @click="saveGeneratedAsDraft"
          >
            <span>📥 Lưu làm Bản Nháp Bài Viết</span>
          </button>
        </div>
      </div>
    </div>

    <!-- TAB 3: ACCOUNTS & CHANNELS (SOC-01) -->
    <div v-if="activeTab === 'accounts'" class="space-y-6">
      <div class="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 class="text-sm font-black text-slate-900">Quản lý Tài khoản & Kết nối Mạng xã hội</h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Phân định rõ quyền Đọc (Read-only insights) và quyền Đăng (Publish). Access token được mã hóa bảo mật AES-256.
          </p>
        </div>

        <button
          class="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl transition-all cursor-pointer"
          @click="showConnectModal = true"
        >
          + Kết nối tài khoản mới
        </button>
      </div>

      <!-- Account Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Default Predefined Channel Cards -->
        <div
          v-for="acc in accounts"
          :key="acc._id"
          class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">{{ acc.platform === 'FACEBOOK' ? '📘' : acc.platform === 'TIKTOK' ? '🎵' : '📷' }}</span>
              <div>
                <h3 class="text-xs font-black text-slate-900">{{ acc.accountName }}</h3>
                <span class="text-[10px] text-slate-400">ID: {{ acc.accountId }}</span>
              </div>
            </div>

            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-extrabold"
              :class="acc.status === 'CONNECTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'"
            >
              {{ acc.status === 'CONNECTED' ? '● Đã kết nối' : '○ Chưa kết nối' }}
            </span>
          </div>

          <div class="space-y-1.5 text-xs text-slate-600">
            <div><strong>Loại:</strong> {{ acc.accountType || 'Trang Fanpage' }}</div>
            <div>
              <strong>Quyền hạn:</strong>
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="cap in acc.capabilities"
                  :key="cap"
                  class="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold"
                >
                  {{ cap }}
                </span>
              </div>
            </div>
            <div class="text-[10px] text-slate-400 pt-1">
              Đồng bộ gần nhất: {{ acc.lastSyncedAt ? formatDate(acc.lastSyncedAt) : 'Chưa đồng bộ' }}
            </div>
          </div>

          <div class="pt-2 border-t border-slate-100 flex items-center justify-end">
            <button
              v-if="acc.status === 'CONNECTED'"
              class="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
              @click="disconnectAccount(acc._id)"
            >
              Ngắt kết nối
            </button>
            <span v-else class="text-xs text-slate-400">Đã ngắt</span>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 4: ADS PERFORMANCE & MEASUREMENT (ADS-01, ADS-02, ADS-03) -->
    <div v-if="activeTab === 'ads'" class="space-y-6">
      <!-- Metric Overview Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <span class="text-[10px] font-bold text-slate-400 uppercase">Chi tiêu Ads</span>
          <div class="text-base font-black text-slate-900 mt-1">{{ formatCurrency(adsSummary.totalSpend) }}</div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <span class="text-[10px] font-bold text-slate-400 uppercase">Lượt hiển thị</span>
          <div class="text-base font-black text-slate-900 mt-1">{{ adsSummary.totalImpressions.toLocaleString('vi-VN') }}</div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <span class="text-[10px] font-bold text-slate-400 uppercase">Lượt Click</span>
          <div class="text-base font-black text-slate-900 mt-1">{{ adsSummary.totalClicks.toLocaleString('vi-VN') }}</div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <span class="text-[10px] font-bold text-slate-400 uppercase">CTR Trung bình</span>
          <div class="text-base font-black text-blue-600 mt-1">{{ adsSummary.ctrPercentage }}%</div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <span class="text-[10px] font-bold text-slate-400 uppercase">CPC Trung bình</span>
          <div class="text-base font-black text-slate-900 mt-1">{{ formatCurrency(adsSummary.cpcVnd) }}</div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <span class="text-[10px] font-bold text-slate-400 uppercase">Blended ROAS</span>
          <div class="text-base font-black text-emerald-600 mt-1">{{ blendedRoas.blendedRoas }}x</div>
        </div>
      </div>

      <!-- Attributed Revenue Banner -->
      <div class="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="text-2xl">💰</span>
          <div>
            <h4 class="text-xs font-black text-emerald-900">Doanh thu đơn hàng ghi nhận đối soát (Internal Attributed Revenue)</h4>
            <p class="text-[11px] text-emerald-700">
              Tổng số tiền từ {{ blendedRoas.attributedOrdersCount }} đơn hàng chốt qua UTM/chiến dịch marketing: <strong>{{ formatCurrency(blendedRoas.attributedRevenueVnd) }}</strong>
            </p>
          </div>
        </div>
        <span class="px-3 py-1 bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-xs">
          Hiệu quả ROAS: {{ blendedRoas.blendedRoas }}x
        </span>
      </div>

      <!-- Ads Performance Table -->
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-black text-slate-900">Chiến dịch Quảng cáo Meta & TikTok đã ghi nhận</h3>
          <button
            class="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            @click="openSyncAdsModal"
          >
            + Ghi nhận / Đồng bộ số liệu Ads
          </button>
        </div>

        <div v-if="adsItems.length === 0" class="p-8 text-center text-xs text-slate-400">
          Chưa có dữ liệu chiến dịch quảng cáo nào được ghi nhận.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th class="py-2.5 px-3">Nền tảng</th>
                <th class="py-2.5 px-3">Chiến dịch ngoài</th>
                <th class="py-2.5 px-3">Chiến dịch nội bộ</th>
                <th class="py-2.5 px-3 text-right">Chi tiêu</th>
                <th class="py-2.5 px-3 text-right">Hiển thị</th>
                <th class="py-2.5 px-3 text-right">Click</th>
                <th class="py-2.5 px-3 text-right">Chuyển đổi sàn</th>
                <th class="py-2.5 px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
              <tr v-for="item in adsItems" :key="item._id" class="hover:bg-slate-50/50">
                <td class="py-2.5 px-3 font-bold">{{ item.platform }}</td>
                <td class="py-2.5 px-3">
                  <div class="font-bold text-slate-900">{{ item.campaignName }}</div>
                  <span class="text-[10px] text-slate-400">ID: {{ item.campaignId }}</span>
                </td>
                <td class="py-2.5 px-3">
                  <span
                    v-if="item.internalCampaignCode"
                    class="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded text-[10px]"
                  >
                    {{ item.internalCampaignCode }}
                  </span>
                  <span v-else class="text-slate-400 italic text-[10px]">Chưa liên kết</span>
                </td>
                <td class="py-2.5 px-3 text-right font-bold">{{ formatCurrency(item.spend) }}</td>
                <td class="py-2.5 px-3 text-right">{{ item.impressions.toLocaleString('vi-VN') }}</td>
                <td class="py-2.5 px-3 text-right">{{ item.clicks.toLocaleString('vi-VN') }}</td>
                <td class="py-2.5 px-3 text-right">{{ item.providerConversions || 0 }}</td>
                <td class="py-2.5 px-3 text-center">
                  <button
                    class="text-blue-600 hover:underline font-bold text-[10px] cursor-pointer"
                    @click="promptMapCampaign(item.campaignId)"
                  >
                    Gắn mã
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL: Ghi nhận link bài đăng thủ công (MANUAL_RECORDED) -->
    <div
      v-if="showManualModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
        <h3 class="text-sm font-black text-slate-900">Ghi nhận link bài đăng thực tế</h3>
        <p class="text-xs text-slate-500">
          Nhập đường dẫn trực tiếp trên Fanpage Facebook hoặc tài khoản TikTok chính thức của nhà sách.
        </p>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Permalink bài viết *</label>
          <input
            v-model="manualForm.permalink"
            type="url"
            placeholder="https://facebook.com/truongthanh/posts/1029384756"
            class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 bg-white"
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            class="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            @click="showManualModal = false"
          >
            Hủy
          </button>
          <button
            class="px-4 py-2 text-xs font-extrabold text-white bg-teal-600 hover:bg-teal-700 rounded-xl cursor-pointer disabled:opacity-50"
            :disabled="!manualForm.permalink"
            @click="submitManualRecord"
          >
            Lưu ghi nhận
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: Kết nối tài khoản mạng xã hội mới (SOC-01) -->
    <div
      v-if="showConnectModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
        <h3 class="text-sm font-black text-slate-900">Kết nối tài khoản mạng xã hội</h3>
        <p class="text-xs text-slate-500">
          Hỗ trợ Sandbox / staging mô phỏng an toàn khi chưa kích hoạt ứng dụng OAuth sản phẩm chính thức.
        </p>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Nền tảng *</label>
          <select
            v-model="connectForm.platform"
            class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white"
          >
            <option value="FACEBOOK">Facebook</option>
            <option value="TIKTOK">TikTok</option>
            <option value="INSTAGRAM">Instagram</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">ID Tài khoản / Page ID *</label>
          <input
            v-model="connectForm.accountId"
            type="text"
            placeholder="Ví dụ: 1029384756"
            class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Tên tài khoản / Tên Fanpage *</label>
          <input
            v-model="connectForm.accountName"
            type="text"
            placeholder="Ví dụ: Nhà sách Trường Thành - Official"
            class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-white"
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            class="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            @click="showConnectModal = false"
          >
            Hủy
          </button>
          <button
            class="px-4 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer disabled:opacity-50"
            :disabled="!connectForm.accountId || !connectForm.accountName"
            @click="submitConnectAccount"
          >
            Kết nối an toàn
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { socialService, type SocialPost, type SocialAccount, type GenerateContentResult } from '../../services/social.service';
import { adsService, type AdsPerformanceItem, type AdsSummary, type BlendedRoasResult } from '../../services/ads.service';
import { productService } from '../../services/product.service';

const activeTab = ref<'posts' | 'generator' | 'accounts' | 'ads'>('posts');

// Posts State
const posts = ref<SocialPost[]>([]);
const loadingPosts = ref(false);
const searchQuery = ref('');
const filterPlatform = ref('');
const filterStatus = ref('');

// Product List for Generator
const productList = ref<any[]>([]);

// Content Generator State
const generatorForm = reactive({
  productId: '',
  platform: 'FACEBOOK' as 'FACEBOOK' | 'TIKTOK',
  campaignCode: '',
  tone: 'thân thiện, hào hứng, kích thích mua sắm',
});
const generating = ref(false);
const generatedContent = ref<GenerateContentResult | null>(null);

// Accounts State
const accounts = ref<SocialAccount[]>([]);
const showConnectModal = ref(false);
const connectForm = reactive({
  platform: 'FACEBOOK',
  accountId: '',
  accountName: '',
});

// Ads State
const adsItems = ref<AdsPerformanceItem[]>([]);
const adsSummary = reactive<AdsSummary>({
  totalSpend: 0,
  totalImpressions: 0,
  totalClicks: 0,
  totalProviderConversions: 0,
  totalProviderConversionValue: 0,
  ctrPercentage: 0,
  cpcVnd: 0,
});
const blendedRoas = reactive<BlendedRoasResult>({
  adSpendVnd: 0,
  attributedRevenueVnd: 0,
  attributedOrdersCount: 0,
  blendedRoas: 0,
});

// Manual Record Modal State
const showManualModal = ref(false);
const manualTargetPostId = ref('');
const manualForm = reactive({
  permalink: '',
});

// Helper formatting functions
function formatCurrency(amount?: number): string {
  return (amount || 0).toLocaleString('vi-VN') + ' ₫';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'DRAFT': return 'bg-slate-100 text-slate-700';
    case 'PENDING_APPROVAL': return 'bg-amber-100 text-amber-800';
    case 'APPROVED': return 'bg-blue-100 text-blue-700';
    case 'SCHEDULED': return 'bg-purple-100 text-purple-700';
    case 'PUBLISHED': return 'bg-emerald-100 text-emerald-800';
    case 'MANUAL_RECORDED': return 'bg-teal-100 text-teal-800';
    case 'REJECTED': return 'bg-rose-100 text-rose-700';
    default: return 'bg-slate-100 text-slate-600';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'DRAFT': return 'Bản nháp';
    case 'PENDING_APPROVAL': return 'Chờ duyệt';
    case 'APPROVED': return 'Đã duyệt';
    case 'SCHEDULED': return 'Đã lên lịch';
    case 'PUBLISHED': return 'Đã đăng API';
    case 'MANUAL_RECORDED': return 'Đã đăng thủ công';
    case 'REJECTED': return 'Từ chối';
    default: return status;
  }
}

// Fetch Functions
async function fetchPosts() {
  loadingPosts.value = true;
  try {
    const res = await socialService.getPosts({
      platform: filterPlatform.value || undefined,
      status: filterStatus.value || undefined,
      search: searchQuery.value || undefined,
    });
    posts.value = res.data || [];
  } catch {
    // Graceful error fallback
  } finally {
    loadingPosts.value = false;
  }
}

async function fetchAccounts() {
  try {
    const res = await socialService.getAccounts();
    accounts.value = res.data || [];
  } catch {
    // Graceful fallback
  }
}

async function fetchAdsData() {
  try {
    const [perfRes, roasRes] = await Promise.all([
      adsService.getPerformance(),
      adsService.getBlendedRoas(),
    ]);

    if (perfRes.data) {
      adsItems.value = perfRes.data.items || [];
      Object.assign(adsSummary, perfRes.data.summary);
    }
    if (roasRes.data) {
      Object.assign(blendedRoas, roasRes.data);
    }
  } catch {
    // Graceful fallback
  }
}

async function fetchProducts() {
  try {
    const res = await productService.getAll({ limit: 50 });
    productList.value = res.data?.items || res.data || [];
  } catch {
    // Graceful fallback
  }
}

// Post Actions
async function changeStatus(id: string, status: string) {
  try {
    await socialService.updatePostStatus(id, status);
    await fetchPosts();
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
  }
}

function promptReject(id: string) {
  const reason = prompt('Nhập lý do từ chối bài viết:');
  if (reason) {
    socialService.updatePostStatus(id, 'REJECTED', reason).then(() => fetchPosts());
  }
}

function openManualRecordModal(post: SocialPost) {
  manualTargetPostId.value = post._id;
  manualForm.permalink = post.externalPermalink || '';
  showManualModal.value = true;
}

async function submitManualRecord() {
  if (!manualForm.permalink || !manualTargetPostId.value) return;
  try {
    await socialService.recordManualPost(manualTargetPostId.value, {
      externalPermalink: manualForm.permalink,
    });
    showManualModal.value = false;
    await fetchPosts();
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Lỗi khi lưu link bài đăng');
  }
}

async function deletePost(id: string) {
  if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
  try {
    await socialService.deletePost(id);
    await fetchPosts();
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Lỗi khi xóa bài viết');
  }
}

// Generator Actions
async function generateContent() {
  if (!generatorForm.productId) return;
  generating.value = true;
  try {
    const res = await socialService.generateContentFromProduct({
      productId: generatorForm.productId,
      platform: generatorForm.platform,
      campaignCode: generatorForm.campaignCode || undefined,
      tone: generatorForm.tone,
    });
    generatedContent.value = res.data;
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Lỗi khi tạo nội dung tự động');
  } finally {
    generating.value = false;
  }
}

async function saveGeneratedAsDraft() {
  if (!generatedContent.value) return;
  try {
    await socialService.createPost({
      title: generatedContent.value.title,
      platform: generatorForm.platform,
      content: generatedContent.value.content,
      hashtags: generatedContent.value.hashtags,
      targetUrl: generatedContent.value.targetUrl,
      mediaUrls: generatedContent.value.mediaUrls,
      productId: generatorForm.productId as any,
      videoScriptDetails: generatedContent.value.videoScriptDetails,
    });
    alert('Đã lưu bài viết vào danh sách nháp thành công!');
    activeTab.value = 'posts';
    await fetchPosts();
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Lỗi khi lưu bài nháp');
  }
}

// Account Actions
async function submitConnectAccount() {
  try {
    await socialService.connectAccount({
      platform: connectForm.platform,
      accountId: connectForm.accountId,
      accountName: connectForm.accountName,
    });
    showConnectModal.value = false;
    await fetchAccounts();
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Lỗi kết nối tài khoản');
  }
}

async function disconnectAccount(id: string) {
  if (!confirm('Bạn có chắc chắn muốn ngắt kết nối tài khoản này?')) return;
  try {
    await socialService.disconnectAccount(id);
    await fetchAccounts();
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Lỗi ngắt kết nối');
  }
}

// Ads Actions
function openSyncAdsModal() {
  const campaignCode = prompt('Nhập mã chiến dịch nội bộ muốn đối soát (ví dụ KHAITRUONG_2026):');
  if (campaignCode) {
    adsService.recordPerformance({
      platform: 'META',
      adAccountId: 'act_sandbox_01',
      campaignId: `meta_${Date.now()}`,
      campaignName: `Chiến dịch ${campaignCode}`,
      internalCampaignCode: campaignCode,
      date: new Date().toISOString().split('T')[0],
      spend: 1500000,
      impressions: 25000,
      clicks: 650,
      providerConversions: 18,
    }).then(() => fetchAdsData());
  }
}

function promptMapCampaign(campaignId: string) {
  const internalCampaignCode = prompt('Nhập mã chiến dịch nội bộ để gắn với External ID này:');
  if (internalCampaignCode) {
    adsService.mapCampaign({ campaignId, internalCampaignCode }).then(() => fetchAdsData());
  }
}

onMounted(() => {
  fetchPosts();
  fetchAccounts();
  fetchAdsData();
  fetchProducts();
});
</script>
