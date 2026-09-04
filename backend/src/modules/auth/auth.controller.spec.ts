import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController cookie configuration', () => {
  const createController = (values: Record<string, unknown>) => {
    const configService = {
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;
    return new AuthController({} as AuthService, configService);
  };

  const optionsOf = (controller: AuthController) =>
    (
      controller as unknown as { getCookieOptions: () => unknown }
    ).getCookieOptions();

  it('reads the normalized nested cookie configuration', () => {
    const controller = createController({
      nodeEnv: 'development',
      'cookie.sameSite': 'strict',
      'cookie.secure': false,
    });

    expect(optionsOf(controller)).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
    });
  });

  it('always enables Secure for SameSite=None', () => {
    const controller = createController({
      nodeEnv: 'development',
      'cookie.sameSite': 'none',
      'cookie.secure': false,
    });

    expect(optionsOf(controller)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
  });

  it('keeps production cookies secure', () => {
    const controller = createController({
      nodeEnv: 'production',
      'cookie.sameSite': 'lax',
      'cookie.secure': true,
    });

    expect(optionsOf(controller)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });
  });
});
