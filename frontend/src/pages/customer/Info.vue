<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <!-- Breadcrumb -->
    <Breadcrumb :items="breadcrumbItems" class="mb-6" />

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- Sidebar Navigation -->
      <aside class="lg:col-span-1 space-y-2">
        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1 sticky top-28">
          <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">
            Thông tin & Chính sách
          </div>
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group/item"
            :class="
              activeTab === tab.id
                ? 'bg-[#dc2626] text-white shadow-md'
                : 'text-slate-750 hover:bg-slate-50'
            "
          >
            <span>{{ tab.title }}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2.5"
              stroke="currentColor"
              class="w-3.5 h-3.5 transition-transform"
              :class="activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover/item:translate-x-0.5'"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </aside>

      <!-- Content Area -->
      <main class="lg:col-span-3">
        <div class="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs min-h-[500px]">
          <!-- Privacy Policy Tab -->
          <article v-if="activeTab === 'privacy'" class="prose prose-slate max-w-none space-y-6">
            <h1 class="text-2xl font-black text-slate-900 border-b border-slate-100 pb-4">
              🛡️ Chính Sách Bảo Mật Thông Tin
            </h1>
            <p class="text-sm text-slate-600 leading-relaxed font-medium">
              Văn Phòng Phẩm Trường Thành cam kết bảo vệ tuyệt đối thông tin riêng tư của khách hàng. Vui lòng đọc kỹ chính sách bảo mật dưới đây để hiểu rõ hơn về các cam kết mà chúng tôi thực hiện.
            </p>

            <div class="space-y-4">
              <section class="space-y-2">
                <h2 class="text-base font-extrabold text-slate-800">1. Thu thập thông tin cá nhân</h2>
                <p class="text-xs text-slate-500 leading-relaxed">
                  Chúng tôi thu thập các thông tin bao gồm: Họ và tên, địa chỉ email, số điện thoại, địa chỉ giao hàng và thông tin đăng nhập khi bạn tạo tài khoản hoặc thực hiện đơn hàng tại website.
                </p>
              </section>

              <section class="space-y-2">
                <h2 class="text-base font-extrabold text-slate-800">2. Mục đích sử dụng thông tin</h2>
                <p class="text-xs text-slate-500 leading-relaxed">
                  Thông tin thu thập được sử dụng cho việc xử lý đơn hàng, giao nhận sản phẩm, chăm sóc khách hàng, thông báo các chương trình khuyến mãi và cải thiện chất lượng dịch vụ của Trường Thành Store.
                </p>
              </section>

              <section class="space-y-2">
                <h2 class="text-base font-extrabold text-slate-800">3. Chia sẻ thông tin khách hàng</h2>
                <p class="text-xs text-slate-500 leading-relaxed">
                  Trường Thành tuyệt đối không bán hay cho thuê thông tin cá nhân của bạn cho bên thứ ba. Chúng tôi chỉ cung cấp thông tin cần thiết cho các đơn vị vận chuyển đối tác (như GHTK, GHN, Viettel Post) nhằm phục vụ công tác giao hàng.
                </p>
              </section>

              <section class="space-y-2">
                <h2 class="text-base font-extrabold text-slate-800">4. Bảo mật dữ liệu tài khoản</h2>
                <p class="text-xs text-slate-500 leading-relaxed">
                  Mật khẩu tài khoản của bạn được mã hóa một chiều ở phía máy chủ. Token phiên đăng nhập trên trình duyệt được mã hóa bảo mật nhằm tránh rò rỉ dữ liệu phiên hoạt động của khách hàng.
                </p>
              </section>
            </div>
          </article>

          <!-- Delivery Policy Tab -->
          <article v-else-if="activeTab === 'shipping'" class="prose prose-slate max-w-none space-y-6">
            <h1 class="text-2xl font-black text-slate-900 border-b border-slate-100 pb-4">
              🚚 Chính Sách Giao Hàng & Đổi Trả
            </h1>
            
            <div class="space-y-6">
              <section class="space-y-3">
                <h2 class="text-base font-extrabold text-slate-800">Chính Sách Vận Chuyển</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                    <p class="text-xs font-extrabold text-slate-800">Phí giao hàng toàn quốc</p>
                    <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                      Phí ship đồng giá 30,000 VND cho tất cả đơn hàng dưới 299,000 VND.
                    </p>
                  </div>
                  <div class="border border-slate-100 rounded-2xl p-4 bg-red-50/10 border-red-100/50">
                    <p class="text-xs font-extrabold text-red-600">Miễn phí giao hàng</p>
                    <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                      Áp dụng cho mọi đơn hàng có giá trị tạm tính từ 299,000 VND trở lên.
                    </p>
                  </div>
                </div>
                <p class="text-xs text-slate-500 leading-relaxed">
                  Thời gian nhận hàng dự kiến từ 2-4 ngày làm việc tùy thuộc vào khoảng cách địa lý (Nội thành Ninh Bình nhận hàng ngay trong ngày hoặc ngày hôm sau).
                </p>
              </section>

              <section class="space-y-3">
                <h2 class="text-base font-extrabold text-slate-800">Chính Sách Đổi Trả (7 Ngày)</h2>
                <ul class="list-disc pl-5 text-xs text-slate-500 space-y-2 leading-relaxed">
                  <li>Khách hàng được quyền đổi hoặc trả hàng trong vòng 7 ngày kể từ ngày nhận hàng thành công.</li>
                  <li>Sản phẩm đổi trả phải còn nguyên nhãn mác, chưa qua sử dụng và không bị hư hại.</li>
                  <li>Nếu sản phẩm bị lỗi sản xuất hoặc sai sót khi đóng gói, Trường Thành sẽ chịu 100% chi phí vận chuyển phát sinh.</li>
                </ul>
              </section>
            </div>
          </article>

          <!-- Terms Tab -->
          <article v-else-if="activeTab === 'terms'" class="prose prose-slate max-w-none space-y-6">
            <h1 class="text-2xl font-black text-slate-900 border-b border-slate-100 pb-4">
              ⚖️ Điều Khoản Dịch Vụ
            </h1>
            <p class="text-sm text-slate-600 leading-relaxed font-medium">
              Chào mừng bạn đến với Trường Thành Stationery. Khi sử dụng dịch vụ tại website, bạn mặc định đồng ý tuân thủ các điều khoản hoạt động sau đây:
            </p>

            <div class="space-y-4 text-xs text-slate-500 leading-relaxed">
              <section class="space-y-1">
                <h2 class="text-sm font-extrabold text-slate-800">1. Quyền sở hữu trí tuệ</h2>
                <p>Mọi nội dung, hình ảnh sản phẩm, thiết kế giao diện trên website đều thuộc quyền sở hữu trí tuệ của Trường Thành Stationery. Hành vi sao chép không xin phép là vi phạm pháp luật.</p>
              </section>
              <section class="space-y-1">
                <h2 class="text-sm font-extrabold text-slate-800">2. Độ chính xác của giá cả & thông tin</h2>
                <p>Chúng tôi luôn nỗ lực hiển thị chính xác nhất về giá sản phẩm và tình trạng tồn kho. Tuy nhiên, trong một số trường hợp hiếm gặp xảy ra lỗi hệ thống, chúng tôi có quyền từ chối hoặc hủy bỏ đơn hàng bị lỗi đó.</p>
              </section>
              <section class="space-y-1">
                <h2 class="text-sm font-extrabold text-slate-800">3. Trách nhiệm người dùng</h2>
                <p>Khách hàng có trách nhiệm bảo mật thông tin mật khẩu đăng nhập cá nhân và cung cấp đúng thông tin giao hàng để tránh thất lạc đơn hàng.</p>
              </section>
            </div>
          </article>

          <!-- Guide Tab -->
          <article v-else-if="activeTab === 'guide'" class="prose prose-slate max-w-none space-y-6">
            <h1 class="text-2xl font-black text-slate-900 border-b border-slate-100 pb-4">
              📝 Hướng Dẫn Đặt Hàng
            </h1>
            
            <div class="space-y-4">
              <div v-for="(step, idx) in guideSteps" :key="idx" class="flex gap-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/30">
                <div class="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                  {{ idx + 1 }}
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-extrabold text-slate-800">{{ step.title }}</p>
                  <p class="text-xs text-slate-500 leading-relaxed">{{ step.desc }}</p>
                </div>
              </div>
            </div>
          </article>

          <!-- Contact Tab -->
          <article v-else-if="activeTab === 'contact'" class="prose prose-slate max-w-none space-y-6">
            <h1 class="text-2xl font-black text-slate-900 border-b border-slate-100 pb-4">
              ✉️ Liên Hệ & Góp Ý
            </h1>
            <p class="text-sm text-slate-600 leading-relaxed font-medium">
              Ý kiến của bạn là động lực giúp Trường Thành Stationery phát triển bền vững hơn mỗi ngày. Mọi thắc mắc vui lòng liên hệ theo các phương thức bên dưới hoặc để lại lời nhắn.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Contact Details -->
              <div class="space-y-4 border border-slate-150 rounded-2xl p-6 bg-slate-50/30">
                <div class="flex items-center gap-3">
                  <span class="text-xl">📞</span>
                  <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase">Hotline chăm sóc</p>
                    <a href="tel:0982938316" class="text-xs font-black text-slate-900 hover:text-red-600 transition-colors">0982938316</a>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xl">✉️</span>
                  <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase">Email phản hồi</p>
                    <a href="mailto:giaoductruongthanh@gmail.com" class="text-xs font-black text-slate-900 hover:text-red-600 transition-colors">giaoductruongthanh@gmail.com</a>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xl">📍</span>
                  <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase">Địa chỉ cửa hàng</p>
                    <p class="text-xs font-bold text-slate-700 leading-snug">Chợ chanh - Nhân Hà, Ninh Bình</p>
                  </div>
                </div>
              </div>

              <!-- Inline Contact Form -->
              <form @submit.prevent="submitFeedback" class="space-y-3">
                <div>
                  <label class="text-[10px] font-bold text-slate-700">Họ và tên của bạn</label>
                  <input
                    v-model="feedback.name"
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
                  />
                </div>
                <div>
                  <label class="text-[10px] font-bold text-slate-700">Số điện thoại / Email</label>
                  <input
                    v-model="feedback.contact"
                    type="text"
                    required
                    placeholder="09xx xxx xxx hoặc email..."
                    class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
                  />
                </div>
                <div>
                  <label class="text-[10px] font-bold text-slate-700">Nội dung góp ý</label>
                  <textarea
                    v-model="feedback.message"
                    rows="3"
                    required
                    placeholder="Hãy viết thắc mắc hoặc ý kiến phản hồi của bạn..."
                    class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:bg-white"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  :disabled="sending"
                  class="w-full bg-slate-950 hover:bg-[#dc2626] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all duration-300 cursor-pointer disabled:bg-slate-300"
                >
                  {{ sending ? 'Đang gửi...' : 'Gửi lời nhắn' }}
                </button>
              </form>
            </div>
          </article>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useSeoMeta } from '@/composables/useSeoMeta'
import Breadcrumb from '@/components/Breadcrumb.vue'

const route = useRoute()
const toast = useToast()

const activeTab = ref((route.query.tab as string) || 'privacy')
const sending = ref(false)

const feedback = ref({
  name: '',
  contact: '',
  message: '',
})

const tabs = [
  { id: 'privacy', title: 'Chính sách bảo mật' },
  { id: 'shipping', title: 'Chính sách giao nhận' },
  { id: 'terms', title: 'Điều khoản dịch vụ' },
  { id: 'guide', title: 'Hướng dẫn đặt hàng' },
  { id: 'contact', title: 'Liên hệ & Góp ý' },
]

const guideSteps = [
  { title: 'Tìm kiếm sản phẩm', desc: 'Sử dụng thanh tìm kiếm hoặc duyệt qua danh mục trên thanh điều hướng để chọn sản phẩm phù hợp nhu cầu.' },
  { title: 'Thêm vào giỏ hàng', desc: 'Chọn số lượng sản phẩm mong muốn rồi bấm "Thêm vào giỏ" hoặc bấm nút mua nhanh ngay trên trang sản phẩm.' },
  { title: 'Điền thông tin đặt hàng', desc: 'Truy cập giỏ hàng, chọn các sản phẩm cần thanh toán và điền chính xác địa chỉ nhận hàng, số điện thoại.' },
  { title: 'Áp dụng mã giảm giá', desc: 'Chọn voucher hoặc nhập mã khuyến mãi tại trang thanh toán để được giảm giá trực tiếp vào tổng tiền.' },
  { title: 'Xác nhận & Chờ giao hàng', desc: 'Chọn hình thức thanh toán COD hoặc chuyển khoản rồi bấm "Đặt hàng". Nhân viên cửa hàng sẽ liên hệ xác nhận đơn.' },
]

// Dynamic page SEO metadata
const activeTabInfo = computed(() => tabs.find(t => t.id === activeTab.value) || tabs[0])

useSeoMeta(() => ({
  title: activeTabInfo.value.title,
  description: `${activeTabInfo.value.title} chính thức của cửa hàng Văn Phòng Phẩm Trường Thành Stationery. Cam kết uy tín, chất lượng.`,
}))

const breadcrumbItems = computed(() => [
  { label: 'Trang chủ', to: '/' },
  { label: activeTabInfo.value.title, to: `/info?tab=${activeTab.value}` },
])

// Watch route query to switch tabs dynamically from external links
watch(() => route.query.tab, (newTab) => {
  if (newTab) {
    activeTab.value = newTab as string
  }
})

async function submitFeedback() {
  sending.value = true
  // Mock sending
  await new Promise(resolve => setTimeout(resolve, 800))
  toast.success('Gửi góp ý thành công! Chúng tôi sẽ phản hồi lại bạn sớm.')
  feedback.value = { name: '', contact: '', message: '' }
  sending.value = false
}
</script>
