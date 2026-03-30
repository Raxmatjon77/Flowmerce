import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import {
  IDEMPOTENCY_SERVICE,
  IIdempotencyService,
} from './idempotency.service';
import { IDEMPOTENT_KEY } from './idempotent.decorator';

/**
 * Idempotency Guard
 * 
 * Intercepts requests with `Idempotency-Key` header and:
 * 1. Returns cached response if key was processed before
 * 2. Prevents concurrent processing of same key
 * 3. Caches response after successful processing
 */
@Injectable()
export class IdempotencyGuard implements CanActivate {
  private readonly logger = new Logger(IdempotencyGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(IDEMPOTENCY_SERVICE)
    private readonly idempotencyService: IIdempotencyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if endpoint is marked as idempotent
    const isIdempotent = this.reflector.get<boolean>(
      IDEMPOTENT_KEY,
      context.getHandler(),
    );

    if (!isIdempotent) {
      return true; // Not an idempotent endpoint, proceed normally
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const idempotencyKey = request.headers['idempotency-key'] as string;

    // If no idempotency key provided, proceed normally
    if (!idempotencyKey) {
      return true;
    }

    // Validate key format (should be UUID-like)
    if (!this.isValidKey(idempotencyKey)) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'InvalidIdempotencyKey',
          message: 'Idempotency-Key must be a valid UUID',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if we already have a response for this key
    const cached = await this.idempotencyService.get(idempotencyKey);
    if (cached) {
      this.logger.log(`Returning cached response for idempotency key: ${idempotencyKey}`);
      
      response.status(cached.statusCode);
      response.setHeader('X-Idempotency-Replayed', 'true');
      response.json(cached.response);
      return false; // Don't proceed to handler
    }

    // Check if another request is currently processing this key
    const isProcessing = await this.idempotencyService.isProcessing(idempotencyKey);
    if (isProcessing) {
      throw new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          error: 'IdempotencyKeyInUse',
          message: 'A request with this idempotency key is currently being processed',
        },
        HttpStatus.CONFLICT,
      );
    }

    // Start processing
    const started = await this.idempotencyService.startProcessing(idempotencyKey);
    if (!started) {
      throw new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          error: 'IdempotencyKeyInUse',
          message: 'A request with this idempotency key is currently being processed',
        },
        HttpStatus.CONFLICT,
      );
    }

    // Store the key in request for later use by interceptor
    (request as any).idempotencyKey = idempotencyKey;

    return true;
  }

  private isValidKey(key: string): boolean {
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(key);
  }
}
