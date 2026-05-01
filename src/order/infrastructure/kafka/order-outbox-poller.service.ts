import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    if (!this.config.get<boolean>('outbox.pollingEnabled')) return;
    this.outboxPublisher.startPolling('order', this.db, this.config.get<number>('outbox.pollIntervalMs')!);
  }

  onModuleDestroy(): void {
    this.outboxPublisher.stopPolling('order');
  }
}
