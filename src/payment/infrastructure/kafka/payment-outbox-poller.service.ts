import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely } from 'kysely';
import { OutboxPublisherService } from '@shared/infrastructure/kafka';
import { PaymentDatabase } from '../database/tables/payment.table';
import { KYSELY_PAYMENT_DB } from '../database/repositories/payment.repository';

@Injectable()
export class PaymentOutboxPollerService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly outboxPublisher: OutboxPublisherService,
    @Inject(KYSELY_PAYMENT_DB)
    private readonly db: Kysely<PaymentDatabase>,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    if (!this.config.get<boolean>('outbox.pollingEnabled')) return;
    this.outboxPublisher.startPolling('payment', this.db, this.config.get<number>('outbox.pollIntervalMs')!);
  }

  onModuleDestroy(): void {
    this.outboxPublisher.stopPolling('payment');
  }
}
