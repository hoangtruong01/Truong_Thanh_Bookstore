import {
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(4096)
  deviceToken: string;

  @IsIn(['android', 'ios', 'web'])
  platform: 'android' | 'ios' | 'web';
}
