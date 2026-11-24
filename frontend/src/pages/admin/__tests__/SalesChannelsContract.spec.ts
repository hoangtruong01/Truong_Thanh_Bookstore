import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SalesChannels from '../SalesChannels.vue';
import { channelsService } from '../../../services/channels.service';
import { productService } from '../../../services/product.service';

vi.mock('../../../services/channels.service', () => ({
  channelsService: {
    getAccounts: vi.fn(),
    connectAccount: vi.fn(),
    getMappings: vi.fn(),
    createMapping: vi.fn(),
    syncInventory: vi.fn(),
    getExceptions: vi.fn(),
    resolveException: vi.fn(),
    getSettlements: vi.fn(),
    recordSettlement: vi.fn(),
    simulateWebhookOrder: vi.fn(),
  },
}));

vi.mock('../../../services/product.service', () => ({
  productService: {
    getAll: vi.fn(),
  },
}));

describe('SalesChannels.vue Component Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());

    vi.mocked(channelsService.getAccounts).mockResolvedValue({
      data: [
        {
          _id: 'acc_tts_01',
          provider: 'TIKTOK_SHOP',
          shopId: 'tts_shop_vn_01',
          shopName: 'Trường Thành Bookstore Official TikTok',
          status: 'CONNECTED',
          warehouseId: 'WH_MAIN',
          appKey: 'tts_app_123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    } as any);

    vi.mocked(channelsService.getMappings).mockResolvedValue({
      data: [
        {
          _id: 'map_01',
          provider: 'TIKTOK_SHOP',
          shopId: 'tts_shop_vn_01',
          externalSkuId: 'TTS_SKU_PEN_BOX20',
          externalProductId: 'TTS_P_01',
          externalSkuName: 'Hộp 20 Bút bi Thiên Long TL-027',
          productId: 'prod_pen_01',
          sku: 'TL-027',
          packMultiplier: 20,
          sellableStock: 5,
          syncStatus: 'SYNCED',
          lastSyncedAt: new Date().toISOString(),
        },
      ],
    } as any);

    vi.mocked(channelsService.getExceptions).mockResolvedValue({
      data: [
        {
          _id: 'ex_01',
          provider: 'TIKTOK_SHOP',
          shopId: 'tts_shop_vn_01',
          externalOrderId: 'TTS_ORD_9999',
          exceptionType: 'UNKNOWN_SKU',
          message: 'Không tìm thấy ánh xạ SKU ngoại sàn TTS_UNKNOWN',
          payload: { externalOrderId: 'TTS_ORD_9999' },
          resolved: false,
          createdAt: new Date().toISOString(),
        },
      ],
    } as any);

    vi.mocked(channelsService.getSettlements).mockResolvedValue({
      data: [
        {
          _id: 'stmt_01',
          settlementId: 'STMT_TTS_202611_01',
          provider: 'TIKTOK_SHOP',
          shopId: 'tts_shop_vn_01',
          periodStart: '2026-11-01',
          periodEnd: '2026-11-15',
          grossSalesVnd: 25000000,
          platformFeesVnd: 1250000,
          netSettlementVnd: 23750000,
          internalAttributedSalesVnd: 25000000,
          discrepancyVnd: 0,
          status: 'RECONCILED',
        },
      ],
    } as any);

    vi.mocked(productService.getAll).mockResolvedValue({
      data: [
        { _id: 'prod_pen_01', name: 'Bút bi Thiên Long TL-027', sku: 'TL-027', stock: 100 },
      ],
    } as any);
  });

  it('renders sales channels pilot header and loads mappings table', async () => {
    const wrapper = mount(SalesChannels, {
      global: {
        stubs: {
          teleport: true,
        },
      },
    });

    await vi.waitFor(() => {
      expect(channelsService.getMappings).toHaveBeenCalled();
      expect(channelsService.getAccounts).toHaveBeenCalled();
      expect(wrapper.text()).toContain('Hộp 20 Bút bi Thiên Long TL-027');
    });

    expect(wrapper.text()).toContain('Bán Hàng Đa Kênh — TikTok Shop Pilot');
    expect(wrapper.text()).toContain('TTS_SKU_PEN_BOX20');
  });

  it('switches tabs to Webhook inbox and displays quarantined exception', async () => {
    const wrapper = mount(SalesChannels);

    await vi.waitFor(() => {
      expect(channelsService.getExceptions).toHaveBeenCalled();
    });

    // Click tab 2: Webhook & Đơn hàng sàn
    const tabButtons = wrapper.findAll('button').filter(b => b.text().includes('Webhook & Đơn hàng sàn'));
    expect(tabButtons.length).toBeGreaterThan(0);
    await tabButtons[0].trigger('click');

    expect(wrapper.text()).toContain('TTS_ORD_9999');
    expect(wrapper.text()).toContain('UNKNOWN_SKU');
  });

  it('switches tabs to reconciliation and displays statement with discrepancy check', async () => {
    const wrapper = mount(SalesChannels);

    await vi.waitFor(() => {
      expect(channelsService.getSettlements).toHaveBeenCalled();
    });

    // Click tab 3: Đối soát doanh thu sàn
    const tabButtons = wrapper.findAll('button').filter(b => b.text().includes('Đối soát doanh thu'));
    expect(tabButtons.length).toBeGreaterThan(0);
    await tabButtons[0].trigger('click');

    expect(wrapper.text()).toContain('STMT_TTS_202611_01');
    expect(wrapper.text()).toContain('✓ Khớp hoàn toàn');
  });

  it('calls syncInventory when user clicks "Đồng bộ tồn kho ngay"', async () => {
    vi.mocked(channelsService.syncInventory).mockResolvedValue({
      data: { syncedCount: 1, timestamp: new Date().toISOString() },
    } as any);

    const wrapper = mount(SalesChannels);
    await vi.waitFor(() => {
      expect(channelsService.getMappings).toHaveBeenCalled();
    });

    const syncBtn = wrapper.findAll('button').find(b => b.text().includes('Đồng bộ tồn kho ngay'));
    expect(syncBtn).toBeDefined();
    await syncBtn!.trigger('click');

    await vi.waitFor(() => {
      expect(channelsService.syncInventory).toHaveBeenCalled();
    });
  });
});
