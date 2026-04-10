import { NotificationChannel } from '@notification/domain';
import { NotificationType } from '@notification/domain';

export interface SendNotificationDto {
  recipientId: string;
  channel: NotificationChannel;
  type: NotificationType;
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
}
