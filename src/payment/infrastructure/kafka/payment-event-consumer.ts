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
 * Consumes events from order.events for audit and supplementary reactions.
 * Primary payment flow is orchestrated by Temporal.
 */
@Injectable()
export class PaymentEventConsumer extends BaseEventConsumer {
  protected readonly consumerPrefix = IDEMPOTENCY_PREFIXES.PAYMENT_CONSUMER;

  constructor(
    kafkaConsumer: KafkaConsumerService,
    @Inject(IDEMPOTENCY_SERVICE) idempotencyService: IIdempotencyService,
  ) {
    super(kafkaConsumer, idempotencyService);
  }

  async onModuleInit(): Promise<void> {
    await this.subscribe({
      topic: KAFKA_TOPICS.ORDER_EVENTS,
      groupId: CONSUMER_GROUPS.PAYMENT_ORDER,
      handlers: [
        {
          eventType: OrderEventType.CANCELLED,
          handle: async (value) => {
            this.logger.log(
              `Order ${value.aggregateId} cancelled — payment refund may be needed`,
            );
          },
        },
        {
          eventType: OrderEventType.CREATED,
          handle: async (value) => {
            this.logger.log(
              `Order ${value.aggregateId} created — payment service notified for audit`,
            );
          },
        },
      ],
    });
  }
}
