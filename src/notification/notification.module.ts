import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IdempotencyModule } from '@shared/infrastructure/idempotency';
import { KyselyModule } from '@shared/infrastructure/database/kysely.module';
import { DbConfig } from '@shared/config';
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
import { NOTIFICATION_USE_CASE_TOKENS } from './application/injection-tokens';
import { NotificationEventConsumer } from './infrastructure/kafka/notification-event-consumer';
import { NotificationController } from './presentation/controllers/notification.controller';
import { NotificationOutboxPollerService } from './infrastructure/kafka/notification-outbox-poller.service';

@Module({
  imports: [
    IdempotencyModule,
    KyselyModule.forFeatureAsync<NotificationDatabase>({
      token: KYSELY_NOTIFICATION_DB,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get<DbConfig>('notificationDb')!,
    }),
  ],
  controllers: [NotificationController],
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
      provide: NOTIFICATION_USE_CASE_TOKENS.SEND,
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
      provide: NOTIFICATION_USE_CASE_TOKENS.GET,
      useFactory: (notificationRepository: INotificationRepository) =>
        new GetNotificationsUseCase(notificationRepository),
      inject: [NOTIFICATION_REPOSITORY],
    },

    // Re-export use case classes for adapter injection
    {
      provide: SendNotificationUseCase,
      useExisting: NOTIFICATION_USE_CASE_TOKENS.SEND,
    },

    // Kafka event consumer
    NotificationEventConsumer,

    // Outbox publisher poller
    NotificationOutboxPollerService,
  ],
  exports: [
    NOTIFICATION_REPOSITORY,
    NOTIFICATION_USE_CASE_TOKENS.SEND,
    NOTIFICATION_USE_CASE_TOKENS.GET,
    SendNotificationUseCase,
  ],
})
export class NotificationModule {}
