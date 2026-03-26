import { Selectable } from 'kysely';
import {
  Notification,
  NotificationChannel,
  NotificationType,
  NotificationStatus,
} from '@notification/domain';
import { NotificationTable } from '../tables/notification.table';

export class NotificationMapper {
  static toDomain(row: Selectable<NotificationTable>): Notification {
    return Notification.reconstitute(row.id, {
      recipientId: row.recipient_id,
      channel: row.channel as NotificationChannel,
      type: row.type as NotificationType,
      status: row.status as NotificationStatus,
      subject: row.subject,
      body: row.body,
      metadata: JSON.parse(row.metadata) as Record<string, unknown>,
      failureReason: row.failure_reason ?? undefined,
    });
  }

  static toPersistence(
    entity: Notification,
  ): Omit<NotificationTable, 'created_at' | 'updated_at'> {
    return {
      id: entity.id,
      recipient_id: entity.recipientId,
      channel: entity.channel,
      type: entity.type,
      status: entity.status,
      subject: entity.subject,
      body: entity.body,
      metadata: JSON.stringify(entity.metadata),
      failure_reason: entity.failureReason ?? null,
    };
  }
}
