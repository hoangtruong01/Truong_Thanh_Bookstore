import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AdsService } from './ads.service';
import { AdsPerformance, AdPlatform } from './schemas/ads-performance.schema';
import { Order } from '../../orders/schemas/order.schema';

describe('AdsService', () => {
  let service: AdsService;
  let mockAdsModel: any;
  let mockOrderModel: any;

  beforeEach(async () => {
    mockAdsModel = {
      findOneAndUpdate: jest.fn(),
      find: jest.fn(),
      updateMany: jest.fn(),
    };

    mockOrderModel = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdsService,
        { provide: getModelToken(AdsPerformance.name), useValue: mockAdsModel },
        { provide: getModelToken(Order.name), useValue: mockOrderModel },
      ],
    }).compile();

    service = module.get<AdsService>(AdsService);
  });

  describe('Ad Performance Sync & Idempotency (ADS-01)', () => {
    it('should upsert performance record by platform, adAccountId, campaignId, and date', async () => {
      const mockResult = {
        platform: AdPlatform.META,
        adAccountId: 'act_123',
        campaignId: 'cmp_456',
        spend: 500000,
      };

      mockAdsModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockResult),
      });

      const res = await service.recordPerformance({
        platform: AdPlatform.META,
        adAccountId: 'act_123',
        campaignId: 'cmp_456',
        campaignName: 'Meta Awareness Campaign',
        date: '2026-11-24',
        spend: 500000,
        impressions: 10000,
        clicks: 250,
      });

      expect(res).toBeDefined();
      expect(mockAdsModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: AdPlatform.META,
          adAccountId: 'act_123',
          campaignId: 'cmp_456',
        }),
        expect.any(Object),
        expect.objectContaining({ upsert: true, new: true }),
      );
    });

    it('should aggregate summary metrics including CTR% and CPC', async () => {
      const mockItems = [
        {
          spend: 1000000,
          impressions: 50000,
          clicks: 1000,
          providerConversions: 20,
          providerConversionValue: 5000000,
        },
        {
          spend: 500000,
          impressions: 25000,
          clicks: 500,
          providerConversions: 10,
          providerConversionValue: 2500000,
        },
      ];

      mockAdsModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockItems),
        }),
      });

      const res = await service.findAll();

      expect(res.items.length).toBe(2);
      expect(res.summary.totalSpend).toBe(1500000);
      expect(res.summary.totalImpressions).toBe(75000);
      expect(res.summary.totalClicks).toBe(1500);
      expect(res.summary.ctrPercentage).toBe(2.0); // (1500/75000)*100 = 2%
      expect(res.summary.cpcVnd).toBe(1000); // 1500000/1500 = 1000 VND
    });

    it('should map external campaign to internal campaign code', async () => {
      mockAdsModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 3 }),
      });

      const res = await service.mapCampaign({
        campaignId: 'cmp_456',
        internalCampaignCode: 'KHAITRUONG_2026',
      });

      expect(res.updatedCount).toBe(3);
    });
  });

  describe('Blended ROAS Calculation (ADS-01, TRK-02)', () => {
    it('should calculate Blended ROAS from attributed orders vs ad spend', async () => {
      mockAdsModel.find.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue([
            { spend: 2000000, internalCampaignCode: 'PROMO_SUMMER' },
          ]),
      });

      mockOrderModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { total: 3000000, attribution: { campaignCode: 'PROMO_SUMMER' } },
          { total: 5000000, attribution: { campaignCode: 'PROMO_SUMMER' } },
        ]),
      });

      const res = await service.getBlendedRoas('PROMO_SUMMER');

      expect(res.adSpendVnd).toBe(2000000);
      expect(res.attributedRevenueVnd).toBe(8000000);
      expect(res.attributedOrdersCount).toBe(2);
      expect(res.blendedRoas).toBe(4.0); // 8,000,000 / 2,000,000 = 4.0x ROAS
    });
  });
});
