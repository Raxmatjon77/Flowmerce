export const NOTIFICATION_SERVICE_PORT = Symbol('INotificationServicePort');

export type NotificationType =
  | 'ORDER_CONFIRMED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'REFUND_PROCESSED';

export interface INotificationServicePort {
  sendNotification(
    recipientId: string,
    type: NotificationType,
    data: Record<string, unknown>,
  ): Promise<void>;
}
