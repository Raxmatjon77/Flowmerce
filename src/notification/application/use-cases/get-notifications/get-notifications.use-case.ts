import { IUseCase } from '@shared/application';
import { INotificationRepository } from '@notification/domain';
import { NotificationResponseDto } from '../../dtos/notification-response.dto';

export interface GetNotificationsInput {
  recipientId: string;
}

export class GetNotificationsUseCase
  implements IUseCase<GetNotificationsInput, NotificationResponseDto[]>
{
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(
    input: GetNotificationsInput,
  ): Promise<NotificationResponseDto[]> {
    const notifications =
      await this.notificationRepository.findByRecipientId(input.recipientId);

    return notifications.map((notification) => ({
      id: notification.id,
      recipientId: notification.recipientId,
      channel: notification.channel,
      type: notification.type,
      status: notification.status,
      subject: notification.subject,
      createdAt: notification.createdAt,
    }));
  }
}
