import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { v4 as uuidv4 } from 'uuid';
import { DomainEvent } from '@shared/domain';
import { IEventPublisher } from '@shared/application';
import { KAFKA_TOPICS } from '@shared/infrastructure/kafka';
import {
  ShippingDatabase,
  KYSELY_SHIPPING_DB,
} from '../database/tables/shipping.table';

@Injectable()
export class ShippingEventPublisher implements IEventPublisher {
  constructor(
    @Inject(KYSELY_SHIPPING_DB)
    private readonly db: Kysely<ShippingDatabase>,
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    await this.db
      .insertInto('outbox_events')
      .values({
        id: uuidv4(),
        aggregate_id: event.aggregateId,
        event_type: event.eventType,
        topic: KAFKA_TOPICS.SHIPPING_EVENTS,
        payload: JSON.stringify(event.toPrimitives()),
        published: false,
        created_at: new Date(),
      })
      .execute();
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) return;

    const rows = events.map((event) => ({
      id: uuidv4(),
      aggregate_id: event.aggregateId,
      event_type: event.eventType,
      topic: KAFKA_TOPICS.SHIPPING_EVENTS,
      payload: JSON.stringify(event.toPrimitives()),
      published: false,
      created_at: new Date(),
    }));

    await this.db.insertInto('outbox_events').values(rows).execute();
  }
}
