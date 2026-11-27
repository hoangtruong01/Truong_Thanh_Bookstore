import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TrackingService } from './tracking.service';
import {
  MarketingEvent,
  MarketingEventType,
} from './schemas/marketing-event.schema';

describe('TrackingService (TRK-01)', () => {
  let service: TrackingService;
  let mockEventModel: any;

  beforeEach(async () => {
    mockEventModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        _id: 'mock_event_1',
        ...dto,
      }),
    }));

    mockEventModel.aggregate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingService,
        {
          provide: getModelToken(MarketingEvent.name),
          useValue: mockEventModel,
        },
      ],
    }).compile();

    service = module.get<TrackingService>(TrackingService);
  });

  describe('recordEvent', () => {
    it('persists an event and hashes IP address', async () => {
      const dto = {
        eventType: MarketingEventType.PAGE_VIEW,
        url: 'https://truongthanh.vn/products',
        utmCampaign: 'CAMP_2026',
      };

      const res = await service.recordEvent(
        dto,
        undefined,
        '192.168.1.1',
        'Mozilla/5.0',
      );
      expect(res).toBeDefined();
      expect(mockEventModel).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: MarketingEventType.PAGE_VIEW,
          utmCampaign: 'CAMP_2026',
          ipHash: expect.any(String),
        }),
      );
    });
  });

  describe('getSummary', () => {
    it('returns aggregated event counts by type', async () => {
      mockEventModel.aggregate.mockResolvedValue([
        { _id: 'PAGE_VIEW', count: 100 },
        { _id: 'ADD_TO_CART', count: 20 },
      ]);

      const res = await service.getSummary({ campaign: 'CAMP_2026' });
      expect(res.totalEvents).toBe(120);
      expect(res.byType.PAGE_VIEW).toBe(100);
      expect(res.byType.ADD_TO_CART).toBe(20);
    });
  });

  describe('TRK-03: Conversion Events & Revenue Separation', () => {
    it('records ORDER_PLACED with gross amount', async () => {
      const res = await service.recordOrderPlaced({
        orderCode: 'ORD-1001',
        total: 500000,
        utmSource: 'facebook',
        utmCampaign: 'SUMMER_SALE',
      });

      expect(res).toBeDefined();
      expect(mockEventModel).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: MarketingEventType.ORDER_PLACED,
          entityId: 'ORD-1001',
          eventData: expect.objectContaining({ grossAmount: 500000 }),
        }),
      );
    });

    it('records ORDER_REALIZED with net amount', async () => {
      const res = await service.recordOrderRealized({
        orderCode: 'ORD-1001',
        netAmount: 480000,
        utmSource: 'facebook',
      });

      expect(res).toBeDefined();
      expect(mockEventModel).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: MarketingEventType.ORDER_REALIZED,
          entityId: 'ORD-1001',
          eventData: expect.objectContaining({ netAmount: 480000 }),
        }),
      );
    });

    it('calculates conversion funnel metrics and realization rate', async () => {
      mockEventModel.aggregate.mockResolvedValue([
        { _id: 'PAGE_VIEW', count: 1000, grossTotal: 0, netTotal: 0 },
        { _id: 'PRODUCT_VIEW', count: 500, grossTotal: 0, netTotal: 0 },
        { _id: 'ADD_TO_CART', count: 200, grossTotal: 0, netTotal: 0 },
        { _id: 'INITIATE_CHECKOUT', count: 100, grossTotal: 0, netTotal: 0 },
        { _id: 'ORDER_PLACED', count: 50, grossTotal: 25000000, netTotal: 0 },
        { _id: 'ORDER_REALIZED', count: 45, grossTotal: 0, netTotal: 22500000 },
      ]);

      const funnel = await service.getConversionFunnel();

      expect(funnel.pageViews).toBe(1000);
      expect(funnel.ordersPlaced).toBe(50);
      expect(funnel.grossRevenuePlaced).toBe(25000000);
      expect(funnel.ordersRealized).toBe(45);
      expect(funnel.netRevenueRealized).toBe(22500000);
      expect(funnel.visitorToOrderRate).toBe(5); // 50 / 1000 = 5%
      expect(funnel.realizationRate).toBe(90); // 45 / 50 = 90%
    });
  });

  describe('MKT-03: Marketing Dashboard Overview', () => {
    it('aggregates funnel, traffic by source, and campaign performance', async () => {
      mockEventModel.aggregate
        .mockResolvedValueOnce([ // Funnel
          { _id: 'PAGE_VIEW', count: 500, grossTotal: 0, netTotal: 0 },
          { _id: 'ORDER_PLACED', count: 25, grossTotal: 10000000, netTotal: 0 },
        ])
        .mockResolvedValueOnce([ // Traffic sources
          { _id: 'facebook', count: 300 },
          { _id: 'google', count: 200 },
        ])
        .mockResolvedValueOnce([ // Campaigns
          { _id: 'CAMP_A', orders: 15, revenue: 6000000 },
          { _id: 'CAMP_B', orders: 10, revenue: 4000000 },
        ]);

      mockEventModel.countDocuments = jest.fn().mockResolvedValue(1500);

      const dashboard = await service.getDashboardOverview();

      expect(dashboard.funnel.pageViews).toBe(500);
      expect(dashboard.trafficBySource).toHaveLength(2);
      expect(dashboard.trafficBySource[0].source).toBe('facebook');
      expect(dashboard.campaigns).toHaveLength(2);
      expect(dashboard.totalEvents).toBe(1500);
    });
  });
});
