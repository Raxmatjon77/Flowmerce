import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENT_KEY = 'idempotent';

/**
 * @Idempotent() Decorator
 * 
 * Mark an endpoint as idempotent. When used:
 * - Client can send `Idempotency-Key: <uuid>` header
 * - Duplicate requests with same key return cached response
 * - Concurrent requests with same key are rejected with 409
 * 
 * Usage:
 * ```typescript
 * @Post()
 * @Idempotent()
 * async createOrder(@Body() dto: CreateOrderDto) {
 *   // ...
 * }
 * ```
 * 
 * Client usage:
 * ```bash
 * curl -X POST /api/v1/orders \
 *   -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
 *   -H "Content-Type: application/json" \
 *   -d '{"customerId": "..."}'
 * ```
 */
export const Idempotent = () => SetMetadata(IDEMPOTENT_KEY, true);
