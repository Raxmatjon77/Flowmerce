import { randomUUID } from 'crypto';
import { IUseCase, IEventPublisher } from '@shared/application';
import {
  Notification,
  INotificationRepository,
  NotificationChannel,
  NotificationType,
} from '@notification/domain';
import { SendNotificationDto } from '../../dtos/send-notification.dto';
import { NotificationResponseDto } from '../../dtos/notification-response.dto';
import { INotificationSender } from '../../ports/notification-sender.port';

export class SendNotificationUseCase
  implements IUseCase<SendNotificationDto, NotificationResponseDto>
{
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly notificationSender: INotificationSender,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(
    input: SendNotificationDto,
  ): Promise<NotificationResponseDto> {
    const channel = input.channel as NotificationChannel;
    const type = input.type as NotificationType;

    const notification = Notification.create(
      randomUUID(),
      input.recipientId,
      channel,
      type,
      input.subject,
      input.body,
      input.metadata ?? {},
    );

    // Delegate actual sending to the infrastructure port
    const result = await this.notificationSender.send(
      input.channel,
      input.recipientId,
      input.subject,
      input.body,
    );

    if (result.success) {
      notification.markSent();
    } else {
      notification.markFailed(result.failureReason ?? 'Unknown error');
    }

    await this.notificationRepository.save(notification);

    const events = notification.clearDomainEvents();
    await this.eventPublisher.publishAll(events);

    return {
      id: notification.id,
      recipientId: notification.recipientId,
      channel: notification.channel,
      type: notification.type,
      status: notification.status,
      subject: notification.subject,
      createdAt: notification.createdAt,
    };
  }
}
