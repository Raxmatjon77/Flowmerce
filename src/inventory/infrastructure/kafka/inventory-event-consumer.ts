import { Injectable, Inject } from '@nestjs/common';
import {
  KafkaConsumerService,
  BaseEventConsumer,
  KAFKA_TOPICS,
  CONSUMER_GROUPS,
  IDEMPOTENCY_PREFIXES,
  OrderEventType,
} from '@shared/infrastructure/kafka';
import { IIdempotencyService, IDEMPOTENCY_SERVICE } from '@shared/infrastructure/idempotency';

/**
 * Consumes events from order.events for inventory awareness.
 * Actual inventory release on cancellation is handled by Temporal compensation.
 */
@Injectable()
export class InventoryEventConsumer extends BaseEventConsumer {
  protected readonly consumerPrefix = IDEMPOTENCY_PREFIXES.INVENTORY_CONSUMER;

  constructor(
    kafkaConsumer: KafkaConsumerService,
    @Inject(IDEMPOTENCY_SERVICE) idempotencyService: IIdempotencyService,
  ) {
    super(kafkaConsumer, idempotencyService);
  }

  async onModuleInit(): Promise<void> {
    await this.subscribe({
      topic: KAFKA_TOPICS.ORDER_EVENTS,
      groupId: CONSUMER_GROUPS.INVENTORY_ORDER,
      handlers: [
        {
          eventType: OrderEventType.CANCELLED,
          handle: async (value) => {
            this.logger.log(
              `Order ${value.aggregateId} cancelled — inventory release deferred to Temporal compensation`,
            );
          },
        },
      ],
    });
  }
}
