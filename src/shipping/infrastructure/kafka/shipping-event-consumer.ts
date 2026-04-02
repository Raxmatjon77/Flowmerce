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
 * Consumes events from order.events for shipping awareness.
 * Shipment creation is orchestrated by Temporal; this provides audit logging.
 */
@Injectable()
export class ShippingEventConsumer extends BaseEventConsumer {
  protected readonly consumerPrefix = IDEMPOTENCY_PREFIXES.SHIPPING_CONSUMER;

  constructor(
    kafkaConsumer: KafkaConsumerService,
    @Inject(IDEMPOTENCY_SERVICE) idempotencyService: IIdempotencyService,
  ) {
    super(kafkaConsumer, idempotencyService);
  }

  async onModuleInit(): Promise<void> {
    await this.subscribe({
      topic: KAFKA_TOPICS.ORDER_EVENTS,
      groupId: CONSUMER_GROUPS.SHIPPING_ORDER,
      handlers: [
        {
          eventType: OrderEventType.CONFIRMED,
          handle: async (value) => {
            this.logger.log(
              `Order ${value.aggregateId} confirmed — shipping service notified`,
            );
          },
        },
        {
          eventType: OrderEventType.CANCELLED,
          handle: async (value) => {
            this.logger.log(
              `Order ${value.aggregateId} cancelled — any pending shipment should be halted`,
            );
          },
        },
      ],
    });
  }
}
