import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

function getErrorCodeFromStatus(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'ERR_BAD_REQUEST';
    case HttpStatus.UNAUTHORIZED:
      return 'ERR_UNAUTHORIZED';
    case HttpStatus.FORBIDDEN:
      return 'ERR_FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'ERR_NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'ERR_CONFLICT';
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return 'ERR_UNPROCESSABLE_ENTITY';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'ERR_RATE_LIMIT_EXCEEDED';
    default:
      return status >= 500 ? 'ERR_INTERNAL_SERVER_ERROR' : 'ERR_UNKNOWN';
  }
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Đã có lỗi xảy ra từ hệ thống. Vui lòng thử lại sau.';
    let errorCode = 'ERR_INTERNAL_SERVER_ERROR';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorCode = getErrorCodeFromStatus(status);
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as any;
        message = res.message || exception.message || 'Lỗi yêu cầu';
        errorCode = res.errorCode || res.code || errorCode;
        details = res.details || res.errors || null;

        if (Array.isArray(message)) {
          details = message;
          message = 'Dữ liệu yêu cầu không hợp lệ';
          errorCode = 'ERR_VALIDATION';
        }
      }
    } else if (exception && typeof exception === 'object') {
      const err = exception as any;
      const errMsg = err.message || '';

      if (
        err.name === 'RangeError' ||
        (err.name === 'MongoServerError' && errMsg.includes('too large')) ||
        errMsg.includes('OUT_OF_RANGE')
      ) {
        status = HttpStatus.BAD_REQUEST;
        errorCode = 'ERR_PAYLOAD_TOO_LARGE';
        message =
          'Dung lượng dữ liệu hoặc hình ảnh quá lớn (vượt quá giới hạn của CSDL). Vui lòng giảm kích thước ảnh trước khi tải lên!';
      } else if (err.name === 'ValidationError' && err.errors) {
        status = HttpStatus.BAD_REQUEST;
        errorCode = 'ERR_DB_VALIDATION';
        const msgList = Object.values(err.errors).map((e: any) => e.message);
        message = `Dữ liệu không hợp lệ: ${msgList.join('; ')}`;
        details = msgList;
      } else if (err.code === 11000) {
        status = HttpStatus.CONFLICT;
        errorCode = 'ERR_DUPLICATE_KEY';
        message = 'Dữ liệu hoặc đường dẫn đã tồn tại trên hệ thống (trùng lặp)';
      } else if (err.name === 'CastError') {
        status = HttpStatus.BAD_REQUEST;
        errorCode = 'ERR_INVALID_ID';
        message = `Giá trị trường '${err.path}' không đúng định dạng ID hợp lệ`;
      }
    }

    // Log internal server errors securely without leaking in production
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      const method = request?.method || 'UNKNOWN';
      const url = request?.url || 'UNKNOWN';
      const stack = exception instanceof Error ? exception.stack : JSON.stringify(exception);
      this.logger.error(`[${method}] ${url} - Status: ${status} - Error: ${stack}`);
    }

    response.status(status).json({
      success: false,
      message,
      errorCode,
      details: details || {},
      statusCode: status,
      timestamp: new Date().toISOString(),
    });
  }
}
