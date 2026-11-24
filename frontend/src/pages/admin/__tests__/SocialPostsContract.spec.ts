import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SocialPosts from '../SocialPosts.vue';
import { socialService } from '../../../services/social.service';
import { adsService } from '../../../services/ads.service';
import { productService } from '../../../services/product.service';

vi.mock('../../../services/social.service', () => ({
  socialService: {
    getPosts: vi.fn(),
    getAccounts: vi.fn(),
    generateContentFromProduct: vi.fn(),
    createPost: vi.fn(),
    updatePost: vi.fn(),
    updatePostStatus: vi.fn(),
    recordManualPost: vi.fn(),
    deletePost: vi.fn(),
  },
}));

vi.mock('../../../services/ads.service', () => ({
  adsService: {
    getPerformance: vi.fn(),
    getBlendedRoas: vi.fn(),
    recordPerformance: vi.fn(),
    mapCampaign: vi.fn(),
  },
}));

vi.mock('../../../services/product.service', () => ({
  productService: {
    getAll: vi.fn(),
  },
}));

describe('SocialPosts.vue Component Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(socialService.getPosts).mockResolvedValue({
      data: [
        {
          _id: 'post_01',
          title: 'Bài viết quảng bá Bút Thiên Long',
          platform: 'FACEBOOK',
          postType: 'PRODUCT_SPOTLIGHT',
          content: 'Nội dung bài viết Facebook mẫu...',
          hashtags: ['#ButThienLong'],
          mediaUrls: [],
          status: 'DRAFT',
          revision: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: 'post_02',
          title: 'Kịch bản TikTok Sổ Da',
          platform: 'TIKTOK',
          postType: 'TIKTOK_VIDEO_SCRIPT',
          content: 'Kịch bản 30s...',
          hashtags: ['#TikTokMadeMeBuyIt'],
          mediaUrls: [],
          status: 'APPROVED',
          videoScriptDetails: {
            hook: '3 lý do không nên bỏ lỡ sổ da!',
            bodyPoints: ['Bìa da thật', 'Giấy định lượng cao', 'Giá rẻ'],
            cta: 'Bấm bio đặt ngay',
            estimatedDurationSeconds: 30,
          },
          revision: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    } as any);

    vi.mocked(socialService.getAccounts).mockResolvedValue({
      data: [
        {
          _id: 'acc_01',
          platform: 'FACEBOOK',
          accountId: 'page_123',
          accountName: 'Trường Thành Fanpage',
          accountType: 'PAGE',
          status: 'CONNECTED',
          capabilities: ['publish_posts', 'read_insights'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    } as any);

    vi.mocked(adsService.getPerformance).mockResolvedValue({
      data: {
        items: [],
        summary: {
          totalSpend: 1500000,
          totalImpressions: 50000,
          totalClicks: 1200,
          totalProviderConversions: 35,
          totalProviderConversionValue: 8000000,
          ctrPercentage: 2.4,
          cpcVnd: 1250,
        },
      },
    } as any);

    vi.mocked(adsService.getBlendedRoas).mockResolvedValue({
      data: {
        adSpendVnd: 1500000,
        attributedRevenueVnd: 6000000,
        attributedOrdersCount: 15,
        blendedRoas: 4.0,
      },
    } as any);

    vi.mocked(productService.getAll).mockResolvedValue({
      data: {
        items: [
          { _id: 'prod_1', name: 'Bút Bi TL-027', price: 5000, sku: 'TL027' },
        ],
      },
    } as any);
  });

  it('should render header and tab navigation cleanly', async () => {
    const wrapper = mount(SocialPosts);
    expect(wrapper.text()).toContain('Mạng Xã Hội & Đo Lường Quảng Cáo');
    expect(wrapper.text()).toContain('Release R2');
    expect(wrapper.text()).toContain('Bài viết & Kịch bản');
    expect(wrapper.text()).toContain('Trợ lý nội dung AI');
    expect(wrapper.text()).toContain('Kênh kết nối');
    expect(wrapper.text()).toContain('Hiệu quả Quảng cáo');
  });

  it('should display loaded social posts with platform and status badges', async () => {
    const wrapper = mount(SocialPosts);
    await wrapper.vm.$nextTick();
    await new Promise((r) => setTimeout(r, 20));

    expect(wrapper.text()).toContain('Bài viết quảng bá Bút Thiên Long');
    expect(wrapper.text()).toContain('Kịch bản TikTok Sổ Da');
    expect(wrapper.text()).toContain('Bản nháp');
    expect(wrapper.text()).toContain('Đã duyệt');
  });

  it('should switch tabs and show AI generator when clicked', async () => {
    const wrapper = mount(SocialPosts);
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    const generatorTabBtn = buttons.find((b) =>
      b.text().includes('Trợ lý nội dung AI'),
    );
    expect(generatorTabBtn).toBeDefined();

    await generatorTabBtn!.trigger('click');
    expect(wrapper.text()).toContain('1. Chọn sản phẩm & Nền tảng');
    expect(wrapper.text()).toContain('2. Bản xem trước & Lưu nháp');
  });
});
