import { IUseCase } from '@shared/application';
import { DashboardNotificationListResponseDto } from '../../dtos/dashboard-response.dto';
import { IDashboardReadPort } from '../../ports/dashboard-read.port';
import { toNotificationListItemDto } from '../dashboard-view.mapper';

export interface ListDashboardNotificationsInput {
  q?: string;
  status?: string;
  channel?: string;
  limit: number;
}

export class ListDashboardNotificationsUseCase
  implements
    IUseCase<
      ListDashboardNotificationsInput,
      DashboardNotificationListResponseDto
    >
{
  constructor(private readonly dashboardReadPort: IDashboardReadPort) {}

  async execute(
    input: ListDashboardNotificationsInput,
  ): Promise<DashboardNotificationListResponseDto> {
    const notifications = await this.dashboardReadPort.getNotifications();
    const normalizedQuery = input.q?.toLowerCase();
    const filtered = notifications.filter((notification) => {
      const matchesQuery =
        !normalizedQuery ||
        notification.recipient_id.toLowerCase().includes(normalizedQuery) ||
        notification.subject.toLowerCase().includes(normalizedQuery) ||
        notification.body.toLowerCase().includes(normalizedQuery) ||
        notification.type.toLowerCase().includes(normalizedQuery);
      const matchesStatus = !input.status || notification.status === input.status;
      const matchesChannel =
        !input.channel || notification.channel === input.channel;

      return matchesQuery && matchesStatus && matchesChannel;
    });

    return {
      data: filtered
        .sort((left, right) => right.created_at.getTime() - left.created_at.getTime())
        .slice(0, input.limit)
        .map((notification) => toNotificationListItemDto(notification)),
      meta: {
        total: filtered.length,
        limit: input.limit,
      },
    };
  }
}
