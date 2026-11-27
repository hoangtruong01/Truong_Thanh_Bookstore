import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AbTestingService } from './ab-testing.service';
import { AbExperiment, ExperimentStatus } from './schemas/ab-experiment.schema';

describe('AbTestingService (Release R4 - OPT-01)', () => {
  let service: AbTestingService;
  let mockExperimentModel: any;

  const mockExperiment = {
    _id: '6743b1234567890123456789',
    name: 'Thử nghiệm nút Đặt Hàng',
    key: 'checkout_cta_btn',
    status: ExperimentStatus.RUNNING,
    variants: [
      { key: 'control', name: 'Mặc định', weight: 50, payload: { color: 'blue' } },
      { key: 'variant_b', name: 'Nổi bật', weight: 50, payload: { color: 'green' } },
    ],
    metrics: {
      impressions: { control: 100, variant_b: 100 },
      conversions: { control: 5, variant_b: 10 },
      revenue: { control: 500000, variant_b: 1200000 },
    },
    save: jest.fn().mockResolvedValue(this),
  };

  beforeEach(async () => {
    mockExperimentModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: 'new_id', ...dto }),
    }));

    mockExperimentModel.findOne = jest.fn();
    mockExperimentModel.findById = jest.fn();
    mockExperimentModel.find = jest.fn();
    mockExperimentModel.findByIdAndUpdate = jest.fn();
    mockExperimentModel.findOneAndUpdate = jest.fn();
    mockExperimentModel.findByIdAndDelete = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AbTestingService,
        {
          provide: getModelToken(AbExperiment.name),
          useValue: mockExperimentModel,
        },
      ],
    }).compile();

    service = module.get<AbTestingService>(AbTestingService);
  });

  describe('create()', () => {
    it('should create a valid experiment with at least 2 variants', async () => {
      mockExperimentModel.findOne.mockResolvedValue(null);

      const dto = {
        name: 'Test Button',
        key: 'test_btn',
        variants: [
          { key: 'control', name: 'Control', weight: 50 },
          { key: 'variant_b', name: 'B', weight: 50 },
        ],
      };

      const result = await service.create(dto as any, 'user_123');
      expect(result).toBeDefined();
      expect(mockExperimentModel.findOne).toHaveBeenCalledWith({ key: 'test_btn' });
    });

    it('should throw ConflictException if key already exists', async () => {
      mockExperimentModel.findOne.mockResolvedValue({ _id: 'exist' });

      await expect(
        service.create({
          name: 'Dupe',
          key: 'exist_key',
          variants: [
            { key: 'a', name: 'A', weight: 50 },
            { key: 'b', name: 'B', weight: 50 },
          ],
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if fewer than 2 variants provided', async () => {
      mockExperimentModel.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'Invalid',
          key: 'invalid_key',
          variants: [{ key: 'a', name: 'A', weight: 100 }],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('assignVariant()', () => {
    it('should deterministically return the same variant for the same distinctId', async () => {
      mockExperimentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockExperiment),
      });

      const res1 = await service.assignVariant('checkout_cta_btn', 'session_user_abc_123');
      const res2 = await service.assignVariant('checkout_cta_btn', 'session_user_abc_123');

      expect(res1).toBeDefined();
      expect(res2).toBeDefined();
      expect(res1?.variantKey).toBe(res2?.variantKey);
    });

    it('should return control or winning variant when experiment is not RUNNING', async () => {
      const pausedExp = {
        ...mockExperiment,
        status: ExperimentStatus.PAUSED,
        winningVariantKey: 'variant_b',
      };
      mockExperimentModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(pausedExp),
      });

      const res = await service.assignVariant('checkout_cta_btn', 'random_id');
      expect(res?.variantKey).toBe('variant_b');
      expect(res?.status).toBe(ExperimentStatus.PAUSED);
    });
  });

  describe('recordImpression() and recordConversion()', () => {
    it('should atomically update impression count', async () => {
      mockExperimentModel.findOneAndUpdate.mockResolvedValue({ _id: '1' });

      const res = await service.recordImpression({
        experimentKey: 'checkout_cta_btn',
        variantKey: 'variant_b',
      });

      expect(res.success).toBe(true);
      expect(mockExperimentModel.findOneAndUpdate).toHaveBeenCalledWith(
        { key: 'checkout_cta_btn', status: ExperimentStatus.RUNNING },
        { $inc: { 'metrics.impressions.variant_b': 1 } },
        { new: true },
      );
    });

    it('should atomically update conversion and revenue', async () => {
      mockExperimentModel.findOneAndUpdate.mockResolvedValue({ _id: '1' });

      const res = await service.recordConversion({
        experimentKey: 'checkout_cta_btn',
        variantKey: 'variant_b',
        revenue: 250000,
      });

      expect(res.success).toBe(true);
      expect(mockExperimentModel.findOneAndUpdate).toHaveBeenCalledWith(
        { key: 'checkout_cta_btn' },
        {
          $inc: {
            'metrics.conversions.variant_b': 1,
            'metrics.revenue.variant_b': 250000,
          },
        },
        { new: true },
      );
    });
  });

  describe('getExperimentResults()', () => {
    it('should correctly calculate conversion rate, ARPU, and uplift vs control', async () => {
      mockExperimentModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockExperiment),
      });

      const results = await service.getExperimentResults(mockExperiment._id);

      expect(results.totalImpressions).toBe(200);
      expect(results.totalConversions).toBe(15);
      expect(results.totalRevenue).toBe(1700000);

      const control = results.variants.find((v) => v.key === 'control');
      const variantB = results.variants.find((v) => v.key === 'variant_b');

      expect(control?.conversionRate).toBe(5); // 5 / 100 = 5%
      expect(variantB?.conversionRate).toBe(10); // 10 / 100 = 10%
      expect(variantB?.upliftVsControl).toBe(100); // 100% relative uplift from 5% to 10%
    });
  });
});
