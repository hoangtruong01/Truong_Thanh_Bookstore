import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';

export interface AppExceptionOptions {
  message?: string;
  errorCode?: ErrorCode | string;
  statusCode?: HttpStatus | number;
  details?: any;
}

export class AppException extends HttpException {
  public readonly errorCode: string;
  public readonly details: any;

  constructor(
    message: string = 'Đã có lỗi xảy ra từ hệ thống',
    errorCode: ErrorCode | string = ErrorCode.ERR_INTERNAL_SERVER_ERROR,
    statusCode: HttpStatus | number = HttpStatus.INTERNAL_SERVER_ERROR,
    details: any = null,
  ) {
    super(
      {
        message,
        errorCode,
        details,
        statusCode,
      },
      statusCode,
    );
    this.errorCode = errorCode;
    this.details = details;
  }
}

export class BusinessException extends AppException {
  constructor(
    message: string,
    errorCode: ErrorCode | string = ErrorCode.ERR_BAD_REQUEST,
    details: any = null,
  ) {
    super(message, errorCode, HttpStatus.BAD_REQUEST, details);
  }
}

export class ResourceNotFoundException extends AppException {
  constructor(
    message: string = 'Không tìm thấy tài nguyên yêu cầu',
    errorCode: ErrorCode | string = ErrorCode.ERR_NOT_FOUND,
    details: any = null,
  ) {
    super(message, errorCode, HttpStatus.NOT_FOUND, details);
  }
}

export class UnauthorizedActionException extends AppException {
  constructor(
    message: string = 'Yêu cầu xác thực không hợp lệ hoặc đã hết hạn',
    errorCode: ErrorCode | string = ErrorCode.ERR_UNAUTHORIZED,
    details: any = null,
  ) {
    super(message, errorCode, HttpStatus.UNAUTHORIZED, details);
  }
}

export class ForbiddenActionException extends AppException {
  constructor(
    message: string = 'Bạn không có quyền thực hiện thao tác này',
    errorCode: ErrorCode | string = ErrorCode.ERR_FORBIDDEN,
    details: any = null,
  ) {
    super(message, errorCode, HttpStatus.FORBIDDEN, details);
  }
}

export class ValidationException extends AppException {
  constructor(
    message: string = 'Dữ liệu yêu cầu không hợp lệ',
    details: any = null,
    errorCode: ErrorCode | string = ErrorCode.ERR_VALIDATION,
  ) {
    super(message, errorCode, HttpStatus.BAD_REQUEST, details);
  }
}

export class ConflictResourceException extends AppException {
  constructor(
    message: string = 'Dữ liệu đã tồn tại hoặc xảy ra xung đột',
    errorCode: ErrorCode | string = ErrorCode.ERR_CONFLICT,
    details: any = null,
  ) {
    super(message, errorCode, HttpStatus.CONFLICT, details);
  }
}

export class InsufficientStockException extends AppException {
  constructor(
    message: string = 'Sản phẩm trong kho không đủ số lượng yêu cầu',
    details: any = null,
  ) {
    super(
      message,
      ErrorCode.ERR_INSUFFICIENT_STOCK,
      HttpStatus.BAD_REQUEST,
      details,
    );
  }
}
