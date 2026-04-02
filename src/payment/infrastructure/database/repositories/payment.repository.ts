import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { v4 as uuidv4 } from 'uuid';
import { Payment, IPaymentRepository } from '@payment/domain';
import { KAFKA_TOPICS } from '@shared/infrastructure/kafka';
import { PaymentDatabase } from '../tables/payment.table';
import { PaymentMapper, PaymentRow } from '../mappers/payment.mapper';

export const KYSELY_PAYMENT_DB = Symbol('KYSELY_PAYMENT_DB');

@Injectable()
export class KyselyPaymentRepository implements IPaymentRepository {
  constructor(
    @Inject(KYSELY_PAYMENT_DB)
    private readonly db: Kysely<PaymentDatabase>,
  ) {}

  async save(payment: Payment): Promise<void> {
    const row = PaymentMapper.toPersistence(payment);
    const domainEvents = payment.clearDomainEvents();

    await this.db.transaction().execute(async (trx) => {
      // Upsert payment
      await trx
        .insertInto('payments')
        .values(row)
        .onConflict((oc) =>
          oc.column('id').doUpdateSet({
            status: row.status,
            transaction_id: row.transaction_id,
            failure_reason: row.failure_reason,
            updated_at: row.updated_at,
          }),
        )
        .execute();

      // Insert outbox events for domain events
      if (domainEvents.length > 0) {
        const outboxRows = domainEvents.map((event) => ({
          id: uuidv4(),
          aggregate_id: event.aggregateId,
          event_type: event.eventType,
          topic: this.resolveTopicForEvent(event.eventType),
          payload: JSON.stringify(event.toPrimitives()),
          created_at: new Date(),
        }));

        await trx.insertInto('outbox_events').values(outboxRows).execute();
      }
    });
  }

  async findById(id: string): Promise<Payment | null> {
    const row = await this.db
      .selectFrom('payments')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return PaymentMapper.toDomain(row as PaymentRow);
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const row = await this.db
      .selectFrom('payments')
      .selectAll()
      .where('order_id', '=', orderId)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return PaymentMapper.toDomain(row as PaymentRow);
  }

  private resolveTopicForEvent(_eventType: string): string {
    return KAFKA_TOPICS.PAYMENT_EVENTS;
  }
}
