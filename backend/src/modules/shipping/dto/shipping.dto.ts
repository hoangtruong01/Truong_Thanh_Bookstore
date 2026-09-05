import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateGhnShipmentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  toDistrictId: number;

  @IsString()
  toWardCode: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30000)
  weight: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  @IsOptional()
  length: number = 20;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  @IsOptional()
  width: number = 15;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  @IsOptional()
  height: number = 10;
}
