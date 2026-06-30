import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';

export class CreateNotificationDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(['order', 'promotion', 'system'])
  @IsOptional()
  type?: string;

  @IsObject()
  @IsOptional()
  meta?: Record<string, any>;
}
