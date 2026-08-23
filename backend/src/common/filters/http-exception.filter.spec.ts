import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  it('should format HttpException into { success: false, message, errorCode, details, statusCode }', () => {
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
    const mockGetRequest = jest.fn().mockReturnValue({ method: 'GET', url: '/api/test' });

    const mockHost: ArgumentsHost = {
      switchToHttp: () => ({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
      }),
    } as unknown as ArgumentsHost;

    const exception = new HttpException(
      { message: 'Không tìm thấy sản phẩm', errorCode: 'ERR_PRODUCT_NOT_FOUND' },
      HttpStatus.NOT_FOUND,
    );

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Không tìm thấy sản phẩm',
        errorCode: 'ERR_PRODUCT_NOT_FOUND',
        statusCode: HttpStatus.NOT_FOUND,
      }),
    );
  });

  it('should handle validation errors with array of messages', () => {
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
    const mockGetRequest = jest.fn().mockReturnValue({ method: 'POST', url: '/api/products' });

    const mockHost: ArgumentsHost = {
      switchToHttp: () => ({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
      }),
    } as unknown as ArgumentsHost;

    const exception = new HttpException(
      { message: ['Tên sản phẩm không được để trống', 'Giá phải lớn hơn 0'] },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Dữ liệu yêu cầu không hợp lệ',
        errorCode: 'ERR_VALIDATION',
        details: ['Tên sản phẩm không được để trống', 'Giá phải lớn hơn 0'],
        statusCode: HttpStatus.BAD_REQUEST,
      }),
    );
  });
});
