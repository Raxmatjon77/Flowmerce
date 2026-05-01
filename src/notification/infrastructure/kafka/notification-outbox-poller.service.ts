import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely } from 'kysely';
import { OutboxPublisherService } from '@shared/infrastructure/kafka';
import { NotificationDatabase, KYSELY_NOTIFICATION_DB } from '../database/tables/notification.table';

@Injectable()
export class NotificationOutboxPollerService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly outboxPublisher: OutboxPublisherService,
    @Inject(KYSELY_NOTIFICATION_DB)
    private readonly db: Kysely<NotificationDatabase>,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    if (!this.config.get<boolean>('outbox.pollingEnabled')) return;
    this.outboxPublisher.startPolling('notification', this.db, this.config.get<number>('outbox.pollIntervalMs')!);
  }

  onModuleDestroy(): void {
    this.outboxPublisher.stopPolling('notification');
  }
}
