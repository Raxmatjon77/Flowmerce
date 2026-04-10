import { Notification } from '../entities/notification.entity';

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export interface INotificationRepository {
  save(notification: Notification): Promise<void>;
  findAll(): Promise<Notification[]>;
  findById(id: string): Promise<Notification | null>;
  findByRecipientId(recipientId: string): Promise<Notification[]>;
}
