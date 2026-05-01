import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const IDEMPOTENCY_SERVICE = Symbol('IDEMPOTENCY_SERVICE');

export interface IdempotencyRecord {
  key: string;
  response: unknown;
  statusCode: number;
  createdAt: Date;
  expiresAt: Date;
}

export interface IIdempotencyService {
  get(key: string): Promise<IdempotencyRecord | null>;
  set(key: string, response: unknown, statusCode: number): Promise<void>;
  isProcessing(key: string): Promise<boolean>;
  startProcessing(key: string): Promise<boolean>;
  finishProcessing(key: string): Promise<void>;
}

/**
 * In-Memory Idempotency Service
 * 
 * For production, replace with Redis-based implementation:
 * - Better for distributed systems (multiple app instances)
 * - Automatic TTL expiration
 * - Atomic operations with SETNX
 * 
 * Current implementation is suitable for:
 * - Single instance deployments
 * - Development/testing
 */
@Injectable()
export class IdempotencyService implements IIdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly store = new Map<string, IdempotencyRecord>();
  private readonly processing = new Set<string>();
  private readonly ttlMs: number;

  constructor(config: ConfigService) {
    this.ttlMs = config.get<number>('idempotency.ttlMs')!;
    setInterval(() => this.cleanup(), 3600000);
  }

  async get(key: string): Promise<IdempotencyRecord | null> {
    const record = this.store.get(key);
    
    if (!record) {
      return null;
    }

    // Check if expired
    if (record.expiresAt < new Date()) {
      this.store.delete(key);
      return null;
    }

    this.logger.debug(`Idempotency cache hit: ${key}`);
    return record;
  }

  async set(key: string, response: unknown, statusCode: number): Promise<void> {
    const now = new Date();
    const record: IdempotencyRecord = {
      key,
      response,
      statusCode,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.ttlMs),
    };

    this.store.set(key, record);
    this.logger.debug(`Idempotency key stored: ${key}`);
  }

  async isProcessing(key: string): Promise<boolean> {
    return this.processing.has(key);
  }

  async startProcessing(key: string): Promise<boolean> {
    if (this.processing.has(key)) {
      return false; // Another request is already processing this key
    }
    
    this.processing.add(key);
    this.logger.debug(`Started processing idempotency key: ${key}`);
    return true;
  }

  async finishProcessing(key: string): Promise<void> {
    this.processing.delete(key);
    this.logger.debug(`Finished processing idempotency key: ${key}`);
  }

  private cleanup(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [key, record] of this.store.entries()) {
      if (record.expiresAt < now) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} expired idempotency keys`);
    }
  }
}
