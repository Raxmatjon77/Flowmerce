import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { v4 as uuidv4 } from 'uuid';
import { DomainEvent } from '@shared/domain';
import { IEventPublisher } from '@shared/application';
import { KAFKA_TOPICS } from '@shared/infrastructure/kafka';
import { OrderDatabase } from '../database/tables/order.table';
import { KYSELY_ORDER_DB } from '../database/repositories/order.repository';

@Injectable()
export class OrderEventPublisher implements IEventPublisher {
  constructor(
    @Inject(KYSELY_ORDER_DB)
    private readonly db: Kysely<OrderDatabase>,
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

  private resolveTopicForEvent(_eventType: string): string {
    return KAFKA_TOPICS.ORDER_EVENTS;
  }
}
