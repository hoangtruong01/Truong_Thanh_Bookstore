import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { AuthService } from './auth.service';

/**
 * SECURITY regression: the OTP hashing pepper must come from config and the
 * service must fail closed in production when it is missing (no hardcoded
 * fallback secret in source control).
 */
describe('AuthService OTP pepper (config-only, fail closed in production)', () => {
  const LEGACY_HARDCODED_PEPPER = 'truong-thanh-otp-pepper-secret-2026';
  const originalNodeEnv = process.env.NODE_ENV;

  const build = (config: Record<string, string | undefined>) => {
    const configService = {
      get: jest.fn((key: string) => config[key]),
      getOrThrow: jest.fn((key: string) => {
        if (!config[key]) throw new Error(`Missing ${key}`);
        return config[key];
      }),
    } as unknown as ConfigService;
    const service = new AuthService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      configService,
    );
    const hashOtp = (otp: string): string =>
      (service as unknown as { hashOtp(otp: string): string }).hashOtp(otp);
    return { service, hashOtp };
  };

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  });

  it('throws at init in production when neither OTP_PEPPER nor JWT_RESET_SECRET is set', () => {
    const { service, hashOtp } = build({ NODE_ENV: 'production' });
    expect(() => service.onModuleInit()).toThrow(/OTP_PEPPER/);
    // and never silently hashes with a default
    expect(() => hashOtp('123456')).toThrow();
  });

  it('falls back to process.env.NODE_ENV when config does not expose NODE_ENV', () => {
    process.env.NODE_ENV = 'production';
    const { service } = build({});
    expect(() => service.onModuleInit()).toThrow(/OTP_PEPPER/);
  });

  it('starts in production when OTP_PEPPER is configured and uses it for hashing', () => {
    const { service, hashOtp } = build({
      NODE_ENV: 'production',
      OTP_PEPPER: 'configured-otp-pepper-value-0123456789',
      JWT_RESET_SECRET: 'reset-secret-value-0123456789abcdef',
    });
    expect(() => service.onModuleInit()).not.toThrow();
    expect(hashOtp('123456')).toBe(
      createHmac('sha256', 'configured-otp-pepper-value-0123456789')
        .update('123456')
        .digest('hex'),
    );
  });

  it('uses JWT_RESET_SECRET when OTP_PEPPER is not set', () => {
    const { service, hashOtp } = build({
      NODE_ENV: 'production',
      JWT_RESET_SECRET: 'reset-secret-value-0123456789abcdef',
    });
    expect(() => service.onModuleInit()).not.toThrow();
    expect(hashOtp('654321')).toBe(
      createHmac('sha256', 'reset-secret-value-0123456789abcdef')
        .update('654321')
        .digest('hex'),
    );
  });

  it('outside production without secrets uses an ephemeral pepper, never the legacy hardcoded one', () => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const { service, hashOtp } = build({ NODE_ENV: 'development' });
    expect(() => service.onModuleInit()).not.toThrow();

    const first = hashOtp('123456');
    expect(first).not.toBe(
      createHmac('sha256', LEGACY_HARDCODED_PEPPER)
        .update('123456')
        .digest('hex'),
    );
    // stable within the process so issued OTPs can still be verified
    expect(hashOtp('123456')).toBe(first);
  });
});
