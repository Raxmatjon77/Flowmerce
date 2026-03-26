import { Injectable, Logger } from '@nestjs/common';
import { Kysely } from 'kysely';
import { KafkaProducerService } from '../kafka-producer.service';

export interface OutboxEvent {
  id: string;
  aggregate_id: string;
  event_type: string;
  topic: string;
  payload: string;
  published: boolean;
  created_at: Date;
}

export interface OutboxTable {
  outbox_events: OutboxEvent;
}

@Injectable()
export class OutboxPublisherService {
  private readonly logger = new Logger(OutboxPublisherService.name);
  private intervalId: NodeJS.Timeout | null = null;

  constructor(private readonly kafkaProducer: KafkaProducerService) {}

  startPolling<T extends OutboxTable>(db: Kysely<T>, intervalMs = 1000): void {
    this.intervalId = setInterval(async () => {
      try {
        await this.publishPendingEvents(db);
      } catch (error) {
        this.logger.error(`Outbox polling error: ${error}`);
      }
    }, intervalMs);
  }

  stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async publishPendingEvents<T extends OutboxTable>(
    db: Kysely<T>,
  ): Promise<void> {
    const events = await (db as unknown as Kysely<OutboxTable>)
      .selectFrom('outbox_events')
      .selectAll()
      .where('published', '=', false)
      .orderBy('created_at', 'asc')
      .limit(100)
      .forUpdate()
      .skipLocked()
      .execute();

    for (const event of events) {
      try {
        await this.kafkaProducer.send({
          topic: event.topic,
          key: event.aggregate_id,
          value: JSON.parse(event.payload),
          headers: {
            'x-event-id': event.id,
            'x-event-type': event.event_type,
          },
        });

        await (db as unknown as Kysely<OutboxTable>)
          .updateTable('outbox_events')
          .set({ published: true })
          .where('id', '=', event.id)
          .execute();
      } catch (error) {
        this.logger.error(
          `Failed to publish outbox event ${event.id}: ${error}`,
        );
      }
    }
  }
}
