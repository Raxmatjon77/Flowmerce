import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { v4 as uuidv4 } from 'uuid';
import { DomainEvent } from '@shared/domain';
import { IEventPublisher } from '@shared/application';
import { PaymentDatabase } from '../database/tables/payment.table';
import { KYSELY_PAYMENT_DB } from '../database/repositories/payment.repository';

@Injectable()
export class PaymentEventPublisher implements IEventPublisher {
  constructor(
    @Inject(KYSELY_PAYMENT_DB)
    private readonly db: Kysely<PaymentDatabase>,
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    await this.db
      .insertInto('outbox_events')
      .values({
        id: uuidv4(),
        aggregate_id: event.aggregateId,
        event_type: event.eventType,
        topic: this.resolveTopicForEvent(event.eventType),
        payload: JSON.stringify(event.toPrimitives()),
        created_at: new Date(),
      })
      .execute();
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    const outboxRows = events.map((event) => ({
      id: uuidv4(),
      aggregate_id: event.aggregateId,
      event_type: event.eventType,
      topic: this.resolveTopicForEvent(event.eventType),
      payload: JSON.stringify(event.toPrimitives()),
      created_at: new Date(),
    }));

    await this.db.insertInto('outbox_events').values(outboxRows).execute();
  }

  private resolveTopicForEvent(eventType: string): string {
    const topicMap: Record<string, string> = {
      PaymentCreated: 'payment.events',
      PaymentProcessed: 'payment.events',
      PaymentFailed: 'payment.events',
      PaymentRefunded: 'payment.events',
    };

    return topicMap[eventType] ?? 'payment.events';
  }
}
