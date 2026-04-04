import { Injectable, Logger } from '@nestjs/common';
import { Kysely } from 'kysely';
import { KafkaProducerService } from '../kafka-producer.service';

export interface OutboxEventRow {
  id: string;
  aggregate_id: string;
  event_type: string;
  topic: string;
  payload: string;
  /**
   * Column types vary across bounded contexts (often `Generated<boolean>` / `Generated<Date>`).
   * Keep this flexible so we can plug in any Kysely database that has an `outbox_events` table.
   */
  published: unknown;
  created_at: unknown;
}

export interface OutboxTable {
  outbox_events: OutboxEventRow;
}

@Injectable()
export class OutboxPublisherService {
  private readonly logger = new Logger(OutboxPublisherService.name);
  private readonly pollers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly kafkaProducer: KafkaProducerService) {}

  startPolling<T extends OutboxTable>(
    pollerId: string,
    db: Kysely<T>,
    intervalMs = 1000,
  ): void {
    if (this.pollers.has(pollerId)) {
      this.logger.warn(`Outbox poller already running: ${pollerId}`);
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        await this.publishPendingEvents(db);
      } catch (error) {
        this.logger.error(`Outbox polling error: ${error}`);
      }
    }, intervalMs);

    this.pollers.set(pollerId, intervalId);
    this.logger.log(`Outbox poller started: ${pollerId} (every ${intervalMs}ms)`);
  }

  stopPolling(pollerId: string): void {
    const intervalId = this.pollers.get(pollerId);
    if (!intervalId) return;
    clearInterval(intervalId);
    this.pollers.delete(pollerId);
    this.logger.log(`Outbox poller stopped: ${pollerId}`);
  }

  stopAllPolling(): void {
    for (const pollerId of this.pollers.keys()) {
      this.stopPolling(pollerId);
    }
  }

  private async publishPendingEvents<T extends OutboxTable>(
    db: Kysely<T>,
  ): Promise<void> {
    const events = await db.transaction().execute(async (trx) => {
      // NOTE: This is safe for single instance polling. For multi-instance, add a "lock" column
      // and claim events (locked_by/locked_at) in the DB before publishing.
      return (trx as unknown as Kysely<OutboxTable>)
        .selectFrom('outbox_events')
        .selectAll()
        .where('published', '=', false)
        .orderBy('created_at', 'asc')
        .limit(100)
        .forUpdate()
        .skipLocked()
        .execute();
    });

    for (const event of events) {
      try {
        await this.kafkaProducer.send({
          topic: event.topic as string,
          key: event.aggregate_id as string,
          value: JSON.parse(event.payload as string),
          headers: {
            'x-event-id': event.id as string,
            'x-event-type': event.event_type as string,
          },
        });

        await (db as unknown as Kysely<OutboxTable>)
          .updateTable('outbox_events')
          .set({ published: true })
          .where('id', '=', event.id as string)
          .execute();
      } catch (error) {
        this.logger.error(
          `Failed to publish outbox event ${String(event.id)}: ${error}`,
        );
      }
    }
  }
}
