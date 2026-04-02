import { Logger, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from './kafka-consumer.service';
import { IIdempotencyService } from '../idempotency/idempotency.service';
import { dlqTopic, DEFAULT_MAX_RETRIES } from './kafka.constants';

export interface EventHandler {
  eventType: string;
  handle: (value: Record<string, unknown>, key: string) => Promise<void>;
}

export interface SubscriptionConfig {
  topic: string;
  groupId: string;
  handlers: EventHandler[];
  maxRetries?: number;
}

/**
 * Base class for Kafka event consumers.
 * Extracts repeated boilerplate: idempotency checks, event extraction, logging, DLQ config.
 */
export abstract class BaseEventConsumer implements OnModuleInit {
  protected abstract readonly consumerPrefix: string;
  protected readonly logger: Logger;

  constructor(
    protected readonly kafkaConsumer: KafkaConsumerService,
    protected readonly idempotencyService: IIdempotencyService,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  abstract onModuleInit(): Promise<void>;

  protected async subscribe(config: SubscriptionConfig): Promise<void> {
    const handlerMap = new Map<string, EventHandler['handle']>();
    for (const handler of config.handlers) {
      handlerMap.set(handler.eventType, handler.handle);
    }

    await this.kafkaConsumer.consume({
      topic: config.topic,
      groupId: config.groupId,
      deadLetterTopic: dlqTopic(config.topic),
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
      handler: async ({ key, value }) => {
        const eventType = value.eventType as string;
        const eventId = value.eventId as string;

        if (await this.isDuplicate(eventId)) return;

        const handler = handlerMap.get(eventType);
        if (handler) {
          this.logger.log(`Processing ${eventType} from ${config.topic} [key=${key}]`);
          await handler(value, key);
        } else {
          this.logger.debug(`Ignoring unhandled event: ${eventType} from ${config.topic}`);
        }

        await this.markProcessed(eventId);
      },
    });
  }

  private async isDuplicate(eventId: string): Promise<boolean> {
    if (!eventId) return false;
    const existing = await this.idempotencyService.get(
      `${this.consumerPrefix}:${eventId}`,
    );
    if (existing) {
      this.logger.debug(`Skipping duplicate event: ${eventId}`);
      return true;
    }
    return false;
  }

  private async markProcessed(eventId: string): Promise<void> {
    if (!eventId) return;
    await this.idempotencyService.set(
      `${this.consumerPrefix}:${eventId}`,
      null,
      200,
    );
  }
}
