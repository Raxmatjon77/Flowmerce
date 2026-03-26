import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('shipments')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('order_id', 'uuid', (col) => col.notNull())
    .addColumn('tracking_number', 'varchar(100)')
    .addColumn('carrier_name', 'varchar(100)')
    .addColumn('carrier_code', 'varchar(20)')
    .addColumn('status', 'varchar(50)', (col) =>
      col.notNull().defaultTo('PENDING'),
    )
    .addColumn('shipping_street', 'varchar(255)', (col) => col.notNull())
    .addColumn('shipping_city', 'varchar(100)', (col) => col.notNull())
    .addColumn('shipping_state', 'varchar(100)', (col) => col.notNull())
    .addColumn('shipping_zip', 'varchar(20)', (col) => col.notNull())
    .addColumn('shipping_country', 'varchar(100)', (col) => col.notNull())
    .addColumn('estimated_delivery', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_shipments_order_id')
    .on('shipments')
    .column('order_id')
    .execute();

  await db.schema
    .createIndex('idx_shipments_status')
    .on('shipments')
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
  await db.schema.dropTable('shipments').execute();
}
