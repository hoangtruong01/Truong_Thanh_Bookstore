import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { OutboxService } from './outbox.service';
import {
  OutboxEvent,
  OutboxEventType,
  OutboxStatus,
} from './schemas/outbox-event.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';

describe('OutboxService (RELIABILITY-01 Transactional Outbox Pattern)', () => {
  let service: OutboxService;
  let mockOutboxModel: {
    create: jest.Mock;
    find: jest.Mock;
    findOneAndUpdate: jest.Mock;
    updateOne: jest.Mock;
    deleteMany: jest.Mock;
  };
  let mockNotificationsService: {
    sendOrderNotification: jest.Mock;
    sendLowStockAlert: jest.Mock;
  };
  let mockEmailService: {
    sendOrderConfirmationEmail: jest.Mock;
  };
  let mockConfigService: {
    get: jest.Mock;
  };

  beforeEach(async () => {
    mockOutboxModel = {
      create: jest.fn(),
      find: jest.fn(),
      findOneAndUpdate: jest.fn(),
      updateOne: jest.fn(),
      deleteMany: jest.fn(),
    };

    mockNotificationsService = {
      sendOrderNotification: jest.fn().mockResolvedValue(undefined),
      sendLowStockAlert: jest.fn().mockResolvedValue(undefined),
    };

    mockEmailService = {
      sendOrderConfirmationEmail: jest.fn().mockResolvedValue(undefined),
    };

    mockConfigService = {
      get: jest
        .fn()
        .mockReturnValue('https://script.google.com/macros/s/mock/exec'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxService,
        {
          provide: getModelToken(OutboxEvent.name),
          useValue: mockOutboxModel,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<OutboxService>(OutboxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordEvent', () => {
    it('records an outbox event with transaction session atomically', async () => {
      const mockCreated = {
        _id: new Types.ObjectId(),
        eventType: OutboxEventType.ORDER_CREATED,
        status: OutboxStatus.PENDING,
      };
      mockOutboxModel.create.mockResolvedValue([mockCreated]);

      const mockSession = {} as unknown as import('mongoose').ClientSession;
      const result = await service.recordEvent(
        OutboxEventType.ORDER_CREATED,
        { orderCode: 'ORD-123' },
        mockSession,
      );

      expect(mockOutboxModel.create).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            eventType: OutboxEventType.ORDER_CREATED,
            status: OutboxStatus.PENDING,
            retryCount: 0,
            maxRetries: 5,
          }),
        ],
        { session: mockSession },
      );
      expect(result).toEqual(mockCreated);
    });
  });

  describe('processSingleEvent', () => {
    it('dispatches ORDER_CREATED event and marks it as SENT on success', async () => {
      const eventId = new Types.ObjectId();
      const mockEvent = {
        _id: eventId,
        eventType: OutboxEventType.ORDER_CREATED,
        payload: {
          orderCode: 'ORD-100',
          customerEmail: 'customer@example.com',
          total: 250000,
        },
        retryCount: 0,
        maxRetries: 5,
      };

      mockOutboxModel.findOneAndUpdate.mockResolvedValue(mockEvent);
      mockOutboxModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const success = await service.processSingleEvent(eventId.toString());

      expect(success).toBe(true);
      expect(mockNotificationsService.sendOrderNotification).toHaveBeenCalled();
      expect(mockEmailService.sendOrderConfirmationEmail).toHaveBeenCalledWith(
        'customer@example.com',
        expect.anything(),
      );
      expect(mockOutboxModel.updateOne).toHaveBeenCalledWith(
        { _id: eventId },
        {
          $set: expect.objectContaining({
            status: OutboxStatus.SENT,
            errorMessage: null,
          }),
        },
      );
    });

    it('applies exponential backoff when dispatch fails', async () => {
      const eventId = new Types.ObjectId();
      const mockEvent = {
        _id: eventId,
        eventType: OutboxEventType.ORDER_CREATED,
        payload: {
          orderCode: 'ORD-ERR',
          customerEmail: 'customer@example.com',
        },
        retryCount: 1,
        maxRetries: 5,
      };

      mockOutboxModel.findOneAndUpdate.mockResolvedValue(mockEvent);
      mockNotificationsService.sendOrderNotification.mockRejectedValueOnce(
        new Error('Socket disconnected'),
      );
      mockOutboxModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const success = await service.processSingleEvent(eventId.toString());

      expect(success).toBe(false);
      expect(mockOutboxModel.updateOne).toHaveBeenCalledWith(
        { _id: eventId },
        {
          $set: expect.objectContaining({
            status: OutboxStatus.FAILED,
            retryCount: 2,
            errorMessage: 'Socket disconnected',
          }),
        },
      );
    });

    it('does not re-process if event is already locked by another worker', async () => {
      const eventId = new Types.ObjectId().toString();
      mockOutboxModel.findOneAndUpdate.mockResolvedValue(null);

      const success = await service.processSingleEvent(eventId);
      expect(success).toBe(false);
      expect(
        mockNotificationsService.sendOrderNotification,
      ).not.toHaveBeenCalled();
    });
  });

  describe('cleanupOldEvents', () => {
    it('deletes SENT outbox events older than 7 days', async () => {
      mockOutboxModel.deleteMany.mockResolvedValue({ deletedCount: 15 });

      const deletedCount = await service.cleanupOldEvents();

      expect(deletedCount).toBe(15);
      expect(mockOutboxModel.deleteMany).toHaveBeenCalledWith({
        status: OutboxStatus.SENT,
        processedAt: { $lte: expect.any(Date) },
      });
    });
  });
});
