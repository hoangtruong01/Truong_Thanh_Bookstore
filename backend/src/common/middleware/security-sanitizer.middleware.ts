import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { sanitizePayload } from '../security/security.sanitizer';

@Injectable()
export class SecuritySanitizerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecuritySanitizerMiddleware.name);

  use(req: Request, _res: Response, next: NextFunction) {
    const unsafeMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
      req.method,
    );
    const cookieAuthenticated = Boolean(
      req.cookies?.access_token || req.cookies?.refresh_token,
    );
    const bearerAuthenticated =
      req.headers?.authorization?.startsWith('Bearer ');

    if (
      unsafeMethod &&
      cookieAuthenticated &&
      !bearerAuthenticated &&
      req.get('X-Requested-With') !== 'XMLHttpRequest'
    ) {
      throw new ForbiddenException('Yêu cầu không vượt qua kiểm tra CSRF');
    }

    try {
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizePayload(req.body);
      }
      if (req.query && typeof req.query === 'object') {
        // Express 5 exposes req.query through a getter, so direct assignment
        // throws even for an empty query. Shadow the getter on this request.
        Object.defineProperty(req, 'query', {
          value: sanitizePayload(req.query),
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizePayload(req.params);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Invalid input payload: ${message}`);
      throw new BadRequestException('Dữ liệu đầu vào không hợp lệ');
    }

    next();
  }
}
