import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!data) return user;
    if (data === 'id' || data === '_id' || data === 'userId') {
      return (
        user?.id ??
        (user?._id
          ? typeof user._id.toString === 'function'
            ? user._id.toString()
            : String(user._id)
          : undefined)
      );
    }
    return user?.[data];
  },
);

export const GetUser = CurrentUser;
