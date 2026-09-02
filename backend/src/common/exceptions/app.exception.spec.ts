import { HttpStatus } from '@nestjs/common';
import {
  AppException,
  BusinessException,
  ResourceNotFoundException,
  UnauthorizedActionException,
  ForbiddenActionException,
  ValidationException,
  ConflictResourceException,
  InsufficientStockException,
} from './app.exception';
import { ErrorCode } from '../enums/error-code.enum';

describe('Custom Exceptions', () => {
  it('AppException should instantiate with default values', () => {
    const exc = new AppException();
    expect(exc.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(exc.errorCode).toBe(ErrorCode.ERR_INTERNAL_SERVER_ERROR);
    expect(exc.getResponse()).toEqual({
      message: 'Đã có lỗi xảy ra từ hệ thống',
      errorCode: ErrorCode.ERR_INTERNAL_SERVER_ERROR,
      details: null,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  });

  it('BusinessException should instantiate with BAD_REQUEST', () => {
    const exc = new BusinessException(
      'Voucher hết lượt dùng',
      ErrorCode.ERR_VOUCHER_USAGE_LIMIT,
      { code: 'SALE50' },
    );
    expect(exc.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exc.errorCode).toBe(ErrorCode.ERR_VOUCHER_USAGE_LIMIT);
    expect(exc.details).toEqual({ code: 'SALE50' });
  });

  it('ResourceNotFoundException should instantiate with NOT_FOUND', () => {
    const exc = new ResourceNotFoundException(
      'Không tìm thấy sản phẩm',
      ErrorCode.ERR_PRODUCT_NOT_FOUND,
    );
    expect(exc.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(exc.errorCode).toBe(ErrorCode.ERR_PRODUCT_NOT_FOUND);
  });

  it('UnauthorizedActionException should instantiate with UNAUTHORIZED', () => {
    const exc = new UnauthorizedActionException();
    expect(exc.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(exc.errorCode).toBe(ErrorCode.ERR_UNAUTHORIZED);
  });

  it('ForbiddenActionException should instantiate with FORBIDDEN', () => {
    const exc = new ForbiddenActionException();
    expect(exc.getStatus()).toBe(HttpStatus.FORBIDDEN);
    expect(exc.errorCode).toBe(ErrorCode.ERR_FORBIDDEN);
  });

  it('ValidationException should instantiate with ERR_VALIDATION', () => {
    const exc = new ValidationException('Lỗi validation', {
      email: 'Email required',
    });
    expect(exc.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exc.errorCode).toBe(ErrorCode.ERR_VALIDATION);
    expect(exc.details).toEqual({ email: 'Email required' });
  });

  it('ConflictResourceException should instantiate with CONFLICT', () => {
    const exc = new ConflictResourceException(
      'Email đã tồn tại',
      ErrorCode.ERR_EMAIL_ALREADY_EXISTS,
    );
    expect(exc.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(exc.errorCode).toBe(ErrorCode.ERR_EMAIL_ALREADY_EXISTS);
  });

  it('InsufficientStockException should instantiate with ERR_INSUFFICIENT_STOCK', () => {
    const exc = new InsufficientStockException('Hết hàng', { available: 0 });
    expect(exc.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exc.errorCode).toBe(ErrorCode.ERR_INSUFFICIENT_STOCK);
    expect(exc.details).toEqual({ available: 0 });
  });
});
