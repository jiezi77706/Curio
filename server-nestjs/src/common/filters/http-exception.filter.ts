import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload =
      exception instanceof HttpException
        ? (exception.getResponse() as Record<string, unknown>)
        : { message: 'Internal server error' };

    const message =
      typeof payload === 'string'
        ? payload
        : (payload['message'] as string) ?? 'Error';

    if (status >= 500) {
      this.logger.error(
        `[${req.method}] ${req.url} -> ${status}`,
        (exception as Error)?.stack,
      );
    }

    res.status(status).json({
      code: status,
      message,
      data: null,
      trace_id: (req.headers['x-trace-id'] as string) ?? undefined,
    });
  }
}
