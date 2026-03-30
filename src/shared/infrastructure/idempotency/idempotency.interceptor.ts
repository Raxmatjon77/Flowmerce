import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { Request, Response } from 'express';
import {
  IDEMPOTENCY_SERVICE,
  IIdempotencyService,
} from './idempotency.service';

/**
 * Idempotency Interceptor
 * 
 * Caches successful responses and cleans up processing state.
 * Works in conjunction with IdempotencyGuard.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(
    @Inject(IDEMPOTENCY_SERVICE)
    private readonly idempotencyService: IIdempotencyService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const idempotencyKey = (request as any).idempotencyKey as string | undefined;

    // If no idempotency key, proceed normally
    if (!idempotencyKey) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (data) => {
        // Cache the successful response
        const statusCode = response.statusCode;
        await this.idempotencyService.set(idempotencyKey, data, statusCode);
        await this.idempotencyService.finishProcessing(idempotencyKey);
        
        // Add header to indicate this response can be replayed
        response.setHeader('X-Idempotency-Key', idempotencyKey);
        
        this.logger.debug(`Cached response for idempotency key: ${idempotencyKey}`);
      }),
      catchError(async (error) => {
        // Clean up processing state on error
        await this.idempotencyService.finishProcessing(idempotencyKey);
        this.logger.debug(`Cleared processing state for failed request: ${idempotencyKey}`);
        throw error;
      }),
    );
  }
}
