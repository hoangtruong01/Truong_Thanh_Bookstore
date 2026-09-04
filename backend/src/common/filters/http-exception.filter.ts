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
import { SentryService } from '../sentry/sentry.service';
import { sanitizeForLogging } from '../logger/log-sanitizer';

export { sanitizeForLogging } from '../logger/log-sanitizer';

type UnknownRecord = Record<string, unknown>;
type RequestWithContext = Request & {
  correlationId?: string;
  user?: { id?: unknown; _id?: unknown };
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function stringField(record: UnknownRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function printable(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return 'Unknown error';
  }
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

  constructor(private readonly sentryService?: SentryService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithContext>();

    const isProduction = process.env.NODE_ENV === 'production';
    const requestPath = request?.url ? request.url.split('?')[0] : '/';
    const requestMethod = request?.method || 'UNKNOWN';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] =
      'Đã có lỗi xảy ra từ hệ thống. Vui lòng thử lại sau.';
    let errorCode: string = ErrorCode.ERR_INTERNAL_SERVER_ERROR;
    let details: unknown = {};

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
        const res = exceptionResponse as UnknownRecord;
        const responseMessage = res.message;
        message =
          typeof responseMessage === 'string' ||
          (Array.isArray(responseMessage) &&
            responseMessage.every((item) => typeof item === 'string'))
            ? responseMessage
            : exception.message || 'Lỗi yêu cầu';
        errorCode =
          stringField(res, 'errorCode') ||
          stringField(res, 'code') ||
          errorCode;
        details = res.details ?? res.errors ?? {};

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
      isRecord(exception) &&
      stringField(exception, 'name') === 'JsonWebTokenError'
    ) {
      status = HttpStatus.UNAUTHORIZED;
      errorCode = ErrorCode.ERR_INVALID_TOKEN;
      message = 'Mã xác thực không hợp lệ hoặc đã bị chỉnh sửa';
    } else if (
      isRecord(exception) &&
      stringField(exception, 'name') === 'TokenExpiredError'
    ) {
      status = HttpStatus.UNAUTHORIZED;
      errorCode = ErrorCode.ERR_TOKEN_EXPIRED;
      message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
    } else if (
      isRecord(exception) &&
      stringField(exception, 'name') === 'NotBeforeError'
    ) {
      status = HttpStatus.UNAUTHORIZED;
      errorCode = ErrorCode.ERR_INVALID_TOKEN;
      message = 'Mã xác thực chưa có hiệu lực sử dụng';
    }
    // 3. Handle JSON parse error (SyntaxError in request body)
    else if (
      exception instanceof SyntaxError &&
      'status' in exception &&
      (exception as SyntaxError & { status?: unknown }).status === 400
    ) {
      status = HttpStatus.BAD_REQUEST;
      errorCode = ErrorCode.ERR_BAD_REQUEST;
      message = 'Định dạng dữ liệu JSON gửi lên không hợp lệ';
    }
    // 4. Handle MongoDB / Mongoose / Database errors
    else if (isRecord(exception)) {
      const err = exception;
      const errName = stringField(err, 'name');
      const errMsg = stringField(err, 'message') || '';

      if (
        errName === 'RangeError' ||
        (errName === 'MongoServerError' && errMsg.includes('too large')) ||
        errMsg.includes('OUT_OF_RANGE')
      ) {
        status = HttpStatus.BAD_REQUEST;
        errorCode = ErrorCode.ERR_PAYLOAD_TOO_LARGE;
        message =
          'Dung lượng dữ liệu hoặc hình ảnh quá lớn (vượt quá giới hạn của CSDL). Vui lòng giảm kích thước ảnh trước khi tải lên!';
      } else if (errName === 'ValidationError' && isRecord(err.errors)) {
        status = HttpStatus.BAD_REQUEST;
        errorCode = ErrorCode.ERR_DB_VALIDATION;
        const msgList = Object.values(err.errors).map((value) =>
          isRecord(value)
            ? stringField(value, 'message') || printable(value)
            : printable(value),
        );
        message = `Dữ liệu không hợp lệ: ${msgList.join('; ')}`;
        details = msgList;
      } else if (err.code === 11000) {
        status = HttpStatus.CONFLICT;
        errorCode = ErrorCode.ERR_DUPLICATE_KEY;
        message = 'Dữ liệu hoặc đường dẫn đã tồn tại trên hệ thống (trùng lặp)';
        if (isRecord(err.keyValue)) {
          details = { duplicateFields: Object.keys(err.keyValue) };
        }
      } else if (errName === 'CastError') {
        status = HttpStatus.BAD_REQUEST;
        errorCode = ErrorCode.ERR_INVALID_ID;
        message = `Giá trị trường '${stringField(err, 'path') || 'unknown'}' không đúng định dạng ID hợp lệ`;
      }
    }

    // 5. Production Security & Masking for 5xx Internal Server Errors
    if (Number(status) >= 500) {
      if (isProduction) {
        message = 'Đã có lỗi xảy ra từ hệ thống. Vui lòng thử lại sau.';
        details = {};
      } else {
        const currentDetails = isRecord(details) ? details : {};
        if (isRecord(exception) && !currentDetails.error) {
          details = {
            error: stringField(exception, 'message') || printable(exception),
            stack: stringField(exception, 'stack'),
          };
        }
      }
    }

    // 6. Structured Logging with Credential Redaction & Correlation ID
    const rawCorrelationId =
      request?.correlationId ||
      request?.headers?.['x-correlation-id'] ||
      request?.headers?.['x-request-id'];
    const correlationId =
      typeof rawCorrelationId === 'string' && rawCorrelationId.trim()
        ? rawCorrelationId.trim()
        : undefined;

    const clientIp =
      request?.headers?.['x-forwarded-for'] ||
      request?.socket?.remoteAddress ||
      'UNKNOWN_IP';
    const userId = request?.user?.id || request?.user?._id || 'ANONYMOUS';
    const logClientIp = Array.isArray(clientIp)
      ? clientIp.join(', ')
      : String(clientIp);
    const logUserId = printable(userId);

    const logPayload = {
      timestamp: new Date().toISOString(),
      correlationId,
      method: requestMethod,
      path: request?.url || requestPath,
      statusCode: status,
      errorCode,
      clientIp: logClientIp,
      userId: logUserId,
      query: sanitizeForLogging(request?.query || {}),
      body: sanitizeForLogging((request?.body as unknown) || {}),
    };

    if (Number(status) >= 500) {
      // Forward 5xx errors to Sentry if available
      if (this.sentryService) {
        try {
          this.sentryService.captureException(exception, {
            correlationId,
            path: request?.url || requestPath,
            method: requestMethod,
            statusCode: status,
            errorCode,
            userId: logUserId,
            clientIp: logClientIp,
          });
        } catch {
          // Ignore Sentry dispatch failures
        }
      }

      const stack =
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception);
      this.logger.error(
        `[${requestMethod}] ${request?.url} | Status: ${status} | Code: ${errorCode} | User: ${logUserId} | IP: ${logClientIp} | CID: ${correlationId || 'N/A'}\n` +
          `Context: ${JSON.stringify(logPayload)}\n` +
          `Stack: ${stack}`,
      );
    } else {
      this.logger.warn(
        `[${requestMethod}] ${request?.url} | Status: ${status} | Code: ${errorCode} | Msg: ${Array.isArray(message) ? message.join('; ') : message} | User: ${logUserId} | IP: ${logClientIp} | CID: ${correlationId || 'N/A'}`,
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
      correlationId,
    });
  }
}
