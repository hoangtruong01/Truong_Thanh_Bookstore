import { ConfigService } from '@nestjs/config';
import { SentryService } from './sentry.service';

describe('SentryService', () => {
  let service: SentryService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string, defaultValue?: unknown): unknown => {
        if (key === 'SENTRY_DSN') return undefined;
        if (key === 'NODE_ENV') return 'test';
        return defaultValue;
      }),
    } as unknown as ConfigService;

    service = new SentryService(configService);
  });

  it('gracefully disables Sentry when SENTRY_DSN is not provided', async () => {
    await service.onModuleInit();
    expect(service.isReady()).toBe(false);

    const eventId = service.captureException(new Error('Test error'));
    expect(eventId).toBeUndefined();
  });

  it('captures exception when Sentry is initialized', async () => {
    const mockCaptureException = jest.fn().mockReturnValue('mock-event-id-123');
    const mutableService = service as unknown as {
      sentryInstance: { captureException: typeof mockCaptureException };
      isInitialized: boolean;
    };
    mutableService.sentryInstance = {
      captureException: mockCaptureException,
    };
    mutableService.isInitialized = true;

    const eventId = service.captureException(new Error('500 Database Error'), {
      correlationId: 'req-abc',
      userId: 'user-xyz',
      resetToken: 'must-not-leave-process',
    });

    expect(eventId).toBe('mock-event-id-123');
    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error), {
      extra: {
        correlationId: 'req-abc',
        userId: 'user-xyz',
        resetToken: '***REDACTED***',
      },
    });
  });
});
