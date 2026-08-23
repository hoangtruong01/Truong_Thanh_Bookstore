import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should format standard payload into { success: true, message, data, meta }', (done) => {
    const mockData = { id: 1, name: 'Sổ tay' };
    const mockContext = {} as ExecutionContext;
    const mockCallHandler: CallHandler = {
      handle: () => of(mockData),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result.success).toBe(true);
      expect(result.message).toBe('Thao tác thành công');
      expect(result.data).toEqual(mockData);
      expect(result.meta).toBeNull();
      expect(result.timestamp).toBeDefined();
      done();
    });
  });

  it('should format PaginatedResult into standardized data and meta', (done) => {
    const paginatedInput = {
      data: [{ id: 1 }, { id: 2 }],
      total: 20,
      page: 1,
      limit: 10,
      totalPages: 2,
    };
    const mockContext = {} as ExecutionContext;
    const mockCallHandler: CallHandler = {
      handle: () => of(paginatedInput),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ id: 1 }, { id: 2 }]);
      expect(result.meta).toEqual({
        total: 20,
        page: 1,
        limit: 10,
        totalPages: 2,
      });
      done();
    });
  });

  it('should handle null and empty responses gracefully', (done) => {
    const mockContext = {} as ExecutionContext;
    const mockCallHandler: CallHandler = {
      handle: () => of(null),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.meta).toBeNull();
      done();
    });
  });
});
