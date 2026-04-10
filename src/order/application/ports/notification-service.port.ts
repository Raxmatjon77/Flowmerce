export const NOTIFICATION_SERVICE_PORT = Symbol('INotificationServicePort');

export enum NotificationType {
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
}

export interface INotificationServicePort {
  sendNotification(
    recipientId: string,
    type: NotificationType,
    data: Record<string, unknown>,
  ): Promise<void>;
}
