import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // 不抛错；登录与否都让请求通过，登录态从 req.user 取
  handleRequest<TUser>(_err: unknown, user: TUser): TUser {
    return user as TUser;
  }
}
