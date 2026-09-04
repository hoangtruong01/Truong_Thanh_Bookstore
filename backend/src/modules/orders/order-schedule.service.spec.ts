import { Test, TestingModule } from '@nestjs/testing';
import { OrderScheduleService } from './order-schedule.service';
import { OrdersService } from './orders.service';

describe('OrderScheduleService (BE-05 Cron Job)', () => {
  let service: OrderScheduleService;
  let mockOrdersService: any;

  beforeEach(async () => {
    mockOrdersService = {
      handleAutoCancelWarnings: jest.fn().mockResolvedValue(3),
      handleAutoCancelOrders: jest.fn().mockResolvedValue(2),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderScheduleService,
        { provide: OrdersService, useValue: mockOrdersService },
      ],
    }).compile();

    service = module.get<OrderScheduleService>(OrderScheduleService);
  });

  it('should execute both warning and auto-cancel routines on cron trigger', async () => {
    await service.handleOrderExpirationCron();

    expect(mockOrdersService.handleAutoCancelWarnings).toHaveBeenCalledTimes(1);
    expect(mockOrdersService.handleAutoCancelOrders).toHaveBeenCalledTimes(1);
  });

  it('should catch and log error gracefully if routine throws', async () => {
    mockOrdersService.handleAutoCancelOrders.mockRejectedValueOnce(
      new Error('Database timeout'),
    );

    await expect(service.handleOrderExpirationCron()).resolves.not.toThrow();
  });
});
