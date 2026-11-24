import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { LivestreamsService } from './livestreams.service';
import {
  LivestreamSession,
  LivestreamPlatform,
  LivestreamStatus,
} from './schemas/livestream-session.schema';

describe('LivestreamsService (LIVE-01)', () => {
  let service: LivestreamsService;
  let mockLiveModel: any;

  beforeEach(async () => {
    mockLiveModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        _id: 'mock_live_1',
        ...dto,
      }),
    }));

    mockLiveModel.find = jest.fn();
    mockLiveModel.findOne = jest.fn();
    mockLiveModel.findById = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LivestreamsService,
        {
          provide: getModelToken(LivestreamSession.name),
          useValue: mockLiveModel,
        },
      ],
    }).compile();

    service = module.get<LivestreamsService>(LivestreamsService);
  });

  describe('create', () => {
    it('creates a livestream session in SCHEDULED status', async () => {
      const dto = {
        title: 'Livestream Sách Mới',
        platform: LivestreamPlatform.FACEBOOK,
        streamUrl: 'https://facebook.com/live/1',
      };

      const res = await service.create(dto);
      expect(res).toBeDefined();
      expect(mockLiveModel).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Livestream Sách Mới',
          platform: LivestreamPlatform.FACEBOOK,
        }),
      );
    });

    it('rejects startAt >= endAt with BadRequestException', async () => {
      await expect(
        service.create({
          title: 'Lỗi ngày',
          platform: LivestreamPlatform.FACEBOOK,
          streamUrl: 'https://facebook.com',
          startAt: '2026-12-01T00:00:00.000Z',
          endAt: '2026-11-01T00:00:00.000Z',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findActiveLive', () => {
    it('only returns sessions with status LIVE (D09)', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            _id: 'live_active_1',
            status: LivestreamStatus.LIVE,
          }),
        }),
      };
      mockLiveModel.findOne.mockReturnValue(mockQuery);

      const res = await service.findActiveLive();
      expect(res).toBeDefined();
      expect(mockLiveModel.findOne).toHaveBeenCalledWith({
        status: LivestreamStatus.LIVE,
        isArchived: false,
      });
    });
  });
});
