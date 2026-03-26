import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('orders')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('customer_id', 'varchar(36)', (col) => col.notNull())
    .addColumn('status', 'varchar(50)', (col) => col.notNull())
    .addColumn('total_amount', 'decimal(12, 2)', (col) => col.notNull())
    .addColumn('currency', 'varchar(3)', (col) => col.notNull())
    .addColumn('shipping_street', 'varchar(255)', (col) => col.notNull())
    .addColumn('shipping_city', 'varchar(100)', (col) => col.notNull())
    .addColumn('shipping_state', 'varchar(100)', (col) => col.notNull())
    .addColumn('shipping_zip_code', 'varchar(20)', (col) => col.notNull())
    .addColumn('shipping_country', 'varchar(100)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .execute();

  await db.schema
    .createIndex('idx_orders_customer_id')
    .on('orders')
    .column('customer_id')
    .execute();

  await db.schema
    .createIndex('idx_orders_status')
    .on('orders')
    .column('status')
    .execute();

  await db.schema
    .createTable('order_items')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey())
    .addColumn('order_id', 'varchar(36)', (col) =>
      col.references('orders.id').onDelete('cascade').notNull(),
    )
    .addColumn('product_id', 'varchar(36)', (col) => col.notNull())
    .addColumn('product_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('quantity', 'integer', (col) => col.notNull())
    .addColumn('unit_price', 'decimal(12, 2)', (col) => col.notNull())
    .addColumn('currency', 'varchar(3)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .execute();

  await db.schema
    .createIndex('idx_order_items_order_id')
    .on('order_items')
    .column('order_id')
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
  await db.schema.dropTable('order_items').execute();
  await db.schema.dropTable('orders').execute();
}
