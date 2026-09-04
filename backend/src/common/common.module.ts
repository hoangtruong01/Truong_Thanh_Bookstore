import { Global, Module } from '@nestjs/common';
import { SentryService } from './sentry/sentry.service';
import { SecurityAuditService } from './audit/security-audit.service';
import { StructuredLoggerService } from './logger/structured-logger.service';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

@Global()
@Module({
  providers: [
    SentryService,
    SecurityAuditService,
    StructuredLoggerService,
    LoggingInterceptor,
  ],
  exports: [
    SentryService,
    SecurityAuditService,
    StructuredLoggerService,
    LoggingInterceptor,
  ],
})
export class CommonModule {}
