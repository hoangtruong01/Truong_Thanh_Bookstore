<template>
  <!-- Policy Detail Modal -->
  <div
    v-if="detail"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
    @click.self="emit('close')"
  >
    <div
      class="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Modal Header -->
      <div class="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 class="text-lg font-black text-slate-900">
          {{ detail.title }}
        </h3>
        <button
          class="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none"
          @click="emit('close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal Content -->
      <div class="p-6 space-y-6">
        <p class="text-sm text-slate-500 italic leading-relaxed">
          {{ detail.description }}
        </p>

        <div class="space-y-4">
          <div
            v-for="(item, index) in detail.items"
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
          class="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors focus:outline-none"
          @click="emit('close')"
        >
          Đóng
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export type PolicyKey = 'delivery' | 'return' | 'wholesale'

interface PolicyDetail {
  title: string
  description: string
  items: { title: string; content: string }[]
}

export const POLICY_DETAILS: Record<PolicyKey, PolicyDetail> = {
  delivery: {
    title: 'Chính sách vận chuyển & giao hàng',
    description: 'Trường Thành Bookstore cam kết mang đến dịch vụ giao hàng nhanh chóng, an toàn và uy tín nhất cho khách hàng.',
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
</script>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** Policy to show; null keeps the modal closed. */
  policy: PolicyKey | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const detail = computed(() => (props.policy ? POLICY_DETAILS[props.policy] : null))
</script>
