import { Injectable } from '@nestjs/common';
import {
  INotificationServicePort,
  NotificationType,
} from '@order/application/ports/notification-service.port';
import { SendNotificationUseCase } from '@notification/application/use-cases/send-notification/send-notification.use-case';

const NOTIFICATION_SUBJECTS: Record<NotificationType, string> = {
  ORDER_CONFIRMED: 'Your order has been confirmed',
  ORDER_SHIPPED: 'Your order has been shipped',
  ORDER_DELIVERED: 'Your order has been delivered',
  ORDER_CANCELLED: 'Your order has been cancelled',
  PAYMENT_RECEIVED: 'Payment received',
  PAYMENT_FAILED: 'Payment failed',
  REFUND_PROCESSED: 'Refund processed',
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
    const subject = NOTIFICATION_SUBJECTS[type];
    const body = this.buildNotificationBody(type, data);

    await this.sendNotificationUseCase.execute({
      recipientId,
      channel: 'EMAIL',
      type: this.mapToUseCaseType(type),
      subject,
      body,
      metadata: data,
    });
  }

  private mapToUseCaseType(
    type: NotificationType,
  ): 'ORDER_CONFIRMED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED' | 'PAYMENT_FAILED' | 'PAYMENT_REFUNDED' {
    switch (type) {
      case 'ORDER_CONFIRMED':
        return 'ORDER_CONFIRMED';
      case 'ORDER_SHIPPED':
        return 'ORDER_SHIPPED';
      case 'ORDER_DELIVERED':
        return 'ORDER_DELIVERED';
      case 'PAYMENT_FAILED':
        return 'PAYMENT_FAILED';
      case 'REFUND_PROCESSED':
        return 'PAYMENT_REFUNDED';
      case 'ORDER_CANCELLED':
        // Map to the closest available type in the notification service
        return 'ORDER_CONFIRMED';
      case 'PAYMENT_RECEIVED':
        return 'ORDER_CONFIRMED';
      default:
        return 'ORDER_CONFIRMED';
    }
  }

  private buildNotificationBody(
    type: NotificationType,
    data: Record<string, unknown>,
  ): string {
    const orderId = data.orderId ?? 'N/A';

    switch (type) {
      case 'ORDER_CONFIRMED':
        return `Your order ${orderId} has been confirmed and is being prepared for shipment.`;
      case 'ORDER_SHIPPED':
        return `Your order ${orderId} has been shipped. Track your delivery for updates.`;
      case 'ORDER_DELIVERED':
        return `Your order ${orderId} has been delivered. Thank you for your purchase!`;
      case 'ORDER_CANCELLED':
        return `Your order ${orderId} has been cancelled. Reason: ${data.reason ?? 'N/A'}`;
      case 'PAYMENT_RECEIVED':
        return `Payment for order ${orderId} has been received.`;
      case 'PAYMENT_FAILED':
        return `Payment for order ${orderId} has failed. Please update your payment method.`;
      case 'REFUND_PROCESSED':
        return `A refund for order ${orderId} has been processed.`;
      default:
        return `Update regarding your order ${orderId}.`;
    }
  }
}
