import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { ExecutionContext } from '@nestjs/common';
import { Types } from 'mongoose';
import { CurrentUser } from './current-user.decorator';

function getParamDecoratorFactory(
  decorator: (...args: unknown[]) => ParameterDecorator,
  param?: string,
) {
  class Test {
    public test(@decorator(param) _value: unknown) {}
  }
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
  return args[Object.keys(args)[0]].factory;
}

describe('CurrentUser Decorator (AUDIT-P1-01)', () => {
  const mockObjectId = new Types.ObjectId();
  const mockUser = {
    _id: mockObjectId,
    email: 'staff@truongthanh.vn',
    role: 'STAFF',
  };

  const createMockContext = (user: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('should resolve "id" from _id when user only has _id', () => {
    const factory = getParamDecoratorFactory(CurrentUser, 'id');
    const result = factory('id', createMockContext(mockUser));
    expect(result).toBe(mockObjectId.toString());
  });

  it('should resolve "_id" from _id', () => {
    const factory = getParamDecoratorFactory(CurrentUser, '_id');
    const result = factory('_id', createMockContext(mockUser));
    expect(result).toBe(mockObjectId.toString());
  });

  it('should resolve "userId" from _id', () => {
    const factory = getParamDecoratorFactory(CurrentUser, 'userId');
    const result = factory('userId', createMockContext(mockUser));
    expect(result).toBe(mockObjectId.toString());
  });

  it('should prefer explicit user.id if provided', () => {
    const factory = getParamDecoratorFactory(CurrentUser, 'id');
    const explicitUser = { ...mockUser, id: 'custom-user-id' };
    const result = factory('id', createMockContext(explicitUser));
    expect(result).toBe('custom-user-id');
  });

  it('should return whole user object when no key is specified', () => {
    const factory = getParamDecoratorFactory(CurrentUser);
    const result = factory(undefined, createMockContext(mockUser));
    expect(result).toEqual(mockUser);
  });
});
