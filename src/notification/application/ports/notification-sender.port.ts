export const NOTIFICATION_SENDER = Symbol('INotificationSender');

export interface NotificationSendResult {
  success: boolean;
  failureReason?: string;
}

export interface INotificationSender {
  send(
    channel: string,
    recipient: string,
    subject: string,
    body: string,
  ): Promise<NotificationSendResult>;
}
