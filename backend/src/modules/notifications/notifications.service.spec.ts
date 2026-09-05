import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { NotificationsService } from './notifications.service';
import { Notification } from './schemas/notification.schema';
import { NotificationsGateway } from './notifications.gateway';
import { FcmPushService } from './fcm-push.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockNotificationModel: any;
  let mockGateway: any;

  const mockUserId = new Types.ObjectId().toString();
  const mockNotificationId = new Types.ObjectId().toString();

  beforeEach(async () => {
    mockNotificationModel = {
      find: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      updateMany: jest.fn(),
    };

    // Constructor mock
    function MockNotification(this: any, data: any) {
      Object.assign(this, data);
      this.save = jest
        .fn()
        .mockResolvedValue({ _id: mockNotificationId, ...data });
    }
    Object.assign(MockNotification, mockNotificationModel);

    mockGateway = {
      sendNotificationToUser: jest.fn(),
      broadcastNotification: jest.fn(),
      sendAlertToAdmins: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken(Notification.name),
          useValue: MockNotification,
        },
        { provide: NotificationsGateway, useValue: mockGateway },
        {
          provide: FcmPushService,
          useValue: { sendToUser: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create direct notification and emit via gateway', async () => {
      const dto = {
        userId: mockUserId,
        title: 'Đơn hàng mới',
        message: 'Đơn hàng của bạn đã được tạo',
        type: 'order',
      };

      const result = await service.create(dto);
      expect(result.title).toBe(dto.title);
      expect(mockGateway.sendNotificationToUser).toHaveBeenCalledWith(
        mockUserId,
        expect.anything(),
      );
    });

    it('should create broadcast notification when userId is null', async () => {
      const dto = {
        title: 'Khuyến mãi hè',
        message: 'Giảm giá 30%',
        type: 'promotion',
      };

      const result = await service.create(dto);
      expect(result.title).toBe(dto.title);
      expect(mockGateway.broadcastNotification).toHaveBeenCalled();
    });
  });

  describe('findByUser & getUnreadCount', () => {
    it('should return user notifications and count unread', async () => {
      const mockItems = [
        {
          _id: mockNotificationId,
          userId: new Types.ObjectId(mockUserId),
          title: 'Đơn hàng mới',
          isRead: false,
        },
      ];

      (mockNotificationModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockItems),
              }),
            }),
          }),
        }),
      });

      (mockNotificationModel.countDocuments as jest.Mock)
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(1) }) // total
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(1) }); // unread

      const result = await service.findByUser(mockUserId, {
        page: 1,
        limit: 10,
      });
      expect(result.items.length).toBe(1);
      expect(result.items[0].isRead).toBe(false);
      expect(result.total).toBe(1);
      expect(result.unreadCount).toBe(1);
    });
  });

  describe('markAsRead & markAllAsRead', () => {
    it('should mark single direct notification as read', async () => {
      const mockDoc = {
        _id: mockNotificationId,
        userId: new Types.ObjectId(mockUserId),
        isRead: false,
        save: jest.fn().mockResolvedValue(true),
      };

      (mockNotificationModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDoc),
      });

      const result = await service.markAsRead(mockNotificationId, mockUserId);
      expect(result.success).toBe(true);
      expect(mockDoc.isRead).toBe(true);
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it('should mark all notifications as read for user', async () => {
      (mockNotificationModel.updateMany as jest.Mock).mockResolvedValue({
        modifiedCount: 3,
      });

      const result = await service.markAllAsRead(mockUserId);
      expect(result.success).toBe(true);
      expect(mockNotificationModel.updateMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('sendOrderNotification & sendLowStockAlert', () => {
    it('should trigger order notifications and socket alerts', async () => {
      const mockOrder = {
        _id: new Types.ObjectId(),
        orderCode: 'TTB-998877',
        customer: new Types.ObjectId(mockUserId),
        customerName: 'Trần Văn B',
        total: 350000,
        orderStatus: 'PENDING',
      };

      await service.sendOrderNotification(mockOrder, 'CREATED');
      expect(mockGateway.sendAlertToAdmins).toHaveBeenCalled();
    });

    it('should send low stock alert to admins', async () => {
      const mockProduct = {
        _id: new Types.ObjectId(),
        name: 'Bút bi Thiên Long',
        sku: 'TL-01',
      };

      const result = await service.sendLowStockAlert(mockProduct, 3);
      expect(result.title).toContain('Cảnh báo sắp hết hàng');
      expect(mockGateway.sendAlertToAdmins).toHaveBeenCalled();
    });
  });
});
