import { Test, TestingModule } from '@nestjs/testing';
import { ShippingController } from './shipping.controller';
import { GhnShippingService } from './ghn-shipping.service';
import { CreateGhnShipmentDto } from './dto/shipping.dto';

describe('ShippingController', () => {
  let controller: ShippingController;
  let service: jest.Mocked<Partial<GhnShippingService>>;

  beforeEach(async () => {
    service = {
      createShipment: jest.fn(),
      syncTracking: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShippingController],
      providers: [
        {
          provide: GhnShippingService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<ShippingController>(ShippingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate createShipment to GhnShippingService with correct parameters', async () => {
      const orderId = 'order-123';
      const dto: CreateGhnShipmentDto = {
        toDistrictId: 1442,
        toWardCode: '20101',
        weight: 500,
        length: 20,
        width: 15,
        height: 10,
      };

      const mockResult = {
        _id: orderId,
        trackingCode: 'GHN-ABC-123',
        shippingProvider: 'GHN',
      };

      (service.createShipment as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.create(orderId, dto);

      expect(result).toEqual(mockResult);
      expect(service.createShipment).toHaveBeenCalledWith(orderId, dto);
    });
  });

  describe('track', () => {
    it('should delegate syncTracking to GhnShippingService with correct orderId', async () => {
      const orderId = 'order-123';
      const mockResult = {
        _id: orderId,
        trackingCode: 'GHN-ABC-123',
        shippingStatus: 'delivering',
      };

      (service.syncTracking as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.track(orderId);

      expect(result).toEqual(mockResult);
      expect(service.syncTracking).toHaveBeenCalledWith(orderId);
    });
  });
});
