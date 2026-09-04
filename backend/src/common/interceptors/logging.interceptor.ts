import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { StructuredLoggerService } from '../logger/structured-logger.service';

type ObservedRequest = Request & {
  correlationId?: string;
  user?: { id?: string; _id?: string };
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: StructuredLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<ObservedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();
    let failedStatusCode: number | undefined;

    const correlationId =
      request.correlationId ||
      request.get('x-correlation-id') ||
      request.get('x-request-id') ||
      '';

    const method = request.method;
    const url = request.originalUrl || request.url;
    const rawIp =
      request.headers['x-forwarded-for'] ||
      request.socket.remoteAddress ||
      'UNKNOWN_IP';
    const clientIp = Array.isArray(rawIp) ? rawIp.join(', ') : String(rawIp);

    return next.handle().pipe(
      tap({
        error: (error: unknown) => {
          failedStatusCode =
            error instanceof HttpException ? error.getStatus() : 500;
        },
      }),
      finalize(() => {
        const duration = Date.now() - startTime;
        const statusCode = failedStatusCode ?? response.statusCode;
        const userId = request.user?.id || request.user?._id || 'ANONYMOUS';

        this.logger.log('HTTP request completed', 'HTTP', {
          type: 'HTTP_ACCESS',
          method,
          path: url.split('?')[0],
          statusCode,
          durationMs: duration,
          correlationId,
          userId: String(userId),
          clientIp,
        });
      }),
    );
  }
}
