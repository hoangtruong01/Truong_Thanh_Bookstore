import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ErrorCode } from '../enums/error-code.enum';

const SENSITIVE_KEYS = new Set([
  'password',
  'newpassword',
  'oldpassword',
  'confirmpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'otp',
  'resetotp',
  'secret',
  'apikey',
  'creditcard',
  'cvv',
  'cardnumber',
]);

/**
 * Recursively sanitize an object by masking sensitive keys
 */
export function sanitizeForLogging(data: any, depth = 0): any {
  if (depth > 5 || data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForLogging(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Map standard HTTP status codes to standardized system error codes
 */
export function getErrorCodeFromStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCode.ERR_BAD_REQUEST;
    case 401:
      return ErrorCode.ERR_UNAUTHORIZED;
    case 403:
      return ErrorCode.ERR_FORBIDDEN;
    case 404:
      return ErrorCode.ERR_NOT_FOUND;
    case 409:
      return ErrorCode.ERR_CONFLICT;
    case 422:
      return ErrorCode.ERR_UNPROCESSABLE_ENTITY;
    case 429:
      return ErrorCode.ERR_RATE_LIMIT_EXCEEDED;
    case 413:
      return ErrorCode.ERR_PAYLOAD_TOO_LARGE;
    case 503:
      return ErrorCode.ERR_SERVICE_UNAVAILABLE;
    default:
      return Number(status) >= 500
        ? ErrorCode.ERR_INTERNAL_SERVER_ERROR
        : ErrorCode.ERR_UNKNOWN;
  }
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isProduction = process.env.NODE_ENV === 'production';
    const requestPath = request?.url ? request.url.split('?')[0] : '/';
    const requestMethod = request?.method || 'UNKNOWN';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Đã có lỗi xảy ra từ hệ thống. Vui lòng thử lại sau.';
    let errorCode: string = ErrorCode.ERR_INTERNAL_SERVER_ERROR;
    let details: any = {};

    // 1. Handle NestJS HttpException and subclasses (e.g. AppException, BadRequestException)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorCode = getErrorCodeFromStatus(status);
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const res = exceptionResponse as Record<string, any>;
        message = res.message || exception.message || 'Lỗi yêu cầu';
        errorCode = res.errorCode || res.code || errorCode;
        details = res.details || res.errors || {};

        // If message is an array from ValidationPipe
        if (Array.isArray(message)) {
          details = message;
          message = 'Dữ liệu yêu cầu không hợp lệ';
          errorCode = ErrorCode.ERR_VALIDATION;
        }
      }

      // Friendly message for Rate Limiting / ThrottlerException
      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        errorCode = ErrorCode.ERR_RATE_LIMIT_EXCEEDED;
        message =
          'Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau ít phút!';
      }
    }
    // 2. Handle JWT errors
    else if (
      exception &&
      typeof exception === 'object' &&
      (exception as any).name === 'JsonWebTokenError'
    ) {
      status = HttpStatus.UNAUTHORIZED;
      errorCode = ErrorCode.ERR_INVALID_TOKEN;
      message = 'Mã xác thực không hợp lệ hoặc đã bị chỉnh sửa';
    } else if (
      exception &&
      typeof exception === 'object' &&
      (exception as any).name === 'TokenExpiredError'
    ) {
      status = HttpStatus.UNAUTHORIZED;
      errorCode = ErrorCode.ERR_TOKEN_EXPIRED;
      message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
    } else if (
      exception &&
      typeof exception === 'object' &&
      (exception as any).name === 'NotBeforeError'
    ) {
      status = HttpStatus.UNAUTHORIZED;
      errorCode = ErrorCode.ERR_INVALID_TOKEN;
      message = 'Mã xác thực chưa có hiệu lực sử dụng';
    }
    // 3. Handle JSON parse error (SyntaxError in request body)
    else if (
      exception instanceof SyntaxError &&
      'status' in exception &&
      (exception as any).status === 400
    ) {
      status = HttpStatus.BAD_REQUEST;
      errorCode = ErrorCode.ERR_BAD_REQUEST;
      message = 'Định dạng dữ liệu JSON gửi lên không hợp lệ';
    }
    // 4. Handle MongoDB / Mongoose / Database errors
    else if (exception && typeof exception === 'object') {
      const err = exception as any;
      const errMsg = err.message || '';

      if (
        err.name === 'RangeError' ||
        (err.name === 'MongoServerError' && errMsg.includes('too large')) ||
        errMsg.includes('OUT_OF_RANGE')
      ) {
        status = HttpStatus.BAD_REQUEST;
        errorCode = ErrorCode.ERR_PAYLOAD_TOO_LARGE;
        message =
          'Dung lượng dữ liệu hoặc hình ảnh quá lớn (vượt quá giới hạn của CSDL). Vui lòng giảm kích thước ảnh trước khi tải lên!';
      } else if (err.name === 'ValidationError' && err.errors) {
        status = HttpStatus.BAD_REQUEST;
        errorCode = ErrorCode.ERR_DB_VALIDATION;
        const msgList = Object.values(err.errors).map((e: any) => e.message);
        message = `Dữ liệu không hợp lệ: ${msgList.join('; ')}`;
        details = msgList;
      } else if (err.code === 11000) {
        status = HttpStatus.CONFLICT;
        errorCode = ErrorCode.ERR_DUPLICATE_KEY;
        message = 'Dữ liệu hoặc đường dẫn đã tồn tại trên hệ thống (trùng lặp)';
        if (err.keyValue) {
          details = { duplicateFields: Object.keys(err.keyValue) };
        }
      } else if (err.name === 'CastError') {
        status = HttpStatus.BAD_REQUEST;
        errorCode = ErrorCode.ERR_INVALID_ID;
        message = `Giá trị trường '${err.path}' không đúng định dạng ID hợp lệ`;
      }
    }

    // 5. Production Security & Masking for 5xx Internal Server Errors
    if (Number(status) >= 500) {
      if (isProduction) {
        message = 'Đã có lỗi xảy ra từ hệ thống. Vui lòng thử lại sau.';
        details = {};
      } else {
        const rawErr = exception as any;
        if (rawErr && typeof rawErr === 'object' && !details.error) {
          details = {
            error: rawErr.message || String(exception),
            stack: rawErr.stack,
          };
        }
      }
    }

    // 6. Structured Logging with Credential Redaction
    const clientIp =
      request?.headers?.['x-forwarded-for'] ||
      request?.socket?.remoteAddress ||
      'UNKNOWN_IP';
    const userId =
      (request as any)?.user?.id || (request as any)?.user?._id || 'ANONYMOUS';
    const logClientIp = Array.isArray(clientIp)
      ? clientIp.join(', ')
      : String(clientIp);
    const logUserId = String(userId);

    const logPayload = {
      timestamp: new Date().toISOString(),
      method: requestMethod,
      path: request?.url || requestPath,
      statusCode: status,
      errorCode,
      clientIp,
      userId,
      query: sanitizeForLogging(request?.query || {}),
      body: sanitizeForLogging(request?.body || {}),
    };

    if (Number(status) >= 500) {
      const stack =
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception);
      this.logger.error(
        `[${requestMethod}] ${request?.url} | Status: ${status} | Code: ${errorCode} | User: ${logUserId} | IP: ${logClientIp}\n` +
          `Context: ${JSON.stringify(logPayload)}\n` +
          `Stack: ${stack}`,
      );
    } else {
      this.logger.warn(
        `[${requestMethod}] ${request?.url} | Status: ${status} | Code: ${errorCode} | Msg: ${Array.isArray(message) ? message.join('; ') : message} | User: ${logUserId} | IP: ${logClientIp}`,
      );
    }

    // 7. Send standardized JSON response
    response.status(status).json({
      success: false,
      message,
      errorCode,
      details: details || {},
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: requestPath,
    });
  }
}
