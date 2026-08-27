import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { sanitizePayload, isForbiddenKey } from '../security/security.sanitizer';

@Injectable()
export class SecuritySanitizerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecuritySanitizerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Sanitize Body
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizePayload(req.body);
      }

      // 2. Sanitize Query Parameters
      if (req.query && typeof req.query === 'object') {
        // Sanitize NoSQL & XSS in query
        req.query = sanitizePayload(req.query);
      }

      // 3. Sanitize URL Route Params
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizePayload(req.params);
      }
    } catch (error: any) {
      this.logger.warn(`Lỗi khi làm sạch dữ liệu đầu vào: ${error.message}`);
    }

    next();
  }
}
