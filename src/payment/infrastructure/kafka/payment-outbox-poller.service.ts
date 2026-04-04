import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kysely } from 'kysely';
import { OutboxPublisherService } from '@shared/infrastructure/kafka';
import { PaymentDatabase } from '../database/tables/payment.table';
import { KYSELY_PAYMENT_DB } from '../database/repositories/payment.repository';

@Injectable()
export class PaymentOutboxPollerService
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly outboxPublisher: OutboxPublisherService,
    @Inject(KYSELY_PAYMENT_DB)
    private readonly db: Kysely<PaymentDatabase>,
  ) {}

  onModuleInit(): void {
    if (process.env.OUTBOX_POLLING_ENABLED === 'false') return;
    const intervalMs = parseInt(process.env.OUTBOX_POLL_INTERVAL_MS || '1000', 10);
    this.outboxPublisher.startPolling('payment', this.db, intervalMs);
  }

  onModuleDestroy(): void {
    this.outboxPublisher.stopPolling('payment');
  }
}
