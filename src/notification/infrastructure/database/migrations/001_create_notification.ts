import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('notifications')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('recipient_id', 'varchar(255)', (col) => col.notNull())
    .addColumn('channel', 'varchar(50)', (col) => col.notNull())
    .addColumn('type', 'varchar(50)', (col) => col.notNull())
    .addColumn('status', 'varchar(50)', (col) =>
      col.notNull().defaultTo('PENDING'),
    )
    .addColumn('subject', 'varchar(500)', (col) => col.notNull())
    .addColumn('body', 'text', (col) => col.notNull())
    .addColumn('metadata', 'text', (col) => col.notNull().defaultTo('{}'))
    .addColumn('failure_reason', 'text')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_notifications_recipient_id')
    .on('notifications')
    .column('recipient_id')
    .execute();

  await db.schema
    .createIndex('idx_notifications_status')
    .on('notifications')
    .column('status')
    .execute();

  await db.schema
    .createTable('outbox_events')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('aggregate_id', 'varchar(255)', (col) => col.notNull())
    .addColumn('event_type', 'varchar(255)', (col) => col.notNull())
    .addColumn('topic', 'varchar(255)', (col) => col.notNull())
    .addColumn('payload', 'text', (col) => col.notNull())
    .addColumn('published', 'boolean', (col) =>
      col.notNull().defaultTo(false),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_outbox_events_published')
    .on('outbox_events')
    .columns(['published', 'created_at'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('outbox_events').execute();
  await db.schema.dropTable('notifications').execute();
}
