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
});
