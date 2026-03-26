export interface SendNotificationDto {
  recipientId: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH';
  type:
    | 'ORDER_CONFIRMED'
    | 'ORDER_SHIPPED'
    | 'ORDER_DELIVERED'
    | 'PAYMENT_FAILED'
    | 'PAYMENT_REFUNDED';
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
}
