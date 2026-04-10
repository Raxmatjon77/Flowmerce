import { Injectable } from '@nestjs/common';
import {
  INotificationServicePort,
  NotificationType,
} from '@order/application/ports/notification-service.port';
import { SendNotificationUseCase } from '@notification/application/use-cases/send-notification/send-notification.use-case';
import {
  NotificationChannel,
  NotificationType as DomainNotificationType,
} from '@notification/domain';

const NOTIFICATION_SUBJECTS: Record<NotificationType, string> = {
  [NotificationType.ORDER_CONFIRMED]: 'Your order has been confirmed',
  [NotificationType.ORDER_SHIPPED]: 'Your order has been shipped',
  [NotificationType.ORDER_DELIVERED]: 'Your order has been delivered',
  [NotificationType.ORDER_CANCELLED]: 'Your order has been cancelled',
  [NotificationType.PAYMENT_RECEIVED]: 'Payment received',
  [NotificationType.PAYMENT_FAILED]: 'Payment failed',
  [NotificationType.REFUND_PROCESSED]: 'Refund processed',
};

const NOTIFICATION_TYPE_MAP: Partial<Record<NotificationType, DomainNotificationType>> = {
  [NotificationType.ORDER_CONFIRMED]: DomainNotificationType.ORDER_CONFIRMED,
  [NotificationType.ORDER_SHIPPED]: DomainNotificationType.ORDER_SHIPPED,
  [NotificationType.ORDER_DELIVERED]: DomainNotificationType.ORDER_DELIVERED,
  [NotificationType.PAYMENT_FAILED]: DomainNotificationType.PAYMENT_FAILED,
  [NotificationType.REFUND_PROCESSED]: DomainNotificationType.PAYMENT_REFUNDED,
};

@Injectable()
export class NotificationServiceAdapter implements INotificationServicePort {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
  ) {}

  async sendNotification(
    recipientId: string,
    type: NotificationType,
    data: Record<string, unknown>,
  ): Promise<void> {
    const domainType = NOTIFICATION_TYPE_MAP[type];
    if (!domainType) {
      return;
    }

    await this.sendNotificationUseCase.execute({
      recipientId,
      channel: NotificationChannel.EMAIL,
      type: domainType,
      subject: NOTIFICATION_SUBJECTS[type],
      body: this.buildNotificationBody(type, data),
      metadata: data,
    });
  }

  private buildNotificationBody(
    type: NotificationType,
    data: Record<string, unknown>,
  ): string {
    const orderId = data.orderId ?? 'N/A';

    switch (type) {
      case NotificationType.ORDER_CONFIRMED:
        return `Your order ${orderId} has been confirmed and is being prepared for shipment.`;
      case NotificationType.ORDER_SHIPPED:
        return `Your order ${orderId} has been shipped. Track your delivery for updates.`;
      case NotificationType.ORDER_DELIVERED:
        return `Your order ${orderId} has been delivered. Thank you for your purchase!`;
      case NotificationType.ORDER_CANCELLED:
        return `Your order ${orderId} has been cancelled. Reason: ${data.reason ?? 'N/A'}`;
      case NotificationType.PAYMENT_RECEIVED:
        return `Payment for order ${orderId} has been received.`;
      case NotificationType.PAYMENT_FAILED:
        return `Payment for order ${orderId} has failed. Please update your payment method.`;
      case NotificationType.REFUND_PROCESSED:
        return `A refund for order ${orderId} has been processed.`;
      default:
        return `Update regarding your order ${orderId}.`;
    }
  }
}
