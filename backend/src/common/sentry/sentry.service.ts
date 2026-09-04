import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sanitizeForLogging } from '../logger/log-sanitizer';

@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);
  private sentryInstance: any = null;
  private isInitialized = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const dsn = this.configService.get<string>('SENTRY_DSN');
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    if (!dsn) {
      this.logger.log(
        'SENTRY_DSN is not configured. Sentry tracking is disabled (graceful fallback).',
      );
      return;
    }

    try {
      const Sentry = await import('@sentry/node');
      Sentry.init({
        dsn,
        environment: nodeEnv,
        tracesSampleRate: nodeEnv === 'production' ? 0.2 : 1.0,
        beforeSend: (event) => sanitizeForLogging(event),
      });
      this.sentryInstance = Sentry;
      this.isInitialized = true;
      this.logger.log(
        `Sentry initialized successfully for environment: ${nodeEnv}`,
      );
    } catch (err: any) {
      this.logger.warn(`Failed to initialize Sentry: ${err.message}`);
    }
  }

  /**
   * Captures an unhandled exception or 5xx server error in Sentry with extra context
   */
  captureException(
    exception: any,
    context?: Record<string, unknown>,
  ): string | undefined {
    if (!this.isInitialized || !this.sentryInstance) {
      return undefined;
    }

    try {
      return this.sentryInstance.captureException(exception, {
        extra: sanitizeForLogging(context),
      });
    } catch (err: any) {
      this.logger.warn(`Failed to capture exception in Sentry: ${err.message}`);
      return undefined;
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}
