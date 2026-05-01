import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely } from 'kysely';
import { OutboxPublisherService } from '@shared/infrastructure/kafka';
import { ShippingDatabase, KYSELY_SHIPPING_DB } from '../database/tables/shipping.table';

@Injectable()
export class ShippingOutboxPollerService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly outboxPublisher: OutboxPublisherService,
    @Inject(KYSELY_SHIPPING_DB)
    private readonly db: Kysely<ShippingDatabase>,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    if (!this.config.get<boolean>('outbox.pollingEnabled')) return;
    this.outboxPublisher.startPolling('shipping', this.db, this.config.get<number>('outbox.pollIntervalMs')!);
  }

  onModuleDestroy(): void {
    this.outboxPublisher.stopPolling('shipping');
  }
}
