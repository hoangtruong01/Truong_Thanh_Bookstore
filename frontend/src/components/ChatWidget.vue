<template>
  <div class="fixed bottom-6 right-6 z-50 font-sans">
    <!-- Chat Button -->
    <button
      v-if="!isOpen"
      @click="isOpen = true"
      class="bg-[#dc2626] hover:bg-[#b91c1c] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer group relative"
      aria-label="Mở chat hỗ trợ"
    >
      <span class="absolute -top-1 -right-1 flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
      </span>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
      </svg>
    </button>

    <!-- Chat Window -->
    <div
      v-else
      class="bg-white rounded-3xl shadow-2xl w-80 sm:w-96 h-[500px] border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 scale-100 origin-bottom-right"
    >
      <!-- Chat Header -->
      <div class="bg-[#dc2626] text-white px-5 py-4 flex items-center justify-between shadow-md">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg border border-white/10">
            🤖
          </div>
          <div>
            <h4 class="text-xs font-black tracking-wide uppercase">Trường Thành Bot</h4>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <span class="text-[9.5px] text-white/80 font-bold">Hỗ trợ tự động trực tuyến</span>
            </div>
          </div>
        </div>
        <button
          @click="isOpen = false"
          class="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Messages Box -->
      <div ref="messageBox" class="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50">
        <!-- Message list -->
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          :class="['flex items-start gap-2.5 max-w-[85%]', msg.sender === 'user' ? 'ml-auto flex-row-reverse text-right' : 'text-left']"
        >
          <!-- Bot Avatar -->
          <div v-if="msg.sender === 'bot'" class="w-7 h-7 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-xs flex-shrink-0">
            🤖
          </div>
          
          <div class="space-y-1">
            <div
              :class="[
                'text-xs p-3 rounded-2xl leading-relaxed whitespace-pre-line shadow-xs',
                msg.sender === 'user'
                  ? 'bg-[#dc2626] text-white rounded-tr-none'
                  : 'bg-white text-slate-700 border border-slate-150 rounded-tl-none'
              ]"
            >
              {{ msg.text }}
            </div>
            <span class="text-[8.5px] text-slate-400 font-bold block px-1">
              {{ formatTime(msg.timestamp) }}
            </span>
          </div>
        </div>

        <!-- Inline FAQ Options Menu -->
        <div v-if="showFaqMenu" class="flex flex-col gap-2 pl-9">
          <p class="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">
            Chọn câu hỏi quan tâm:
          </p>
          <button
            v-for="faq in faqOptions"
            :key="faq.id"
            @click="selectFaq(faq)"
            class="text-left text-xs bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer hover:border-[#dc2626]/40"
          >
            💡 {{ faq.question }}
          </button>
        </div>
      </div>

      <!-- Chat Input -->
      <form @submit.prevent="sendMessage" class="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          v-model="inputText"
          type="text"
          placeholder="Nhập câu hỏi của bạn..."
          class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:bg-white"
        />
        <button
          type="submit"
          :disabled="!inputText.trim()"
          class="bg-[#dc2626] hover:bg-[#b91c1c] text-white p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer disabled:bg-slate-200 disabled:text-slate-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const isOpen = ref(false)
const inputText = ref('')
const messageBox = ref<HTMLElement | null>(null)
const showFaqMenu = ref(true)

interface Message {
  sender: 'user' | 'bot'
  text: string
  timestamp: Date
}

const messages = ref<Message[]>([
  {
    sender: 'bot',
    text: 'Xin chào! Tôi là Trợ lý ảo của Nhà sách Trường Thành. Tôi có thể giúp gì cho bạn hôm nay?',
    timestamp: new Date(),
  },
])

const faqOptions = [
  { id: 'points', question: 'Chương trình tích điểm & Tiers', keyword: 'loyalty' },
  { id: 'shipping', question: 'Chính sách vận chuyển', keyword: 'ship' },
  { id: 'hours', question: 'Thời gian hoạt động', keyword: 'giờ mở cửa' },
  { id: 'contact', question: 'Liên hệ hỗ trợ khách hàng', keyword: 'liên hệ' },
]

function formatTime(d: Date) {
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function selectFaq(faq: typeof faqOptions[0]) {
  inputText.value = faq.question
  sendMessage()
}

async function sendMessage() {
  const query = inputText.value.trim()
  if (!query) return

  messages.value.push({
    sender: 'user',
    text: query,
    timestamp: new Date(),
  })

  inputText.value = ''
  showFaqMenu.value = false
  scrollToBottom()

  // Generate automated reply
  setTimeout(() => {
    const reply = getBotReply(query)
    messages.value.push({
      sender: 'bot',
      text: reply,
      timestamp: new Date(),
    })
    showFaqMenu.value = true
    scrollToBottom()
  }, 600)
}

function getBotReply(query: string): string {
  const q = query.toLowerCase()

  if (q.includes('điểm') || q.includes('tích lũy') || q.includes('loyalty') || q.includes('hạng')) {
    return `Chương trình thành viên Trường Thành Bookstore:
• 1.000 VNĐ chi tiêu = 1 Điểm tích lũy.
• Tự động nâng hạng thành viên dựa trên tổng số điểm:
  - Hạng ĐỒNG (Bronze): 0 - 499 điểm.
  - Hạng BẠC (Silver): 500 - 1.999 điểm.
  - Hạng VÀNG (Gold): 2.000 - 4.999 điểm.
  - Hạng KIM CƯƠNG (Diamond): Từ 5.000 điểm trở lên.
• Quyền lợi: Giảm giá đặc quyền trực tiếp theo hạng thành viên và nhiều quà tặng sinh nhật hấp dẫn!`
  }

  if (q.includes('ship') || q.includes('vận chuyển') || q.includes('giao hàng')) {
    return `Chính sách vận chuyển tại Trường Thành Bookstore:
• Miễn phí giao hàng toàn quốc đối với các đơn hàng từ 299.000 VNĐ trở lên.
• Đơn hàng dưới 299.000 VNĐ phí ship chỉ từ 20.000 - 30.000 VNĐ tùy khu vực.
• Thời gian giao hàng:
  - Nội thành: 1 - 2 ngày làm việc.
  - Ngoại thành và các tỉnh khác: 2 - 4 ngày làm việc.`
  }

  if (q.includes('giờ') || q.includes('mở cửa') || q.includes('thời gian') || q.includes('hoạt động')) {
    return `Nhà sách Trường Thành hoạt động liên tục các ngày trong tuần:
• Thời gian làm việc: 08:00 đến 22:00 hàng ngày (bao gồm cả thứ Bảy, Chủ Nhật và các ngày lễ tết).`
  }

  if (q.includes('liên hệ') || q.includes('hotline') || q.includes('sđt') || q.includes('điện thoại')) {
    return `Bạn có thể kết nối với chúng tôi qua các kênh hỗ trợ khách hàng:
• Hotline hỗ trợ: 0901 234 567 (hỗ trợ từ 08:00 - 22:00).
• Email: support@truongthanh.vn
• Địa chỉ cửa hàng: Quận 9, TP. Hồ Chí Minh.`
  }

  return `Cảm ơn câu hỏi của bạn. Hệ thống ghi nhận yêu cầu: "${query}".
Để biết thêm chi tiết, vui lòng chọn một trong các chủ đề gợi ý bên dưới hoặc liên hệ Hotline: 0901 234 567 để gặp nhân viên hỗ trợ trực tiếp.`
}

async function scrollToBottom() {
  await nextTick()
  if (messageBox.value) {
    messageBox.value.scrollTop = messageBox.value.scrollHeight
  }
}
</script>

<style scoped>
.text-slate-455 {
  color: hsl(215, 16%, 50%);
}
</style>
