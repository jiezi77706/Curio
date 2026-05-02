import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUser {
  sub: string;
  email?: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtUser | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
