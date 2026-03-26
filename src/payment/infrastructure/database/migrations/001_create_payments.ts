import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('payments')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('order_id', 'varchar(36)', (col) => col.notNull())
    .addColumn('amount', 'decimal(12, 2)', (col) => col.notNull())
    .addColumn('currency', 'varchar(3)', (col) => col.notNull())
    .addColumn('status', 'varchar(50)', (col) => col.notNull())
    .addColumn('method_type', 'varchar(50)', (col) => col.notNull())
    .addColumn('method_last4', 'varchar(4)', (col) => col.notNull())
    .addColumn('method_expiry_month', 'integer', (col) => col.notNull())
    .addColumn('method_expiry_year', 'integer', (col) => col.notNull())
    .addColumn('transaction_id', 'varchar(255)')
    .addColumn('failure_reason', 'text')
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .execute();

  await db.schema
    .createIndex('idx_payments_order_id')
    .on('payments')
    .column('order_id')
    .execute();

  await db.schema
    .createIndex('idx_payments_status')
    .on('payments')
    .column('status')
    .execute();

  await db.schema
    .createTable('outbox_events')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('aggregate_id', 'varchar(36)', (col) => col.notNull())
    .addColumn('event_type', 'varchar(100)', (col) => col.notNull())
    .addColumn('topic', 'varchar(255)', (col) => col.notNull())
    .addColumn('payload', 'text', (col) => col.notNull())
    .addColumn('published', 'boolean', (col) =>
      col.defaultTo(false).notNull(),
    )
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
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
  await db.schema.dropTable('payments').execute();
}
