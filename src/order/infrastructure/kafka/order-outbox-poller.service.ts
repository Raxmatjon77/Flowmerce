import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kysely } from 'kysely';
import { OutboxPublisherService } from '@shared/infrastructure/kafka';
import { OrderDatabase } from '../database/tables/order.table';
import { KYSELY_ORDER_DB } from '../database/repositories/order.repository';

@Injectable()
export class OrderOutboxPollerService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly outboxPublisher: OutboxPublisherService,
    @Inject(KYSELY_ORDER_DB)
    private readonly db: Kysely<OrderDatabase>,
  ) {}

  onModuleInit(): void {
    if (process.env.OUTBOX_POLLING_ENABLED === 'false') return;
    const intervalMs = parseInt(process.env.OUTBOX_POLL_INTERVAL_MS || '1000', 10);
    this.outboxPublisher.startPolling('order', this.db, intervalMs);
  }

  onModuleDestroy(): void {
    this.outboxPublisher.stopPolling('order');
  }
}
