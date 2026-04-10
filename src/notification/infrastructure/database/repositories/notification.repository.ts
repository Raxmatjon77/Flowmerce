import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { INotificationRepository, Notification } from '@notification/domain';
import {
  NotificationDatabase,
  KYSELY_NOTIFICATION_DB,
} from '../tables/notification.table';
import { NotificationMapper } from '../mappers/notification.mapper';

@Injectable()
export class KyselyNotificationRepository implements INotificationRepository {
  constructor(
    @Inject(KYSELY_NOTIFICATION_DB)
    private readonly db: Kysely<NotificationDatabase>,
  ) {}

  async save(notification: Notification): Promise<void> {
    const record = NotificationMapper.toPersistence(notification);

    await this.db
      .insertInto('notifications')
      .values(record)
      .onConflict((oc) =>
        oc.column('id').doUpdateSet({
          recipient_id: record.recipient_id,
          channel: record.channel,
          type: record.type,
          status: record.status,
          subject: record.subject,
          body: record.body,
          metadata: record.metadata,
          failure_reason: record.failure_reason,
          updated_at: new Date(),
        }),
      )
      .execute();
  }

  async findAll(): Promise<Notification[]> {
    const rows = await this.db
      .selectFrom('notifications')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    return rows.map(NotificationMapper.toDomain);
  }

  async findById(id: string): Promise<Notification | null> {
    const row = await this.db
      .selectFrom('notifications')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!row) return null;

    return NotificationMapper.toDomain(row);
  }

  async findByRecipientId(recipientId: string): Promise<Notification[]> {
    const rows = await this.db
      .selectFrom('notifications')
      .selectAll()
      .where('recipient_id', '=', recipientId)
      .orderBy('created_at', 'desc')
      .execute();

    return rows.map(NotificationMapper.toDomain);
  }
}
