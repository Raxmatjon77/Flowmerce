import { Generated } from 'kysely';
import { OutboxEventRow } from '@shared/infrastructure/kafka';

export interface NotificationTable {
  id: string;
  recipient_id: string;
  channel: string;
  type: string;
  status: string;
  subject: string;
  body: string;
  metadata: string; // JSON stringified
  failure_reason: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface NotificationDatabase {
  notifications: NotificationTable;
  outbox_events: OutboxEventRow;
}

export const KYSELY_NOTIFICATION_DB = Symbol('KYSELY_NOTIFICATION_DB');
