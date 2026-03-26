import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('inventory_items')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('sku', 'varchar(100)', (col) => col.notNull().unique())
    .addColumn('product_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('total_quantity', 'integer', (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn('reserved_quantity', 'integer', (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_inventory_items_sku')
    .on('inventory_items')
    .column('sku')
    .execute();

  await db.schema
    .createTable('reservations')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('inventory_item_id', 'uuid', (col) =>
      col.notNull().references('inventory_items.id'),
    )
    .addColumn('order_id', 'uuid', (col) => col.notNull())
    .addColumn('quantity', 'integer', (col) => col.notNull())
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('released', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_reservations_order_id')
    .on('reservations')
    .column('order_id')
    .execute();

  await db.schema
    .createIndex('idx_reservations_inventory_item_id')
    .on('reservations')
    .column('inventory_item_id')
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
  await db.schema.dropTable('reservations').execute();
  await db.schema.dropTable('inventory_items').execute();
}
