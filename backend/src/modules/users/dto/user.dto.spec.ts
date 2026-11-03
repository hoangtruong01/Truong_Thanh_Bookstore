import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateStaffUserDto,
  UpdateUserStatusDto,
  UserQueryDto,
} from './user.dto';

/**
 * FEAT-001: main.ts bật ValidationPipe({ transform: true,
 * transformOptions: { enableImplicitConversion: true } }). Với kiểu boolean,
 * class-transformer chuyển ngầm bằng Boolean(value) TRƯỚC khi chạy @Transform,
 * nên chuỗi "false" từng bị biến thành true. Các test dưới đây mô phỏng đúng
 * cấu hình đó để khóa hành vi chuyển đổi.
 */
const PIPE_OPTIONS = { enableImplicitConversion: true };

async function transformAndValidate<T extends object>(
  cls: new () => T,
  plain: Record<string, unknown>,
) {
  const instance = plainToInstance(cls, plain, PIPE_OPTIONS);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { instance, errors };
}

describe('Users DTO validation (FEAT-001)', () => {
  describe('UpdateUserStatusDto boolean coercion', () => {
    it.each([
      [true, true],
      [false, false],
      ['true', true],
      ['false', false],
    ])('maps status %p to %p', async (input, expected) => {
      const { instance, errors } = await transformAndValidate(
        UpdateUserStatusDto,
        { status: input },
      );
      expect(errors).toHaveLength(0);
      expect(instance.status).toBe(expected);
    });

    it('does NOT unlock an account when status is the string "false"', async () => {
      const { instance } = await transformAndValidate(UpdateUserStatusDto, {
        status: 'false',
      });
      expect(instance.status).not.toBe(true);
    });

    it.each(['abc', 'yes', '', 'False ', 2, {}])(
      'rejects non-boolean status %p',
      async (input) => {
        const { errors } = await transformAndValidate(UpdateUserStatusDto, {
          status: input,
        });
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('status');
      },
    );

    it('rejects a missing status', async () => {
      const { errors } = await transformAndValidate(UpdateUserStatusDto, {});
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
    });
  });

  describe('UserQueryDto ?status= coercion', () => {
    it.each([
      ['true', true],
      ['false', false],
      ['1', true],
      ['0', false],
    ])('maps query status %p to %p', async (input, expected) => {
      const { instance, errors } = await transformAndValidate(UserQueryDto, {
        status: input,
      });
      expect(errors).toHaveLength(0);
      expect(instance.status).toBe(expected);
    });

    it('filters locked accounts when ?status=false (not active ones)', async () => {
      const { instance } = await transformAndValidate(UserQueryDto, {
        status: 'false',
      });
      expect(instance.status).toBe(false);
    });

    it('leaves status undefined when the filter is omitted', async () => {
      const { instance, errors } = await transformAndValidate(UserQueryDto, {
        page: '2',
      });
      expect(errors).toHaveLength(0);
      expect(instance.status).toBeUndefined();
      expect(instance.page).toBe(2);
    });

    it.each(['abc', 'yes', '2'])(
      'rejects an invalid status filter %p instead of ignoring it',
      async (input) => {
        const { errors } = await transformAndValidate(UserQueryDto, {
          status: input,
        });
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('status');
      },
    );
  });

  describe('CreateStaffUserDto password length', () => {
    const base = {
      fullName: 'Nhân Viên Mới',
      email: 'newstaff@truongthanh.vn',
    };

    it('accepts a 72-character password (bcrypt limit)', async () => {
      const password = 'Aa1' + 'x'.repeat(69);
      expect(password).toHaveLength(72);
      const { errors } = await transformAndValidate(CreateStaffUserDto, {
        ...base,
        password,
      });
      expect(errors).toHaveLength(0);
    });

    it('rejects a password longer than 72 characters with a Vietnamese message', async () => {
      const password = 'Aa1' + 'x'.repeat(70);
      expect(password).toHaveLength(73);
      const { errors } = await transformAndValidate(CreateStaffUserDto, {
        ...base,
        password,
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('maxLength');
      expect(errors[0].constraints?.maxLength).toContain('72');
    });
  });
});
