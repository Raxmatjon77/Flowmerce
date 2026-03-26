import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    this.logger.log(`Incoming request: ${method} ${url}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsed = Date.now() - startTime;
          this.logger.log(
            `Response: ${method} ${url} - ${elapsed}ms`,
          );
        },
        error: (error: Error) => {
          const elapsed = Date.now() - startTime;
          this.logger.error(
            `Response: ${method} ${url} - ${elapsed}ms - ERROR: ${error.message}`,
          );
        },
      }),
    );
  }
}
