import { validateEnv, Environment, CookieSameSite } from './env.validation';

describe('Environment Configuration Validation (env.validation.ts)', () => {
  const validBaseConfig = {
    NODE_ENV: 'development',
    PORT: '3000',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/truong-thanh-stationery',
    JWT_SECRET: 'TruongThanhSuperSecretKey2026!',
    JWT_EXPIRES_IN: '7d',
    FRONTEND_URL: 'http://localhost:5173',
  };

  describe('Valid Configuration', () => {
    it('should validate and transform a completely valid configuration', () => {
      const result = validateEnv(validBaseConfig);
      expect(result).toBeDefined();
      expect(result.NODE_ENV).toBe(Environment.DEVELOPMENT);
      expect(result.PORT).toBe(3000);
      expect(typeof result.PORT).toBe('number');
      expect(result.MONGODB_URI).toBe('mongodb://127.0.0.1:27017/truong-thanh-stationery');
      expect(result.JWT_SECRET).toBe('TruongThanhSuperSecretKey2026!');
      expect(result.JWT_EXPIRES_IN).toBe('7d');
      expect(result.FRONTEND_URL).toBe('http://localhost:5173');
    });

    it('should support MONGO_URI and JWT_EXPIRATION aliases', () => {
      const configWithAliases = {
        PORT: 8080,
        MONGO_URI: 'mongodb://127.0.0.1:27017/truong-thanh-alias',
        JWT_SECRET: 'TruongThanhSuperSecretKey2026!',
        JWT_EXPIRATION: '14d',
      };
      const result = validateEnv(configWithAliases);
      expect(result.MONGODB_URI).toBe('mongodb://127.0.0.1:27017/truong-thanh-alias');
      expect(result.JWT_EXPIRES_IN).toBe('14d');
      expect(result.PORT).toBe(8080);
    });

    it('should apply default values for optional properties', () => {
      const minimalConfig = {
        MONGODB_URI: 'mongodb://127.0.0.1:27017/truong-thanh-minimal',
        JWT_SECRET: 'TruongThanhSuperSecretKey2026!',
      };
      const result = validateEnv(minimalConfig);
      expect(result.NODE_ENV).toBe(Environment.DEVELOPMENT);
      expect(result.PORT).toBe(3000);
      expect(result.JWT_EXPIRES_IN).toBe('15m');
      expect(result.FRONTEND_URL).toBe('http://localhost:5173');
    });

    it('should parse optional fields properly (Cloudinary, Email, Gemini)', () => {
      const fullConfig = {
        ...validBaseConfig,
        COOKIE_SAME_SITE: 'strict',
        COOKIE_SECURE: 'true',
        CLOUDINARY_CLOUD_NAME: 'cloud_test',
        CLOUDINARY_API_KEY: 'key_123',
        CLOUDINARY_API_SECRET: 'secret_abc',
        GEMINI_API_KEY: 'gemini_test_key',
        GOOGLE_SHEET_WEBAPP_URL: 'https://script.google.com/test',
        EMAIL_HOST: 'smtp.gmail.com',
        EMAIL_PORT: '465',
        EMAIL_USER: 'test@truongthanh.vn',
        EMAIL_PASS: 'email_pass_123',
        EMAIL_FROM: 'Trường Thành <info@truongthanh.vn>',
      };
      const result = validateEnv(fullConfig);
      expect(result.COOKIE_SAME_SITE).toBe(CookieSameSite.STRICT);
      expect(result.COOKIE_SECURE).toBe(true);
      expect(result.CLOUDINARY_CLOUD_NAME).toBe('cloud_test');
      expect(result.GEMINI_API_KEY).toBe('gemini_test_key');
      expect(result.EMAIL_PORT).toBe(465);
    });
  });

  describe('Missing or Invalid Required Fields', () => {
    it('should throw error when MONGODB_URI is missing', () => {
      const config = { ...validBaseConfig, MONGODB_URI: undefined };
      expect(() => validateEnv(config)).toThrow(/MONGODB_URI/);
    });

    it('should throw error when JWT_SECRET is missing', () => {
      const config = { ...validBaseConfig, JWT_SECRET: undefined };
      expect(() => validateEnv(config)).toThrow(/JWT_SECRET/);
    });

    it('should throw error when JWT_SECRET is shorter than 16 characters', () => {
      const config = { ...validBaseConfig, JWT_SECRET: 'short_secret' };
      expect(() => validateEnv(config)).toThrow(/JWT_SECRET phải có độ dài tối thiểu ít nhất 16 ký tự/);
    });

    it('should throw error when PORT is not a valid number', () => {
      const config = { ...validBaseConfig, PORT: 'invalid_port' };
      expect(() => validateEnv(config)).toThrow(/PORT phải là một số hợp lệ/);
    });

    it('should throw error when PORT is out of valid range (< 1000 or > 65535)', () => {
      expect(() => validateEnv({ ...validBaseConfig, PORT: 80 })).toThrow(/PORT tối thiểu phải là 1000/);
      expect(() => validateEnv({ ...validBaseConfig, PORT: 70000 })).toThrow(/PORT tối đa là 65535/);
    });

    it('should throw error when NODE_ENV is not in enum', () => {
      const config = { ...validBaseConfig, NODE_ENV: 'invalid_env' };
      expect(() => validateEnv(config)).toThrow(/NODE_ENV phải là một trong các giá trị/);
    });
  });

  describe('Strict Production Security Checks', () => {
    it('should throw security error in production if JWT_SECRET is a known weak default', () => {
      const prodConfigWithWeakSecret = {
        ...validBaseConfig,
        NODE_ENV: 'production',
        JWT_SECRET: 'TruongThanhDevDefaultSecretKey2026!',
      };
      expect(() => validateEnv(prodConfigWithWeakSecret)).toThrow(/🚨 CẢNH BÁO BẢO MẬT NGHIÊM TRỌNG/);
    });

    it('should throw security error in production if JWT_SECRET is shorter than 32 characters', () => {
      const prodConfigWithShortSecret = {
        ...validBaseConfig,
        NODE_ENV: 'production',
        JWT_SECRET: 'ValidShortSecret20Chars!',
      };
      expect(() => validateEnv(prodConfigWithShortSecret)).toThrow(/độ dài nhỏ hơn 32 ký tự/);
    });

    it('should pass in production with a strong random secret >= 32 characters', () => {
      const prodConfigWithStrongSecret = {
        ...validBaseConfig,
        NODE_ENV: 'production',
        JWT_SECRET: 'c8f490192e4ab349f872138902194aef12849012839401283940128340128340',
      };
      const result = validateEnv(prodConfigWithStrongSecret);
      expect(result.NODE_ENV).toBe(Environment.PRODUCTION);
      expect(result.JWT_SECRET).toBe('c8f490192e4ab349f872138902194aef12849012839401283940128340128340');
    });
  });
});
