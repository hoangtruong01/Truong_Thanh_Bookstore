import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import {
  MarketingCampaign,
  CampaignStatus,
  CampaignObjective,
} from './schemas/marketing-campaign.schema';

describe('CampaignsService (MKT-01)', () => {
  let service: CampaignsService;
  let mockCampaignModel: any;

  beforeEach(async () => {
    mockCampaignModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        _id: 'mock_camp_id_1',
        ...dto,
      }),
    }));

    mockCampaignModel.findOne = jest.fn();
    mockCampaignModel.findById = jest.fn();
    mockCampaignModel.find = jest.fn();
    mockCampaignModel.countDocuments = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        {
          provide: getModelToken(MarketingCampaign.name),
          useValue: mockCampaignModel,
        },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
  });

  describe('create', () => {
    it('creates a new campaign in DRAFT status with initial revision 1', async () => {
      mockCampaignModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const dto = {
        code: 'CAMP_TEST_01',
        name: 'Chiến dịch thử nghiệm',
        objective: CampaignObjective.CONVERSION,
      };

      const result = await service.create(dto, 'user_123');
      expect(result).toBeDefined();
      expect(mockCampaignModel).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'CAMP_TEST_01',
          status: CampaignStatus.DRAFT,
          revision: 1,
        }),
      );
    });

    it('rejects duplicate campaign code with ConflictException', async () => {
      mockCampaignModel.findOne.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ _id: 'existing_id', code: 'DUPLICATE' }),
      });

      await expect(
        service.create({ code: 'DUPLICATE', name: 'Trùng mã' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects startAt >= endAt with BadRequestException', async () => {
      mockCampaignModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.create({
          code: 'INVALID_DATES',
          name: 'Ngày sai',
          startAt: '2026-12-01T00:00:00.000Z',
          endAt: '2026-11-01T00:00:00.000Z',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus (State Machine / D03)', () => {
    it('allows valid transition DRAFT -> IN_REVIEW', async () => {
      const mockDoc = {
        _id: 'camp_1',
        status: CampaignStatus.DRAFT,
        revision: 1,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };
      mockCampaignModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      });

      const res = await service.updateStatus('camp_1', {
        status: CampaignStatus.IN_REVIEW,
      });

      expect(res.status).toBe(CampaignStatus.IN_REVIEW);
      expect(res.revision).toBe(2);
    });

    it('allows valid transition IN_REVIEW -> APPROVED', async () => {
      const mockDoc = {
        _id: 'camp_1',
        status: CampaignStatus.IN_REVIEW,
        revision: 2,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };
      mockCampaignModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      });

      const res = await service.updateStatus('camp_1', {
        status: CampaignStatus.APPROVED,
      });

      expect(res.status).toBe(CampaignStatus.APPROVED);
    });

    it('rejects invalid jump DRAFT -> ACTIVE with BadRequestException', async () => {
      const mockDoc = {
        _id: 'camp_1',
        status: CampaignStatus.DRAFT,
        revision: 1,
      };
      mockCampaignModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      });

      await expect(
        service.updateStatus('camp_1', { status: CampaignStatus.ACTIVE }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects transitions out of ARCHIVED terminal status', async () => {
      const mockDoc = {
        _id: 'camp_1',
        status: CampaignStatus.ARCHIVED,
        revision: 5,
        isArchived: true,
      };
      mockCampaignModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      });

      await expect(
        service.updateStatus('camp_1', { status: CampaignStatus.DRAFT }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete (soft archive)', () => {
    it('archives the campaign cleanly', async () => {
      const mockDoc = {
        _id: 'camp_1',
        status: CampaignStatus.DRAFT,
        isArchived: false,
        save: jest.fn().mockResolvedValue(true),
      };
      mockCampaignModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      });

      await service.delete('camp_1');
      expect(mockDoc.isArchived).toBe(true);
      expect(mockDoc.status).toBe(CampaignStatus.ARCHIVED);
    });
  });
});
