import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('EmailService (BE-05)', () => {
  let service: EmailService;
  let configService: ConfigService;
  let mockSendMail: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMail = jest.fn();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });
  });

  describe('When SMTP transporter is configured', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config: Record<string, any> = {
                  EMAIL_HOST: 'smtp.example.com',
                  EMAIL_PORT: 587,
                  EMAIL_USER: 'test@example.com',
                  EMAIL_PASS: 'password123',
                  EMAIL_FROM: '"Trường Thành Bookstore" <test@truongthanh.vn>',
                  NODE_ENV: 'production',
                };
                return config[key];
              }),
            },
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);
      configService = module.get<ConfigService>(ConfigService);
    });

    it('should return true when nodemailer sendMail succeeds', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'msg-123' });

      const result = await service.sendMail(
        'user@example.com',
        'Test Subject',
        '<p>Hello</p>',
      );
      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Test Subject',
          html: '<p>Hello</p>',
        }),
      );
    });

    it('BE-05: should return false when nodemailer sendMail throws an error (never report success on failure)', async () => {
      mockSendMail.mockRejectedValueOnce(
        new Error('Connection timeout to SMTP'),
      );

      const result = await service.sendMail(
        'user@example.com',
        'Test Subject',
        '<p>Hello</p>',
      );
      expect(result).toBe(false);
    });
  });

  describe('When SMTP credentials are not configured', () => {
    it('BE-05: should return false and block simulation in production environment', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config: Record<string, any> = {
                  NODE_ENV: 'production',
                };
                return config[key];
              }),
            },
          },
        ],
      }).compile();

      const devService = module.get<EmailService>(EmailService);
      const result = await devService.sendMail(
        'user@example.com',
        'Test Subject',
        '<p>Test</p>',
      );
      expect(result).toBe(false);
    });

    it('BE-05: should return true in development simulation without leaking sensitive 6-digit OTPs in logs', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config: Record<string, any> = {
                  NODE_ENV: 'development',
                };
                return config[key];
              }),
            },
          },
        ],
      }).compile();

      const devService = module.get<EmailService>(EmailService);
      const logSpy = jest.spyOn((devService as any).logger, 'log');
      const result = await devService.sendOtpEmail(
        'user@example.com',
        '123456',
      );
      expect(result).toBe(true);

      // Verify that the logged simulation does NOT contain the raw OTP '123456'
      const simulationLogs = logSpy.mock.calls
        .map((args) => args[0])
        .filter(
          (msg) =>
            typeof msg === 'string' &&
            msg.includes('[EMAIL SIMULATION LOG - DEV ONLY]'),
        );

      expect(simulationLogs.length).toBeGreaterThan(0);
      expect(simulationLogs[0]).not.toContain('123456');
      expect(simulationLogs[0]).toContain('******');
    });
  });
});
