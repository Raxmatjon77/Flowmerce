import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { v4 as uuidv4 } from 'uuid';
import { DomainEvent } from '@shared/domain';
import { IEventPublisher } from '@shared/application';
import {
  InventoryDatabase,
  KYSELY_INVENTORY_DB,
} from '../database/tables/inventory.table';

const INVENTORY_TOPIC = 'inventory.events';

@Injectable()
export class InventoryEventPublisher implements IEventPublisher {
  constructor(
    @Inject(KYSELY_INVENTORY_DB)
    private readonly db: Kysely<InventoryDatabase>,
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    await this.db
      .insertInto('outbox_events')
      .values({
        id: uuidv4(),
        aggregate_id: event.aggregateId,
        event_type: event.eventType,
        topic: INVENTORY_TOPIC,
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
      topic: INVENTORY_TOPIC,
      payload: JSON.stringify(event.toPrimitives()),
      published: false,
      created_at: new Date(),
    }));

    await this.db.insertInto('outbox_events').values(rows).execute();
  }
}
