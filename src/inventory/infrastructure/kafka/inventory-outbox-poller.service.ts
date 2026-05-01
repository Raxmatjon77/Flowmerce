import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely } from 'kysely';
import { OutboxPublisherService } from '@shared/infrastructure/kafka';
import { InventoryDatabase, KYSELY_INVENTORY_DB } from '../database/tables/inventory.table';

@Injectable()
export class InventoryOutboxPollerService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly outboxPublisher: OutboxPublisherService,
    @Inject(KYSELY_INVENTORY_DB)
    private readonly db: Kysely<InventoryDatabase>,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    if (!this.config.get<boolean>('outbox.pollingEnabled')) return;
    this.outboxPublisher.startPolling('inventory', this.db, this.config.get<number>('outbox.pollIntervalMs')!);
  }

  onModuleDestroy(): void {
    this.outboxPublisher.stopPolling('inventory');
  }
}
