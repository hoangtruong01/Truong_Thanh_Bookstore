import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as any;
        message = res.message || exception.message;
        errors = res.errors || null;
        if (Array.isArray(message)) {
          errors = message;
          message = 'Validation failed';
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
        message = 'Dung lượng dữ liệu hoặc hình ảnh quá lớn (vượt quá giới hạn 16MB của CSDL). Vui lòng giảm kích thước ảnh trước khi tải lên!';
      } else if (err.name === 'ValidationError' && err.errors) {
        status = HttpStatus.BAD_REQUEST;
        const msgList = Object.values(err.errors).map((e: any) => e.message);
        message = `Dữ liệu không hợp lệ: ${msgList.join('; ')}`;
        errors = msgList;
      } else if (err.code === 11000) {
        status = HttpStatus.BAD_REQUEST;
        message = 'Đường dẫn hoặc dữ liệu đã tồn tại (trùng lặp)';
      } else if (err.name === 'CastError') {
        status = HttpStatus.BAD_REQUEST;
        message = `Giá trị trường '${err.path}' không hợp lệ`;
      }
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      const req = ctx.getRequest();
      const method = req.method;
      const url = req.url;
      const stack = exception instanceof Error ? exception.stack : JSON.stringify(exception);
      this.logger.error(`[${method}] ${url} - Status: ${status} - Error: ${stack}`);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }
}
