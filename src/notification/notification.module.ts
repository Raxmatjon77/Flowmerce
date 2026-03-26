import { Module } from '@nestjs/common';
import { KyselyModule } from '@shared/infrastructure/database/kysely.module';
import {
  NotificationDatabase,
  KYSELY_NOTIFICATION_DB,
} from './infrastructure/database/tables/notification.table';
import { KyselyNotificationRepository } from './infrastructure/database/repositories/notification.repository';
import {
  NOTIFICATION_REPOSITORY,
  INotificationRepository,
} from '@notification/domain';
import { EVENT_PUBLISHER, IEventPublisher } from '@shared/application';
import { NotificationEventPublisher } from './infrastructure/kafka/notification-event-publisher';
import {
  NOTIFICATION_SENDER,
  INotificationSender,
} from './application/ports/notification-sender.port';
import { MockNotificationSender } from './infrastructure/adapters/mock-notification-sender';
import { SendNotificationUseCase } from './application/use-cases/send-notification/send-notification.use-case';
import { GetNotificationsUseCase } from './application/use-cases/get-notifications/get-notifications.use-case';

@Module({
  imports: [
    KyselyModule.forFeature<NotificationDatabase>({
      host: process.env.NOTIFICATION_DB_HOST || 'localhost',
      port: parseInt(process.env.NOTIFICATION_DB_PORT || '5436', 10),
      user: process.env.NOTIFICATION_DB_USER || 'notification_user',
      password: process.env.NOTIFICATION_DB_PASSWORD || 'notification_pass',
      database: process.env.NOTIFICATION_DB_NAME || 'notification_db',
      token: KYSELY_NOTIFICATION_DB,
    }),
  ],
  providers: [
    // Repository binding
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: KyselyNotificationRepository,
    },

    // Event publisher binding
    { provide: EVENT_PUBLISHER, useClass: NotificationEventPublisher },

    // Notification sender binding
    { provide: NOTIFICATION_SENDER, useClass: MockNotificationSender },

    // Use cases (factory providers)
    {
      provide: 'SendNotificationUseCase',
      useFactory: (
        notificationRepository: INotificationRepository,
        notificationSender: INotificationSender,
        eventPublisher: IEventPublisher,
      ) =>
        new SendNotificationUseCase(
          notificationRepository,
          notificationSender,
          eventPublisher,
        ),
      inject: [NOTIFICATION_REPOSITORY, NOTIFICATION_SENDER, EVENT_PUBLISHER],
    },
    {
      provide: 'GetNotificationsUseCase',
      useFactory: (notificationRepository: INotificationRepository) =>
        new GetNotificationsUseCase(notificationRepository),
      inject: [NOTIFICATION_REPOSITORY],
    },

    // Re-export use case classes for adapter injection
    {
      provide: SendNotificationUseCase,
      useExisting: 'SendNotificationUseCase',
    },
  ],
  exports: [
    NOTIFICATION_REPOSITORY,
    'SendNotificationUseCase',
    'GetNotificationsUseCase',
    SendNotificationUseCase,
  ],
})
export class NotificationModule {}
