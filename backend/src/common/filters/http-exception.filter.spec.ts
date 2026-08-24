import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter, sanitizeForLogging, getErrorCodeFromStatus } from './http-exception.filter';
import { ErrorCode } from '../enums/error-code.enum';
import { AppException, BusinessException, InsufficientStockException } from '../exceptions/app.exception';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    delete process.env.NODE_ENV;
  });

  const createMockHost = (reqOverwrites: Record<string, any> = {}) => {
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
    const mockGetRequest = jest.fn().mockReturnValue({
      method: 'GET',
      url: '/api/test',
      headers: {},
      query: {},
      body: {},
      ...reqOverwrites,
    });

    const mockHost: ArgumentsHost = {
      switchToHttp: () => ({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
      }),
    } as unknown as ArgumentsHost;

    return { mockHost, mockStatus, mockJson, mockGetResponse, mockGetRequest };
  };

  describe('sanitizeForLogging', () => {
    it('should redact sensitive keys like password, token, otp, secret, creditCard in nested objects', () => {
      const input = {
        name: 'Nguyen Van A',
        email: 'test@example.com',
        password: 'SuperSecretPassword123!',
        newPassword: 'AnotherPassword456',
        nested: {
          token: 'jwt.token.here',
          otp: '123456',
          deep: {
            creditCard: '4111222233334444',
            secret: 'top_secret',
            normalField: 'hello',
          },
        },
        items: [{ id: 1, authorization: 'Bearer token123' }],
      };

      const result = sanitizeForLogging(input);

      expect(result.name).toBe('Nguyen Van A');
      expect(result.email).toBe('test@example.com');
      expect(result.password).toBe('***REDACTED***');
      expect(result.newPassword).toBe('***REDACTED***');
      expect(result.nested.token).toBe('***REDACTED***');
      expect(result.nested.otp).toBe('***REDACTED***');
      expect(result.nested.deep.creditCard).toBe('***REDACTED***');
      expect(result.nested.deep.secret).toBe('***REDACTED***');
      expect(result.nested.deep.normalField).toBe('hello');
      expect(result.items[0].authorization).toBe('***REDACTED***');
    });

    it('should return primitive values unchanged', () => {
      expect(sanitizeForLogging('test')).toBe('test');
      expect(sanitizeForLogging(123)).toBe(123);
      expect(sanitizeForLogging(null)).toBeNull();
      expect(sanitizeForLogging(undefined)).toBeUndefined();
    });
  });

  describe('getErrorCodeFromStatus', () => {
    it('should map HTTP status codes to corresponding ErrorCode enums', () => {
      expect(getErrorCodeFromStatus(HttpStatus.BAD_REQUEST)).toBe(ErrorCode.ERR_BAD_REQUEST);
      expect(getErrorCodeFromStatus(HttpStatus.UNAUTHORIZED)).toBe(ErrorCode.ERR_UNAUTHORIZED);
      expect(getErrorCodeFromStatus(HttpStatus.FORBIDDEN)).toBe(ErrorCode.ERR_FORBIDDEN);
      expect(getErrorCodeFromStatus(HttpStatus.NOT_FOUND)).toBe(ErrorCode.ERR_NOT_FOUND);
      expect(getErrorCodeFromStatus(HttpStatus.CONFLICT)).toBe(ErrorCode.ERR_CONFLICT);
      expect(getErrorCodeFromStatus(HttpStatus.UNPROCESSABLE_ENTITY)).toBe(ErrorCode.ERR_UNPROCESSABLE_ENTITY);
      expect(getErrorCodeFromStatus(HttpStatus.TOO_MANY_REQUESTS)).toBe(ErrorCode.ERR_RATE_LIMIT_EXCEEDED);
      expect(getErrorCodeFromStatus(HttpStatus.PAYLOAD_TOO_LARGE)).toBe(ErrorCode.ERR_PAYLOAD_TOO_LARGE);
      expect(getErrorCodeFromStatus(HttpStatus.SERVICE_UNAVAILABLE)).toBe(ErrorCode.ERR_SERVICE_UNAVAILABLE);
      expect(getErrorCodeFromStatus(500)).toBe(ErrorCode.ERR_INTERNAL_SERVER_ERROR);
    });
  });

  describe('Exception Handling', () => {
    it('should handle standard HttpException with string response', () => {
      const { mockHost, mockStatus, mockJson } = createMockHost();
      const exception = new HttpException('Forbidden Resource', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Forbidden Resource',
          errorCode: ErrorCode.ERR_FORBIDDEN,
          statusCode: HttpStatus.FORBIDDEN,
          path: '/api/test',
        }),
      );
    });

    it('should handle custom AppException with custom errorCode and details', () => {
      const { mockHost, mockStatus, mockJson } = createMockHost();
      const exception = new InsufficientStockException('Sản phẩm chỉ còn 2 chiếc', {
        productId: 'prod_123',
        requestedQuantity: 5,
        availableStock: 2,
      });

      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Sản phẩm chỉ còn 2 chiếc',
          errorCode: ErrorCode.ERR_INSUFFICIENT_STOCK,
          statusCode: HttpStatus.BAD_REQUEST,
          details: {
            productId: 'prod_123',
            requestedQuantity: 5,
            availableStock: 2,
          },
        }),
      );
    });

    it('should handle validation errors with array of messages', () => {
      const { mockHost, mockStatus, mockJson } = createMockHost();
      const exception = new HttpException(
        { message: ['Email không đúng định dạng', 'Mật khẩu tối thiểu 6 ký tự'] },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Dữ liệu yêu cầu không hợp lệ',
          errorCode: ErrorCode.ERR_VALIDATION,
          details: ['Email không đúng định dạng', 'Mật khẩu tối thiểu 6 ký tự'],
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
    });

    it('should handle MongoDB CastError (invalid ObjectId)', () => {
      const { mockHost, mockStatus, mockJson } = createMockHost();
      const castError = {
        name: 'CastError',
        path: '_id',
        value: 'invalid-id-format',
      };

      filter.catch(castError, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: ErrorCode.ERR_INVALID_ID,
          message: "Giá trị trường '_id' không đúng định dạng ID hợp lệ",
        }),
      );
    });

    it('should handle MongoDB Duplicate Key error (code 11000)', () => {
      const { mockHost, mockStatus, mockJson } = createMockHost();
      const duplicateKeyError = {
        code: 11000,
        keyValue: { email: 'existing@example.com' },
      };

      filter.catch(duplicateKeyError, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: ErrorCode.ERR_DUPLICATE_KEY,
          message: 'Dữ liệu hoặc đường dẫn đã tồn tại trên hệ thống (trùng lặp)',
          details: { duplicateFields: ['email'] },
        }),
      );
    });

    it('should handle MongoDB ValidationError', () => {
      const { mockHost, mockStatus, mockJson } = createMockHost();
      const mongoValidationError = {
        name: 'ValidationError',
        errors: {
          title: { message: 'Path `title` is required.' },
          price: { message: 'Path `price` must be greater than 0.' },
        },
      };

      filter.catch(mongoValidationError, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: ErrorCode.ERR_DB_VALIDATION,
          details: ['Path `title` is required.', 'Path `price` must be greater than 0.'],
        }),
      );
    });

    it('should handle MongoDB payload too large error', () => {
      const { mockHost, mockStatus, mockJson } = createMockHost();
      const mongoLargeError = {
        name: 'MongoServerError',
        message: 'BSONObj size 18456200 is too large',
      };

      filter.catch(mongoLargeError, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: ErrorCode.ERR_PAYLOAD_TOO_LARGE,
        }),
      );
    });

    it('should handle JWT JsonWebTokenError', () => {
      const { mockHost, mockStatus, mockJson } = createMockHost();
      const jwtError = {
        name: 'JsonWebTokenError',
        message: 'invalid signature',
      };

      filter.catch(jwtError, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: ErrorCode.ERR_INVALID_TOKEN,
          message: 'Mã xác thực không hợp lệ hoặc đã bị chỉnh sửa',
        }),
      );
    });

    it('should handle JWT TokenExpiredError', () => {
      const { mockHost, mockStatus, mockJson } = createMockHost();
      const tokenExpiredError = {
        name: 'TokenExpiredError',
        message: 'jwt expired',
      };

      filter.catch(tokenExpiredError, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: ErrorCode.ERR_TOKEN_EXPIRED,
          message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại',
        }),
      );
    });

    it('should handle malformed JSON SyntaxError in request body', () => {
      const { mockHost, mockStatus, mockJson } = createMockHost();
      const syntaxError = new SyntaxError('Unexpected token in JSON at position 10');
      (syntaxError as any).status = 400;

      filter.catch(syntaxError, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: ErrorCode.ERR_BAD_REQUEST,
          message: 'Định dạng dữ liệu JSON gửi lên không hợp lệ',
        }),
      );
    });

    it('should mask stack traces and details in Production mode for 500 errors', () => {
      process.env.NODE_ENV = 'production';
      const { mockHost, mockStatus, mockJson } = createMockHost();
      const internalError = new Error('Database password was incorrect in connection string');

      filter.catch(internalError, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Đã có lỗi xảy ra từ hệ thống. Vui lòng thử lại sau.',
          errorCode: ErrorCode.ERR_INTERNAL_SERVER_ERROR,
          details: {},
        }),
      );
    });
  });
});
