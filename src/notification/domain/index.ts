// Value Objects
export { NotificationChannel } from './value-objects/notification-channel.value-object';
export { NotificationType } from './value-objects/notification-type.value-object';
export { NotificationStatus } from './value-objects/notification-status.value-object';

// Entities
export { Notification } from './entities/notification.entity';
export type { NotificationProps } from './entities/notification.entity';

// Events
export { NotificationSentEvent } from './events/notification-sent.event';

// Repository Interface
export {
  NOTIFICATION_REPOSITORY,
  type INotificationRepository,
} from './repositories/notification.repository.interface';

// Errors
export {
  NotificationNotFoundError,
  NotificationAlreadySentError,
} from './errors/notification-domain.errors';
