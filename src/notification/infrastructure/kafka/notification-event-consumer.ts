import { Injectable, Inject } from '@nestjs/common';
import {
  KafkaConsumerService,
  BaseEventConsumer,
  KAFKA_TOPICS,
  CONSUMER_GROUPS,
  IDEMPOTENCY_PREFIXES,
  OrderEventType,
  PaymentEventType,
  ShippingEventType,
  InventoryEventType,
} from '@shared/infrastructure/kafka';
import { IIdempotencyService, IDEMPOTENCY_SERVICE } from '@shared/infrastructure/idempotency';
import { SendNotificationUseCase } from '@notification/application/use-cases/send-notification/send-notification.use-case';
import { NOTIFICATION_USE_CASE_TOKENS } from '@notification/application/injection-tokens';
import { SendNotificationDto } from '@notification/application/dtos/send-notification.dto';

/**
 * Consumes events from ALL service topics to trigger user notifications.
 * Cross-cutting concern: reacts to key business events across the platform.
 */
@Injectable()
export class NotificationEventConsumer extends BaseEventConsumer {
  protected readonly consumerPrefix = IDEMPOTENCY_PREFIXES.NOTIFICATION_CONSUMER;

  constructor(
    kafkaConsumer: KafkaConsumerService,
    @Inject(IDEMPOTENCY_SERVICE) idempotencyService: IIdempotencyService,
    @Inject(NOTIFICATION_USE_CASE_TOKENS.SEND)
    private readonly sendNotificationUseCase: SendNotificationUseCase,
  ) {
    super(kafkaConsumer, idempotencyService);
  }

  async onModuleInit(): Promise<void> {
    await this.subscribeToOrderEvents();
    await this.subscribeToPaymentEvents();
    await this.subscribeToShippingEvents();
    await this.subscribeToInventoryEvents();
  }

  private async subscribeToOrderEvents(): Promise<void> {
    await this.subscribe({
      topic: KAFKA_TOPICS.ORDER_EVENTS,
      groupId: CONSUMER_GROUPS.NOTIFICATION_ORDER,
      handlers: [
        {
          eventType: OrderEventType.CONFIRMED,
          handle: async (value) => {
            const orderId = value.aggregateId as string;
            await this.sendNotificationSafe({
              recipientId: orderId,
              channel: 'EMAIL',
              type: 'ORDER_CONFIRMED',
              subject: `Order ${orderId} Confirmed`,
              body: `Your order ${orderId} has been confirmed and is being prepared for shipment.`,
              metadata: { orderId },
            });
          },
        },
        {
          eventType: OrderEventType.CANCELLED,
          handle: async (value) => {
            this.logger.log(
              `Order ${value.aggregateId} cancelled — notification logged for customer ${value.customerId}`,
            );
          },
        },
      ],
    });
  }

  private async subscribeToPaymentEvents(): Promise<void> {
    await this.subscribe({
      topic: KAFKA_TOPICS.PAYMENT_EVENTS,
      groupId: CONSUMER_GROUPS.NOTIFICATION_PAYMENT,
      handlers: [
        {
          eventType: PaymentEventType.FAILED,
          handle: async (value) => {
            const orderId = value.orderId as string;
            const reason = value.reason as string;
            await this.sendNotificationSafe({
              recipientId: orderId,
              channel: 'EMAIL',
              type: 'PAYMENT_FAILED',
              subject: `Payment Failed for Order ${orderId}`,
              body: `Your payment for order ${orderId} could not be processed. Reason: ${reason}. Please update your payment method.`,
              metadata: { orderId, reason },
            });
          },
        },
        {
          eventType: PaymentEventType.REFUNDED,
          handle: async (value) => {
            const orderId = value.orderId as string;
            const amount = value.amount as number;
            const currency = value.currency as string;
            await this.sendNotificationSafe({
              recipientId: orderId,
              channel: 'EMAIL',
              type: 'PAYMENT_REFUNDED',
              subject: `Refund Processed for Order ${orderId}`,
              body: `A refund of ${amount} ${currency} has been processed for your order ${orderId}.`,
              metadata: { orderId, amount, currency },
            });
          },
        },
      ],
    });
  }

  private async subscribeToShippingEvents(): Promise<void> {
    await this.subscribe({
      topic: KAFKA_TOPICS.SHIPPING_EVENTS,
      groupId: CONSUMER_GROUPS.NOTIFICATION_SHIPPING,
      handlers: [
        {
          eventType: ShippingEventType.CREATED,
          handle: async (value) => {
            const orderId = value.orderId as string;
            await this.sendNotificationSafe({
              recipientId: orderId,
              channel: 'EMAIL',
              type: 'ORDER_SHIPPED',
              subject: `Order ${orderId} Shipped`,
              body: `Your order ${orderId} has been shipped and is on its way.`,
              metadata: { orderId, shipmentId: value.shipmentId },
            });
          },
        },
        {
          eventType: ShippingEventType.DELIVERED,
          handle: async (value) => {
            const orderId = value.orderId as string;
            await this.sendNotificationSafe({
              recipientId: orderId,
              channel: 'EMAIL',
              type: 'ORDER_DELIVERED',
              subject: `Order ${orderId} Delivered`,
              body: `Your order ${orderId} has been delivered. Thank you for your purchase!`,
              metadata: { orderId, shipmentId: value.shipmentId },
            });
          },
        },
      ],
    });
  }

  private async subscribeToInventoryEvents(): Promise<void> {
    await this.subscribe({
      topic: KAFKA_TOPICS.INVENTORY_EVENTS,
      groupId: CONSUMER_GROUPS.NOTIFICATION_INVENTORY,
      handlers: [
        {
          eventType: InventoryEventType.RESERVED,
          handle: async (value) => {
            this.logger.log(
              `Inventory event ${InventoryEventType.RESERVED} logged for audit — aggregate: ${value.aggregateId}`,
            );
          },
        },
        {
          eventType: InventoryEventType.RELEASED,
          handle: async (value) => {
            this.logger.log(
              `Inventory event ${InventoryEventType.RELEASED} logged for audit — aggregate: ${value.aggregateId}`,
            );
          },
        },
        {
          eventType: InventoryEventType.DEDUCTED,
          handle: async (value) => {
            this.logger.log(
              `Inventory event ${InventoryEventType.DEDUCTED} logged for audit — aggregate: ${value.aggregateId}`,
            );
          },
        },
      ],
    });
  }

  private async sendNotificationSafe(dto: SendNotificationDto): Promise<void> {
    try {
      await this.sendNotificationUseCase.execute(dto);
      this.logger.log(
        `Notification sent: ${dto.type} to ${dto.recipientId} via ${dto.channel}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send notification: ${dto.type} to ${dto.recipientId}: ${error}`,
      );
      throw error;
    }
  }
}
