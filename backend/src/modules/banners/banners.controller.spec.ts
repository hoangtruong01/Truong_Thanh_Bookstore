/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';
import { BannerPosition, BannerFrequency } from './schemas/banner.schema';

describe('BannersController', () => {
  let controller: BannersController;
  let service: jest.Mocked<Partial<BannersService>>;

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findActive: jest.fn(),
      findActivePopup: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BannersController],
      providers: [
        {
          provide: BannersService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<BannersController>(BannersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findActivePopup', () => {
    it('should return the active popup advertisement from service', async () => {
      const activePopup = {
        title: 'Popup Back to School',
        imageUrl: 'https://example.com/popup.png',
        position: BannerPosition.ENTRY_POPUP,
        frequency: BannerFrequency.EVERY_VISIT,
        isActive: true,
      } as any;

      (service.findActivePopup as jest.Mock).mockResolvedValue(activePopup);

      const result = await controller.findActivePopup();

      expect(result).toBe(activePopup);
      expect(service.findActivePopup).toHaveBeenCalled();
    });

    it('should return null when no popup is active', async () => {
      (service.findActivePopup as jest.Mock).mockResolvedValue(null);

      const result = await controller.findActivePopup();

      expect(result).toBeNull();
      expect(service.findActivePopup).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should delegate banner creation to service', async () => {
      const dto = {
        title: 'New Banner',
        imageUrl: 'https://example.com/banner.png',
        position: BannerPosition.ENTRY_POPUP,
      };

      (service.create as jest.Mock).mockResolvedValue({ _id: '1', ...dto });

      const result: any = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result._id).toBe('1');
    });
  });
});
