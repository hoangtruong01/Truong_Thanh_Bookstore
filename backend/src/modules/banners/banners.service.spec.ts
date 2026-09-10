/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { BannersService } from './banners.service';
import {
  Banner,
  BannerPosition,
  BannerFrequency,
} from './schemas/banner.schema';
import { CloudinaryService } from '../users/cloudinary.service';

describe('BannersService', () => {
  let service: BannersService;
  let mockBannerModel: any;
  let mockCloudinaryService: any;

  beforeEach(async () => {
    mockBannerModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: 'new_id', ...dto }),
    }));

    mockBannerModel.find = jest.fn();
    mockBannerModel.findOne = jest.fn();
    mockBannerModel.findById = jest.fn();
    mockBannerModel.findByIdAndUpdate = jest.fn();
    mockBannerModel.findByIdAndDelete = jest.fn();
    mockBannerModel.updateMany = jest.fn();

    mockCloudinaryService = {
      isConfigured: jest.fn().mockReturnValue(true),
      uploadImage: jest
        .fn()
        .mockResolvedValue(
          'https://res.cloudinary.com/truongthanh/image/upload/banner1.webp',
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannersService,
        {
          provide: getModelToken(Banner.name),
          useValue: mockBannerModel,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    service = module.get<BannersService>(BannersService);
  });

  describe('create', () => {
    it('should create an entry popup and deactivate other active popups', async () => {
      mockBannerModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      });

      const dto = {
        title: 'Khuyến mãi tháng 9',
        imageUrl: 'https://example.com/popup.jpg',
        linkUrl: '/products?sale=true',
        position: BannerPosition.ENTRY_POPUP,
        frequency: BannerFrequency.ONCE_PER_DAY,
        ctaLabel: 'Khám phá ngay',
        isActive: true,
      };

      const result = await service.create(dto);

      expect(mockBannerModel.updateMany).toHaveBeenCalledWith(
        { position: BannerPosition.ENTRY_POPUP, isActive: true },
        { isActive: false },
      );
      expect(result).toHaveProperty('title', dto.title);
      expect(result).toHaveProperty('position', BannerPosition.ENTRY_POPUP);
    });

    it('should not deactivate other popups if created popup is inactive', async () => {
      const dto = {
        title: 'Draft popup',
        imageUrl: 'https://example.com/popup.jpg',
        position: BannerPosition.ENTRY_POPUP,
        isActive: false,
      };

      await service.create(dto);

      expect(mockBannerModel.updateMany).not.toHaveBeenCalled();
    });

    it('should upload base64 to Cloudinary when configured', async () => {
      const rawBase64 =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const dto = {
        title: 'Cloudinary upload popup',
        imageUrl: rawBase64,
        position: BannerPosition.ENTRY_POPUP,
        isActive: false,
      };

      await service.create(dto);

      expect(mockCloudinaryService.uploadImage).toHaveBeenCalledWith(
        rawBase64,
        'truong_thanh_banners',
      );
    });

    it('should fallback gracefully to base64 if Cloudinary is not configured', async () => {
      mockCloudinaryService.isConfigured.mockReturnValue(false);

      const base64Url = 'data:image/png;base64,samplebase64data';
      const dto = {
        title: 'Fallback banner',
        imageUrl: base64Url,
        position: BannerPosition.ENTRY_POPUP,
        isActive: false,
      };

      const result = await service.create(dto);

      expect(mockCloudinaryService.uploadImage).not.toHaveBeenCalled();
      expect(result.imageUrl).toBe(base64Url);
    });
  });

  describe('update', () => {
    it('should deactivate other popups when updating a popup to active', async () => {
      const existingPopup = {
        _id: 'popup_1',
        title: 'Current popup',
        position: BannerPosition.ENTRY_POPUP,
        isActive: false,
      };

      mockBannerModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingPopup),
      });

      mockBannerModel.updateMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      });

      mockBannerModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...existingPopup,
          isActive: true,
        }),
      });

      const updated = await service.update('popup_1', { isActive: true });

      expect(mockBannerModel.updateMany).toHaveBeenCalledWith(
        {
          position: BannerPosition.ENTRY_POPUP,
          isActive: true,
          _id: { $ne: 'popup_1' },
        },
        { isActive: false },
      );
      expect(updated.isActive).toBe(true);
    });

    it('should throw NotFoundException if banner to update does not exist', async () => {
      mockBannerModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update('non_existent', { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findActivePopup', () => {
    it('should retrieve active popup within valid schedule', async () => {
      const activePopup = {
        _id: 'popup_active',
        title: 'Flash Sale Popup',
        imageUrl: 'https://example.com/active.png',
        position: BannerPosition.ENTRY_POPUP,
        isActive: true,
        frequency: BannerFrequency.EVERY_VISIT,
      };

      mockBannerModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(activePopup),
        }),
      });

      const result = await service.findActivePopup();

      expect(result).toEqual(activePopup);
      expect(mockBannerModel.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          position: BannerPosition.ENTRY_POPUP,
          isActive: true,
        }),
      );
    });

    it('should return null when no popup is active', async () => {
      mockBannerModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await service.findActivePopup();

      expect(result).toBeNull();
    });
  });

  describe('findActive', () => {
    it('should return active banners grouped by position and exclude ENTRY_POPUP', async () => {
      const banners = [
        { position: BannerPosition.MAIN_SLIDER, title: 'Slider 1' },
        { position: BannerPosition.SIDEBAR_LEFT, title: 'Sidebar 1' },
      ];

      mockBannerModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(banners),
        }),
      });

      const result = await service.findActive();

      expect(mockBannerModel.find).toHaveBeenCalledWith({
        isActive: true,
        position: { $ne: BannerPosition.ENTRY_POPUP },
      });
      expect(result[BannerPosition.MAIN_SLIDER]).toHaveLength(1);
      expect(result[BannerPosition.SIDEBAR_LEFT]).toHaveLength(1);
      expect(result[BannerPosition.ENTRY_POPUP]).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete a banner by id', async () => {
      mockBannerModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'banner_1' }),
      });

      await expect(service.delete('banner_1')).resolves.not.toThrow();
    });

    it('should throw NotFoundException if banner to delete does not exist', async () => {
      mockBannerModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.delete('non_existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
