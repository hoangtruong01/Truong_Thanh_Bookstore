import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: any;
}

export interface StandardApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta | null;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  StandardApiResponse<any>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardApiResponse<any>> {
    return next.handle().pipe(
      map((resData) => {
        // If response is already formatted with success boolean
        if (
          resData &&
          typeof resData === 'object' &&
          'success' in resData &&
          'data' in resData
        ) {
          return {
            success: resData.success !== false,
            message: resData.message || 'Thao tác thành công',
            data: resData.data,
            meta: resData.meta || null,
            timestamp: resData.timestamp || new Date().toISOString(),
          };
        }

        // If response is a PaginatedResult ({ data: [...], total, page, limit, totalPages })
        if (
          resData &&
          typeof resData === 'object' &&
          Array.isArray(resData.data) &&
          'total' in resData &&
          'page' in resData
        ) {
          const { data, total, page, limit, totalPages, message, ...restMeta } =
            resData;
          return {
            success: true,
            message: message || 'Thao tác thành công',
            data,
            meta: {
              page: Number(page) || 1,
              limit: Number(limit) || 10,
              total: Number(total) || 0,
              totalPages:
                Number(totalPages) ||
                Math.ceil((Number(total) || 0) / (Number(limit) || 10)),
              ...restMeta,
            },
            timestamp: new Date().toISOString(),
          };
        }

        // Standard data response
        return {
          success: true,
          message:
            resData &&
            typeof resData === 'object' &&
            'message' in resData &&
            typeof resData.message === 'string'
              ? resData.message
              : 'Thao tác thành công',
          data: resData !== undefined ? resData : null,
          meta: null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
