import {
  isForbiddenKey,
  sanitizeXss,
  sanitizePayload,
} from './security.sanitizer';
import { SecuritySanitizerMiddleware } from '../middleware/security-sanitizer.middleware';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';

describe('Security Sanitizer & Middleware Spec', () => {
  describe('1. isForbiddenKey Check (NoSQL Injection & Prototype Pollution)', () => {
    it('should identify MongoDB operator keys starting with $', () => {
      expect(isForbiddenKey('$gt')).toBe(true);
      expect(isForbiddenKey('$ne')).toBe(true);
      expect(isForbiddenKey('$where')).toBe(true);
      expect(isForbiddenKey('$regex')).toBe(true);
      expect(isForbiddenKey('$or')).toBe(true);
      expect(isForbiddenKey('$expr')).toBe(true);
      expect(isForbiddenKey('$in')).toBe(true);
      expect(isForbiddenKey(' $gt ')).toBe(true);
    });

    it('should identify dot notation injection keys', () => {
      expect(isForbiddenKey('user.role')).toBe(true);
      expect(isForbiddenKey('address.city')).toBe(true);
      expect(isForbiddenKey('items.0.price')).toBe(true);
    });

    it('should identify prototype pollution keys', () => {
      expect(isForbiddenKey('__proto__')).toBe(true);
      expect(isForbiddenKey('prototype')).toBe(true);
      expect(isForbiddenKey('constructor')).toBe(true);
      expect(isForbiddenKey('__PROTO__')).toBe(true);
      expect(isForbiddenKey('Constructor')).toBe(true);
    });

    it('should allow legitimate field names', () => {
      expect(isForbiddenKey('name')).toBe(false);
      expect(isForbiddenKey('email')).toBe(false);
      expect(isForbiddenKey('password')).toBe(false);
      expect(isForbiddenKey('price')).toBe(false);
      expect(isForbiddenKey('orderCode')).toBe(false);
      expect(isForbiddenKey('recipient_name')).toBe(false);
    });
  });

  describe('2. sanitizeXss (Cross-Site Scripting Protection)', () => {
    it('should strip script tags', () => {
      const input = '<script>alert("XSS")</script>Hello World';
      expect(sanitizeXss(input)).toBe('Hello World');
    });

    it('should strip script tags with attributes and multiline code', () => {
      const input = '<script type="text/javascript">\nconsole.log("hacked");\n</script>Safe Content';
      expect(sanitizeXss(input)).toBe('Safe Content');
    });

    it('should strip iframe, object, embed and applet tags', () => {
      const input = '<iframe src="http://evil.com"></iframe><object data="evil.swf"></object><embed src="evil.swf"><applet code="evil.class"></applet>Content';
      expect(sanitizeXss(input)).toBe('Content');
    });

    it('should strip javascript: and data:text/html pseudo-protocols', () => {
      const input = '<a href="javascript:alert(1)">Click</a>';
      expect(sanitizeXss(input)).toBe('<a href="alert(1)">Click</a>');
    });

    it('should strip inline event handlers like onerror and onload', () => {
      const input = '<img src="invalid.jpg" onerror="alert(1)" onload="fetch()"/>';
      const output = sanitizeXss(input);
      expect(output).not.toContain('onerror');
      expect(output).not.toContain('onload');
      expect(output).toContain('<img src="invalid.jpg"  />');
    });

    it('should preserve safe Vietnamese text with diacritics and symbols', () => {
      const input = 'Sách Giáo Khoa Toán Lớp 10 & Tập Vở Học Sinh (Mới 100% - Giá 25.000đ)';
      expect(sanitizeXss(input)).toBe(input);
    });

    it('should preserve standard web links and emails', () => {
      const input = 'https://truongthanh.vn/products/but-bi?brand=ThienLong&sort=asc';
      expect(sanitizeXss(input)).toBe(input);
    });
  });

  describe('3. sanitizePayload (Recursive Deep Cleaning)', () => {
    it('should remove NoSQL injection keys from nested objects', () => {
      const maliciousPayload = {
        email: { $gt: '' },
        filter: {
          $where: 'sleep(5000)',
          category: 'books',
        },
        regularField: 'valid value',
      };

      const cleaned = sanitizePayload(maliciousPayload);
      expect(cleaned.email).toEqual({});
      expect(cleaned.filter).toEqual({ category: 'books' });
      expect(cleaned.regularField).toBe('valid value');
    });

    it('should remove prototype pollution attempts', () => {
      const maliciousPayload = JSON.parse(
        '{"name": "Hacker", "__proto__": {"isAdmin": true}, "constructor": {"evil": true}}',
      );

      const cleaned = sanitizePayload(maliciousPayload);
      expect(cleaned.name).toBe('Hacker');
      expect(Object.prototype.hasOwnProperty.call(cleaned, '__proto__')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(cleaned, 'constructor')).toBe(false);
      expect((Object.prototype as any).isAdmin).toBeUndefined();
    });

    it('should clean XSS strings in nested objects and arrays', () => {
      const payload = {
        customerName: '<script>alert(1)</script>Nguyễn Văn A',
        notes: '<img src=x onerror=alert(2)>Giao hàng cẩn thận',
        items: [
          { name: '<script>evil()</script>Bút bi Thiên Long' },
          { name: 'Thước kẻ 20cm' },
        ],
      };

      const cleaned = sanitizePayload(payload);
      expect(cleaned.customerName).toBe('Nguyễn Văn A');
      expect(cleaned.notes).toBe('<img src=x >Giao hàng cẩn thận');
      expect(cleaned.items[0].name).toBe('Bút bi Thiên Long');
      expect(cleaned.items[1].name).toBe('Thước kẻ 20cm');
    });

    it('should NOT alter sensitive fields like password or token', () => {
      const authPayload = {
        email: 'user@truongthanh.vn',
        password: 'P@$$w0rd!&<SpecialChar>',
        token: 'secret-token-value-with-$',
      };

      const cleaned = sanitizePayload(authPayload);
      expect(cleaned.password).toBe('P@$$w0rd!&<SpecialChar>');
      expect(cleaned.token).toBe('secret-token-value-with-$');
    });

    it('should preserve primitive values and Date instances', () => {
      const now = new Date();
      const payload = {
        quantity: 10,
        inStock: true,
        price: 15000.5,
        createdDate: now,
      };

      const cleaned = sanitizePayload(payload);
      expect(cleaned.quantity).toBe(10);
      expect(cleaned.inStock).toBe(true);
      expect(cleaned.price).toBe(15000.5);
      expect(cleaned.createdDate).toEqual(now);
    });
  });

  describe('4. SecuritySanitizerMiddleware Integration', () => {
    let middleware: SecuritySanitizerMiddleware;

    beforeEach(() => {
      middleware = new SecuritySanitizerMiddleware();
    });

    it('should clean req.body, req.query, and req.params', () => {
      const mockReq: any = {
        body: {
          title: '<script>alert(1)</script>Truyện Kiều',
          $where: 'evil',
        },
        query: {
          search: '<script>alert(2)</script>Sách',
          'nested.field': 'injection',
        },
        params: {
          id: '<script>evil</script>507f1f77bcf86cd799439011',
        },
      };
      const mockRes: any = {};
      const nextFn = jest.fn();

      middleware.use(mockReq, mockRes, nextFn);

      expect(mockReq.body).toEqual({ title: 'Truyện Kiều' });
      expect(mockReq.query).toEqual({ search: 'Sách' });
      expect(mockReq.params).toEqual({ id: '507f1f77bcf86cd799439011' });
      expect(nextFn).toHaveBeenCalled();
    });

    it('should reject cookie-authenticated mutations without the CSRF header', () => {
      const mockReq: any = {
        method: 'POST',
        headers: {},
        cookies: { access_token: 'cookie-token' },
        get: jest.fn().mockReturnValue(undefined),
      };

      expect(() => middleware.use(mockReq, {} as any, jest.fn())).toThrow(
        'CSRF',
      );
    });

    it('should allow cookie-authenticated mutations with the CSRF header', () => {
      const nextFn = jest.fn();
      const mockReq: any = {
        method: 'POST',
        headers: {},
        cookies: { access_token: 'cookie-token' },
        get: jest.fn().mockReturnValue('XMLHttpRequest'),
      };

      middleware.use(mockReq, {} as any, nextFn);
      expect(nextFn).toHaveBeenCalledTimes(1);
    });

    it('should sanitize an Express 5 getter-only query without returning 400', () => {
      const nextFn = jest.fn();
      const mockReq: any = { method: 'GET', headers: {}, body: {}, params: {} };
      Object.defineProperty(mockReq, 'query', {
        get: () => ({ search: '<script>bad()</script>book', $where: 'evil' }),
        configurable: true,
      });

      middleware.use(mockReq, {} as any, nextFn);

      expect(mockReq.query).toEqual({ search: 'book' });
      expect(nextFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('5. Rate Limiting Exception Handling in HttpExceptionFilter', () => {
    let filter: HttpExceptionFilter;

    beforeEach(() => {
      filter = new HttpExceptionFilter();
    });

    it('should format 429 Too Many Requests with Vietnamese message and ERR_RATE_LIMIT_EXCEEDED', () => {
      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      const mockHost: any = {
        switchToHttp: () => ({
          getResponse: () => ({ status: mockStatus }),
          getRequest: () => ({
            url: '/api/auth/login',
            method: 'POST',
            body: {},
            query: {},
          }),
        }),
      };

      const rateLimitException = new HttpException(
        'ThrottlerException: Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );

      filter.catch(rateLimitException, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          errorCode: ErrorCode.ERR_RATE_LIMIT_EXCEEDED,
          message: 'Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau ít phút!',
        }),
      );
    });
  });
});
