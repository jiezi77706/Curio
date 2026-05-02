import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const req = ctx.switchToHttp().getRequest();
    return next.handle().pipe(
      tap((data) => {
        const ms = Date.now() - start;
        this.logger.log(`${req.method} ${req.url} ${ms}ms`);
        return data;
      }),
    );
  }
}
