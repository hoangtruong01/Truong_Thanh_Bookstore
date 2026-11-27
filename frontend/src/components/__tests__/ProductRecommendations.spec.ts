import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ProductRecommendations from '../ProductRecommendations.vue';
import api from '@/utils/api';

vi.mock('@/utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock('@/stores/cart', () => ({
  useCartStore: () => ({
    addToCart: vi.fn(),
  }),
}));

describe('ProductRecommendations.vue (OPT-01)', () => {
  const mockProducts = [
    {
      _id: 'prod_1',
      name: 'Vở Kẻ Ngang Campus',
      slug: 'vo-ke-ngang-campus',
      sku: 'VO-CAMPUS',
      price: 18000,
      stock: 50,
      images: ['/img1.png'],
      rating: 5,
      sold: 100,
      recommendationReason: 'Khách hàng thường mua cùng',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders recommendation items when API returns frequently bought together items', async () => {
    (api.get as any).mockResolvedValue({
      data: {
        frequentlyBoughtTogether: mockProducts,
        related: [],
      },
    });

    const wrapper = mount(ProductRecommendations, {
      props: {
        productId: '6743b1234567890123456789',
        type: 'frequently_bought_together',
      },
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    expect(wrapper.text()).toContain('Thường Mua Cùng Nhau');
    expect(wrapper.text()).toContain('Vở Kẻ Ngang Campus');
    expect(wrapper.text()).toContain('Khách hàng thường mua cùng');
  });

  it('renders nothing if no recommendation items are returned', async () => {
    (api.get as any).mockResolvedValue({
      data: {
        frequentlyBoughtTogether: [],
        related: [],
      },
    });

    const wrapper = mount(ProductRecommendations, {
      props: {
        productId: '6743b1234567890123456789',
        type: 'frequently_bought_together',
      },
      global: {
        stubs: {
          'router-link': true,
        },
      },
    });

    await new Promise((r) => setTimeout(r, 20));
    expect(wrapper.html()).toBe('<!--v-if-->');
  });
});
