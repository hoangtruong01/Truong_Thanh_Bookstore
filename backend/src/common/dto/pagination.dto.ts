import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * SEC-012: Trần số bản ghi / trang. Admin Combos.vue hiện tải tối đa 1000 sản phẩm
 * một lần; các trang khác dùng <= 100. limit=0 / âm / quá lớn bị từ chối ở DTO.
 */
export const MAX_PAGE_LIMIT = 1000;

/**
 * SEC-012: Chuẩn hoá limit cho các service nhận tham số thô (không qua DTO).
 * Mongoose `.limit(0)` nghĩa là KHÔNG giới hạn, nên 0 / âm / NaN luôn rơi về mặc định.
 */
export function clampLimit(
  value: unknown,
  fallback = 10,
  max = MAX_PAGE_LIMIT,
): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: MAX_PAGE_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_LIMIT)
  limit?: number = 10;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}
