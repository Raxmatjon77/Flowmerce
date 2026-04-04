import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kysely } from 'kysely';
import { OutboxPublisherService } from '@shared/infrastructure/kafka';
import {
  NotificationDatabase,
  KYSELY_NOTIFICATION_DB,
} from '../database/tables/notification.table';

@Injectable()
export class NotificationOutboxPollerService
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly outboxPublisher: OutboxPublisherService,
    @Inject(KYSELY_NOTIFICATION_DB)
    private readonly db: Kysely<NotificationDatabase>,
  ) {}

  onModuleInit(): void {
    if (process.env.OUTBOX_POLLING_ENABLED === 'false') return;
    const intervalMs = parseInt(process.env.OUTBOX_POLL_INTERVAL_MS || '1000', 10);
    this.outboxPublisher.startPolling('notification', this.db, intervalMs);
  }

  onModuleDestroy(): void {
    this.outboxPublisher.stopPolling('notification');
  }
}
