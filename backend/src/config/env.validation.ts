import 'reflect-metadata';
import { plainToInstance, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
  PROVISION = 'provision',
}

export enum CookieSameSite {
  LAX = 'lax',
  STRICT = 'strict',
  NONE = 'none',
}

const INSECURE_DEFAULT_SECRETS = [
  'secret',
  '123456',
  'password',
  'admin',
  'TruongThanhDevDefaultSecretKey2026!',
  'your_jwt_secret_here',
  'your_jwt_secret_key_here',
  'default_secret',
  'changeme',
];

const SUPPORTED_PAYMENT_METHODS = new Set([
  'COD',
  'BANK_TRANSFER',
  'VNPAY',
  'MOMO',
]);

export class EnvironmentVariables {
  @IsEnum(Environment, {
    message:
      'NODE_ENV phải là một trong các giá trị: development, production, test, provision',
  })
  @IsOptional()
  NODE_ENV: Environment = Environment.DEVELOPMENT;

  @Type(() => Number)
  @IsNumber({}, { message: 'PORT phải là một số hợp lệ' })
  @Min(1000, { message: 'PORT tối thiểu phải là 1000' })
  @Max(65535, { message: 'PORT tối đa là 65535' })
  @IsOptional()
  PORT: number = 3000;

  @IsString({ message: 'MONGODB_URI phải là một chuỗi kết nối hợp lệ' })
  @IsNotEmpty({
    message: 'MONGODB_URI là biến môi trường bắt buộc (không được để trống)',
  })
  MONGODB_URI: string;

  @IsString({ message: 'JWT_SECRET phải là một chuỗi ký tự hợp lệ' })
  @IsNotEmpty({
    message: 'JWT_SECRET là biến môi trường bắt buộc (không được để trống)',
  })
  @MinLength(16, {
    message:
      'JWT_SECRET phải có độ dài tối thiểu ít nhất 16 ký tự để đảm bảo an toàn',
  })
  JWT_SECRET: string;

  @IsString({ message: 'JWT_REFRESH_SECRET phải là một chuỗi ký tự hợp lệ' })
  @IsOptional()
  @MinLength(16, {
    message:
      'JWT_REFRESH_SECRET phải có độ dài tối thiểu ít nhất 16 ký tự để đảm bảo an toàn',
  })
  JWT_REFRESH_SECRET?: string;

  @IsString({ message: 'JWT_RESET_SECRET phải là một chuỗi ký tự hợp lệ' })
  @IsOptional()
  @MinLength(16, {
    message:
      'JWT_RESET_SECRET phải có độ dài tối thiểu ít nhất 16 ký tự để đảm bảo an toàn',
  })
  JWT_RESET_SECRET?: string;

  @IsString({
    message:
      'JWT_EXPIRES_IN phải là định dạng chuỗi thời gian hợp lệ (ví dụ: 7d, 24h, 3600s)',
  })
  @IsOptional()
  JWT_EXPIRES_IN: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string = '30d';

  @IsString({ message: 'FRONTEND_URL phải là một chuỗi URL hợp lệ' })
  @IsOptional()
  FRONTEND_URL: string = 'http://localhost:5173';

  @IsEnum(CookieSameSite, {
    message: 'COOKIE_SAME_SITE phải là lax, strict hoặc none',
  })
  @IsOptional()
  COOKIE_SAME_SITE?: CookieSameSite = CookieSameSite.LAX;

  @IsBoolean({ message: 'COOKIE_SECURE phải là boolean (true/false)' })
  @IsOptional()
  COOKIE_SECURE?: boolean;

  @IsString()
  @IsOptional()
  ENABLE_SWAGGER?: string;

  @IsString()
  @IsOptional()
  AUTO_SEED?: string = 'false';

  @IsString()
  @IsOptional()
  RESET_DATABASE_ON_SEED?: string = 'false';

  @IsString()
  @IsOptional()
  SEED_SUPER_ADMIN_PASSWORD?: string;

  @IsString()
  @IsOptional()
  SEED_ADMIN_PASSWORD?: string;

  @IsString()
  @IsOptional()
  SEED_STAFF_PASSWORD?: string;

  @IsString()
  @IsOptional()
  SEED_CUSTOMER_PASSWORD?: string;

  // Cloudinary credentials (optional)
  @IsString()
  @IsOptional()
  CLOUDINARY_CLOUD_NAME?: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_KEY?: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_SECRET?: string;

  // Google Gemini AI (optional)
  @IsString()
  @IsOptional()
  GEMINI_API_KEY?: string;

  // Google Sheet WebApp URL (optional)
  @IsString()
  @IsOptional()
  GOOGLE_SHEET_WEBAPP_URL?: string;

  // SMTP Email (optional)
  @IsString()
  @IsOptional()
  EMAIL_HOST?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'EMAIL_PORT phải là một số hợp lệ' })
  @IsOptional()
  EMAIL_PORT?: number = 587;

  @IsString()
  @IsOptional()
  EMAIL_USER?: string;

  @IsString()
  @IsOptional()
  EMAIL_PASS?: string;

  @IsString()
  @IsOptional()
  EMAIL_FROM?: string;

  @IsString()
  @IsOptional()
  ENABLED_PAYMENT_METHODS?: string = 'COD';

  @IsString()
  @IsOptional()
  BANK_NAME?: string;

  @IsString()
  @IsOptional()
  BANK_ACCOUNT_NUMBER?: string;

  @IsString()
  @IsOptional()
  PAYMENT_WEBHOOK_SECRET?: string;

  @IsString()
  @IsOptional()
  VNPAY_PAYMENT_URL?: string;

  @IsString()
  @IsOptional()
  VNPAY_HASH_SECRET?: string;

  @IsString()
  @IsOptional()
  MOMO_PAYMENT_URL?: string;

  @IsString()
  @IsOptional()
  MOMO_SECRET_KEY?: string;
}

/**
 * Validates raw environment configuration against EnvironmentVariables schema.
 * Throws a formatted descriptive Error if validation fails or if insecure secrets
 * are detected in production environment.
 */
export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  // Support aliases: e.g. MONGO_URI -> MONGODB_URI, JWT_EXPIRATION -> JWT_EXPIRES_IN
  const normalizedConfig: Record<string, unknown> = { ...config };
  if (!normalizedConfig.MONGODB_URI && normalizedConfig.MONGO_URI) {
    normalizedConfig.MONGODB_URI = normalizedConfig.MONGO_URI;
  }
  if (!normalizedConfig.JWT_EXPIRES_IN && normalizedConfig.JWT_EXPIRATION) {
    normalizedConfig.JWT_EXPIRES_IN = normalizedConfig.JWT_EXPIRATION;
  }
  const baseSecret =
    typeof normalizedConfig.JWT_SECRET === 'string'
      ? normalizedConfig.JWT_SECRET
      : '';
  if (!normalizedConfig.JWT_REFRESH_SECRET && baseSecret) {
    normalizedConfig.JWT_REFRESH_SECRET = `${baseSecret}_refresh_secret`;
  }
  if (!normalizedConfig.JWT_RESET_SECRET && baseSecret) {
    normalizedConfig.JWT_RESET_SECRET = `${baseSecret}_reset_secret`;
  }
  if (typeof normalizedConfig.COOKIE_SAME_SITE === 'string') {
    normalizedConfig.COOKIE_SAME_SITE =
      normalizedConfig.COOKIE_SAME_SITE.trim().toLowerCase();
  }
  if (typeof normalizedConfig.COOKIE_SECURE === 'string') {
    const rawCookieSecure = normalizedConfig.COOKIE_SECURE.trim().toLowerCase();
    if (rawCookieSecure !== 'true' && rawCookieSecure !== 'false') {
      throw new Error('COOKIE_SECURE must be either true or false');
    }
    normalizedConfig.COOKIE_SECURE = rawCookieSecure === 'true';
  }

  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    normalizedConfig,
    {
      enableImplicitConversion: true,
    },
  );

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: true,
  });

  if (errors.length > 0) {
    const errorDetails = errors
      .map((err) => {
        const constraints = err.constraints
          ? Object.values(err.constraints).join(', ')
          : 'Giá trị không hợp lệ';
        return `  - [${err.property}]: ${constraints} (Giá trị nhận được: "${err.value}")`;
      })
      .join('\n');

    throw new Error(
      `\n========================================================================\n` +
        `❌ LỖI CẤU HÌNH BIẾN MÔI TRƯỜNG (.env):\n` +
        `Ứng dụng không thể khởi động do các biến môi trường không thỏa mãn schema:\n\n` +
        `${errorDetails}\n\n` +
        `👉 Vui lòng kiểm tra file .env hoặc tham khảo .env.example để cấu hình đầy đủ!\n` +
        `========================================================================\n`,
    );
  }

  // Strict Production Security Auditing
  if (validatedConfig.NODE_ENV === Environment.PRODUCTION) {
    const secret = validatedConfig.JWT_SECRET;
    const isWeakSecret = INSECURE_DEFAULT_SECRETS.some(
      (insecure) => secret.toLowerCase() === insecure.toLowerCase(),
    );

    if (isWeakSecret || secret.length < 32) {
      throw new Error(
        `\n========================================================================\n` +
          `🚨 CẢNH BÁO BẢO MẬT NGHIÊM TRỌNG (PRODUCTION ENVIRONMENT):\n` +
          `JWT_SECRET đang sử dụng giá trị mặc định không an toàn hoặc độ dài nhỏ hơn 32 ký tự!\n` +
          `Ở môi trường Production, bắt buộc phải sinh một chuỗi ngẫu nhiên có độ dài >= 32 ký tự.\n` +
          `Gợi ý tạo khóa an toàn trên terminal: openssl rand -base64 32\n` +
          `========================================================================\n`,
      );
    }

    const rawRefreshSecret = config.JWT_REFRESH_SECRET as string | undefined;
    if (!rawRefreshSecret || typeof rawRefreshSecret !== 'string') {
      throw new Error(
        'JWT_REFRESH_SECRET is required in production and cannot be empty',
      );
    }
    const isWeakRefresh = INSECURE_DEFAULT_SECRETS.some(
      (insecure) => rawRefreshSecret.toLowerCase() === insecure.toLowerCase(),
    );
    if (isWeakRefresh || rawRefreshSecret.length < 32) {
      throw new Error(
        'JWT_REFRESH_SECRET must be at least 32 characters and not use insecure defaults in production',
      );
    }

    const rawResetSecret = config.JWT_RESET_SECRET as string | undefined;
    if (!rawResetSecret || typeof rawResetSecret !== 'string') {
      throw new Error(
        'JWT_RESET_SECRET is required in production and cannot be empty',
      );
    }
    const isWeakReset = INSECURE_DEFAULT_SECRETS.some(
      (insecure) => rawResetSecret.toLowerCase() === insecure.toLowerCase(),
    );
    if (isWeakReset || rawResetSecret.length < 32) {
      throw new Error(
        'JWT_RESET_SECRET must be at least 32 characters and not use insecure defaults in production',
      );
    }

    if (
      secret === rawRefreshSecret ||
      secret === rawResetSecret ||
      rawRefreshSecret === rawResetSecret
    ) {
      throw new Error(
        'JWT_SECRET, JWT_REFRESH_SECRET, and JWT_RESET_SECRET must all be distinct keys in production',
      );
    }

    if (validatedConfig.COOKIE_SECURE !== true) {
      throw new Error('COOKIE_SECURE=true is required in production');
    }

    const frontendUrls = validatedConfig.FRONTEND_URL.split(',').map((url) =>
      url.trim(),
    );
    if (
      frontendUrls.some((url) => {
        try {
          return new URL(url).protocol !== 'https:';
        } catch {
          return true;
        }
      })
    ) {
      throw new Error(
        'Every FRONTEND_URL entry must be a valid HTTPS URL in production',
      );
    }

    if (
      validatedConfig.AUTO_SEED?.toLowerCase() === 'true' ||
      validatedConfig.RESET_DATABASE_ON_SEED?.toLowerCase() === 'true'
    ) {
      throw new Error(
        'AUTO_SEED and RESET_DATABASE_ON_SEED must be false in production',
      );
    }
  }

  if (
    validatedConfig.COOKIE_SAME_SITE === CookieSameSite.NONE &&
    validatedConfig.COOKIE_SECURE !== true
  ) {
    throw new Error('COOKIE_SAME_SITE=none requires COOKIE_SECURE=true');
  }

  const enabledPayments = (validatedConfig.ENABLED_PAYMENT_METHODS || 'COD')
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
  const paymentErrors: string[] = [];
  const unsupportedPayments = enabledPayments.filter(
    (method) => !SUPPORTED_PAYMENT_METHODS.has(method),
  );
  if (unsupportedPayments.length) {
    throw new Error(
      `Unsupported ENABLED_PAYMENT_METHODS value(s): ${unsupportedPayments.join(', ')}`,
    );
  }
  if (
    enabledPayments.includes('BANK_TRANSFER') &&
    (!validatedConfig.BANK_NAME || !validatedConfig.BANK_ACCOUNT_NUMBER)
  ) {
    paymentErrors.push('BANK_NAME vÃ  BANK_ACCOUNT_NUMBER');
  }
  if (
    enabledPayments.includes('VNPAY') &&
    (!validatedConfig.VNPAY_PAYMENT_URL || !validatedConfig.VNPAY_HASH_SECRET)
  ) {
    paymentErrors.push('VNPAY_PAYMENT_URL và VNPAY_HASH_SECRET');
  }
  if (
    enabledPayments.includes('MOMO') &&
    (!validatedConfig.MOMO_PAYMENT_URL || !validatedConfig.MOMO_SECRET_KEY)
  ) {
    paymentErrors.push('MOMO_PAYMENT_URL và MOMO_SECRET_KEY');
  }
  if (paymentErrors.length) {
    throw new Error(
      `Thiếu cấu hình cho cổng thanh toán đã bật: ${paymentErrors.join('; ')}`,
    );
  }

  return validatedConfig;
}
