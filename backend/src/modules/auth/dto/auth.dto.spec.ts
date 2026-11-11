import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './auth.dto';

async function errorsOf<T extends object>(
  cls: new () => T,
  plain: Record<string, unknown>,
): Promise<string[]> {
  const errors = await validate(plainToInstance(cls, plain));
  return errors.map((e) => e.property);
}

describe('Auth DTO hardening (SEC-028)', () => {
  const longPassword = 'Aa1' + 'x'.repeat(200);

  describe('passwords', () => {
    it('rejects over-long password on register / login / change / reset', async () => {
      expect(
        await errorsOf(RegisterDto, {
          fullName: 'A',
          email: 'a@b.vn',
          password: longPassword,
        }),
      ).toContain('password');
      expect(
        await errorsOf(LoginDto, { email: 'a@b.vn', password: longPassword }),
      ).toContain('password');
      expect(
        await errorsOf(ChangePasswordDto, {
          currentPassword: longPassword,
          newPassword: 'Password123',
        }),
      ).toContain('currentPassword');
      expect(
        await errorsOf(ChangePasswordDto, {
          currentPassword: 'Password123',
          newPassword: longPassword,
        }),
      ).toContain('newPassword');
      expect(
        await errorsOf(ResetPasswordDto, {
          email: 'a@b.vn',
          newPassword: longPassword,
        }),
      ).toContain('newPassword');
    });

    it('rejects non-string passwords (e.g. objects / arrays)', async () => {
      expect(
        await errorsOf(LoginDto, { email: 'a@b.vn', password: { $ne: '' } }),
      ).toContain('password');
      expect(
        await errorsOf(LoginDto, { email: 'a@b.vn', password: ['x'] }),
      ).toContain('password');
    });

    it('accepts a password of exactly 128 chars', async () => {
      const ok = 'Aa1' + 'x'.repeat(125);
      expect(ok).toHaveLength(128);
      expect(
        await errorsOf(LoginDto, { email: 'a@b.vn', password: ok }),
      ).toEqual([]);
    });
  });

  describe('fullName', () => {
    it('rejects fullName longer than 100 chars (register + profile)', async () => {
      const name = 'N'.repeat(101);
      expect(
        await errorsOf(RegisterDto, {
          fullName: name,
          email: 'a@b.vn',
          password: 'Password123',
        }),
      ).toContain('fullName');
      expect(await errorsOf(UpdateProfileDto, { fullName: name })).toContain(
        'fullName',
      );
    });

    it('accepts fullName of 100 chars', async () => {
      expect(
        await errorsOf(UpdateProfileDto, { fullName: 'N'.repeat(100) }),
      ).toEqual([]);
    });
  });

  describe('avatar', () => {
    it('accepts http/https URLs (e.g. Cloudinary)', async () => {
      expect(
        await errorsOf(UpdateProfileDto, {
          avatar: 'https://res.cloudinary.com/demo/image/upload/a.jpg',
        }),
      ).toEqual([]);
      expect(
        await errorsOf(UpdateProfileDto, {
          avatar: 'http://example.com/a.png',
        }),
      ).toEqual([]);
    });

    it('accepts compressed image data URLs sent by the web profile modal', async () => {
      expect(
        await errorsOf(UpdateProfileDto, {
          avatar: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD=',
        }),
      ).toEqual([]);
    });

    it('rejects dangerous or non-http(s) schemes', async () => {
      for (const avatar of [
        'javascript:alert(1)',
        'ftp://example.com/a.png',
        'file:///etc/passwd',
        'data:text/html;base64,PHNjcmlwdD4=',
        'not a url',
      ]) {
        expect(await errorsOf(UpdateProfileDto, { avatar })).toContain(
          'avatar',
        );
      }
    });

    it('rejects URLs longer than 2048 chars', async () => {
      expect(
        await errorsOf(UpdateProfileDto, {
          avatar: 'https://example.com/' + 'a'.repeat(2100),
        }),
      ).toContain('avatar');
    });

    it('rejects non-string avatar', async () => {
      expect(await errorsOf(UpdateProfileDto, { avatar: 123 })).toContain(
        'avatar',
      );
    });
  });
});
