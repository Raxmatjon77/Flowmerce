import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kysely } from 'kysely';
import { OutboxPublisherService } from '@shared/infrastructure/kafka';
import {
  ShippingDatabase,
  KYSELY_SHIPPING_DB,
} from '../database/tables/shipping.table';

@Injectable()
export class ShippingOutboxPollerService
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly outboxPublisher: OutboxPublisherService,
    @Inject(KYSELY_SHIPPING_DB)
    private readonly db: Kysely<ShippingDatabase>,
  ) {}

  onModuleInit(): void {
    if (process.env.OUTBOX_POLLING_ENABLED === 'false') return;
    const intervalMs = parseInt(process.env.OUTBOX_POLL_INTERVAL_MS || '1000', 10);
    this.outboxPublisher.startPolling('shipping', this.db, intervalMs);
  }

  onModuleDestroy(): void {
    this.outboxPublisher.stopPolling('shipping');
  }
}
