import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MarketingCampaigns from '../MarketingCampaigns.vue';
import { campaignService } from '@/services/campaign.service';

vi.mock('@/services/campaign.service', () => ({
  campaignService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

describe('MarketingCampaigns.vue Contract (MKT-02)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (campaignService.getAll as any).mockResolvedValue({
      data: {
        items: [
          {
            _id: 'camp_1',
            code: 'KHAITRUONG_2026',
            name: 'Chiến dịch Khai trương Tựu trường 2026',
            objective: 'CONVERSION',
            status: 'ACTIVE',
            channels: ['STOREFRONT', 'FACEBOOK'],
            budgetPlan: { totalBudget: 5000000, dailyBudget: 200000, currency: 'VND' },
            startAt: '2026-08-01T00:00:00.000Z',
            endAt: '2026-09-15T00:00:00.000Z',
          },
        ],
        total: 1,
      },
    });
  });

  it('renders campaign title and loads campaign cards from service', async () => {
    const wrapper = mount(MarketingCampaigns);
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(wrapper.text()).toContain('Chiến Dịch Marketing');
    expect(wrapper.text()).toContain('KHAITRUONG_2026');
    expect(wrapper.text()).toContain('Chiến dịch Khai trương Tựu trường 2026');
    expect(wrapper.text()).toContain('Đang chạy');
    expect(campaignService.getAll).toHaveBeenCalled();
  });

  it('opens wizard modal when clicking + Tạo Chiến Dịch Mới button', async () => {
    const wrapper = mount(MarketingCampaigns);
    await wrapper.vm.$nextTick();

    const createBtn = wrapper.find('button');
    expect(createBtn.exists()).toBe(true);

    (wrapper.vm as any).openCreateModal();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Tạo Chiến Dịch Marketing Mới');
  });
});
