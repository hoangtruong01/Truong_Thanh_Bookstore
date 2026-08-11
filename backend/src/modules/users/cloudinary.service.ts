import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(base64Str: string): Promise<string> {
    if (!base64Str || typeof base64Str !== 'string') {
      throw new BadRequestException('Dữ liệu hình ảnh không hợp lệ');
    }

    // Validate MIME type
    const matches = base64Str.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i);
    if (!matches) {
      throw new BadRequestException('Định dạng hình ảnh không được hỗ trợ. Chỉ chấp nhận PNG, JPEG, JPG, WEBP, GIF');
    }

    // Validate size limit (5MB = 5 * 1024 * 1024 bytes)
    const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, '');
    const approximateSizeBytes = (base64Data.length * 3) / 4;
    const MAX_SIZE = 5 * 1024 * 1024;
    if (approximateSizeBytes > MAX_SIZE) {
      throw new BadRequestException('Kích thước hình ảnh vượt quá giới hạn tối đa 5MB');
    }

    try {
      const uploadResponse = await cloudinary.uploader.upload(base64Str, {
        folder: 'truong_thanh_avatars',
        resource_type: 'image',
      });
      return uploadResponse.secure_url;
    } catch (error) {
      throw new BadRequestException(`Tải ảnh lên thất bại: ${error.message}`);
    }
  }
}
