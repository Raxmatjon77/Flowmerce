import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kysely } from 'kysely';
import { OutboxPublisherService } from '@shared/infrastructure/kafka';
import {
  InventoryDatabase,
  KYSELY_INVENTORY_DB,
} from '../database/tables/inventory.table';

@Injectable()
export class InventoryOutboxPollerService
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly outboxPublisher: OutboxPublisherService,
    @Inject(KYSELY_INVENTORY_DB)
    private readonly db: Kysely<InventoryDatabase>,
  ) {}

  onModuleInit(): void {
    if (process.env.OUTBOX_POLLING_ENABLED === 'false') return;
    const intervalMs = parseInt(process.env.OUTBOX_POLL_INTERVAL_MS || '1000', 10);
    this.outboxPublisher.startPolling('inventory', this.db, intervalMs);
  }

  onModuleDestroy(): void {
    this.outboxPublisher.stopPolling('inventory');
  }
}
