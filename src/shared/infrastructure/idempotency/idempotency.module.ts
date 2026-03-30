import { Module, Global } from '@nestjs/common';
import { IdempotencyService, IDEMPOTENCY_SERVICE } from './idempotency.service';
import { IdempotencyGuard } from './idempotency.guard';

/**
 * Idempotency Module
 * 
 * Provides idempotency key handling to prevent duplicate request processing.
 * 
 * Usage:
 * 1. Client sends `Idempotency-Key: <uuid>` header
 * 2. If key was seen before, return cached response
 * 3. If key is new, process request and cache response
 * 
 * Keys expire after 24 hours by default.
 */
@Global()
@Module({
  providers: [
    {
      provide: IDEMPOTENCY_SERVICE,
      useClass: IdempotencyService,
    },
    IdempotencyGuard,
  ],
  exports: [IDEMPOTENCY_SERVICE, IdempotencyGuard],
})
export class IdempotencyModule {}
