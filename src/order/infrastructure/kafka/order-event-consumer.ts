import { Injectable, Inject } from '@nestjs/common';
import {
  KafkaConsumerService,
  BaseEventConsumer,
  KAFKA_TOPICS,
  CONSUMER_GROUPS,
  IDEMPOTENCY_PREFIXES,
  PaymentEventType,
  InventoryEventType,
  ShippingEventType,
} from '@shared/infrastructure/kafka';
import { IIdempotencyService, IDEMPOTENCY_SERVICE } from '@shared/infrastructure/idempotency';
import { UpdateOrderStatusUseCase } from '@order/application/use-cases/update-order-status/update-order-status.use-case';
import { ORDER_USE_CASE_TOKENS } from '@order/application/injection-tokens';
import { OrderStatusEnum } from '@order/domain';

/**
 * Consumes events from payment, inventory, and shipping topics
 * to sync order status based on downstream service outcomes.
 *
 * The primary order flow is orchestrated by Temporal. These consumers
 * handle supplementary status syncing for out-of-workflow events.
 */
@Injectable()
export class OrderEventConsumer extends BaseEventConsumer {
  protected readonly consumerPrefix = IDEMPOTENCY_PREFIXES.ORDER_CONSUMER;

  constructor(
    kafkaConsumer: KafkaConsumerService,
    @Inject(IDEMPOTENCY_SERVICE) idempotencyService: IIdempotencyService,
    @Inject(ORDER_USE_CASE_TOKENS.UPDATE_STATUS)
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
  ) {
    super(kafkaConsumer, idempotencyService);
  }

  async onModuleInit(): Promise<void> {
    await this.subscribe({
      topic: KAFKA_TOPICS.PAYMENT_EVENTS,
      groupId: CONSUMER_GROUPS.ORDER_PAYMENT,
      handlers: [
        {
          eventType: PaymentEventType.PROCESSED,
          handle: async (value) => {
            await this.updateOrderStatusUseCase.execute({
              orderId: value.orderId as string,
              status: OrderStatusEnum.PAYMENT_PROCESSED,
            });
          },
        },
        {
          eventType: PaymentEventType.FAILED,
          handle: async (value) => {
            this.logger.warn(
              `Payment failed for order ${value.orderId}: ${value.reason}`,
            );
          },
        },
        {
          eventType: PaymentEventType.REFUNDED,
          handle: async (value) => {
            this.logger.log(
              `Payment refunded for order ${value.orderId}, amount: ${value.amount} ${value.currency}`,
            );
          },
        },
      ],
    });

    await this.subscribe({
      topic: KAFKA_TOPICS.INVENTORY_EVENTS,
      groupId: CONSUMER_GROUPS.ORDER_INVENTORY,
      handlers: [
        {
          eventType: InventoryEventType.RESERVED,
          handle: async (value) => {
            const orderId = value.orderId as string;
            if (orderId) {
              await this.updateOrderStatusUseCase.execute({
                orderId,
                status: OrderStatusEnum.INVENTORY_RESERVED,
              });
            }
          },
        },
        {
          eventType: InventoryEventType.RELEASED,
          handle: async (value) => {
            this.logger.log(`Inventory released for order ${value.orderId}`);
          },
        },
      ],
    });

    await this.subscribe({
      topic: KAFKA_TOPICS.SHIPPING_EVENTS,
      groupId: CONSUMER_GROUPS.ORDER_SHIPPING,
      handlers: [
        {
          eventType: ShippingEventType.CREATED,
          handle: async (value) => {
            const orderId = value.orderId as string;
            if (orderId) {
              await this.updateOrderStatusUseCase.execute({
                orderId,
                status: OrderStatusEnum.SHIPPED,
              });
            }
          },
        },
        {
          eventType: ShippingEventType.DELIVERED,
          handle: async (value) => {
            const orderId = value.orderId as string;
            if (orderId) {
              await this.updateOrderStatusUseCase.execute({
                orderId,
                status: OrderStatusEnum.DELIVERED,
              });
            }
          },
        },
      ],
    });
  }
}
