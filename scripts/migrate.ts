import * as dotenv from 'dotenv';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

dotenv.config();

// Migration imports
import * as orderMigration from '../src/order/infrastructure/database/migrations/001_create_orders';
import * as paymentMigration from '../src/payment/infrastructure/database/migrations/001_create_payments';
import * as inventoryMigration from '../src/inventory/infrastructure/database/migrations/001_create_inventory';
import * as shippingMigration from '../src/shipping/infrastructure/database/migrations/001_create_shipping';
import * as notificationMigration from '../src/notification/infrastructure/database/migrations/001_create_notification';
import * as customerMigration from '../src/customer/infrastructure/database/migrations/001_create_customers';

interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

const databases: Record<string, { config: DbConfig; migration: { up: (db: Kysely<unknown>) => Promise<void> } }> = {
  order: {
    config: {
      host: process.env.ORDER_DB_HOST || 'localhost',
      port: parseInt(process.env.ORDER_DB_PORT || '5432'),
      user: process.env.ORDER_DB_USER || 'order_user',
      password: process.env.ORDER_DB_PASSWORD || 'order_pass',
      database: process.env.ORDER_DB_NAME || 'order_db',
    },
    migration: orderMigration,
  },
  payment: {
    config: {
      host: process.env.PAYMENT_DB_HOST || 'localhost',
      port: parseInt(process.env.PAYMENT_DB_PORT || '5433'),
      user: process.env.PAYMENT_DB_USER || 'payment_user',
      password: process.env.PAYMENT_DB_PASSWORD || 'payment_pass',
      database: process.env.PAYMENT_DB_NAME || 'payment_db',
    },
    migration: paymentMigration,
  },
  inventory: {
    config: {
      host: process.env.INVENTORY_DB_HOST || 'localhost',
      port: parseInt(process.env.INVENTORY_DB_PORT || '5434'),
      user: process.env.INVENTORY_DB_USER || 'inventory_user',
      password: process.env.INVENTORY_DB_PASSWORD || 'inventory_pass',
      database: process.env.INVENTORY_DB_NAME || 'inventory_db',
    },
    migration: inventoryMigration,
  },
  shipping: {
    config: {
      host: process.env.SHIPPING_DB_HOST || 'localhost',
      port: parseInt(process.env.SHIPPING_DB_PORT || '5435'),
      user: process.env.SHIPPING_DB_USER || 'shipping_user',
      password: process.env.SHIPPING_DB_PASSWORD || 'shipping_pass',
      database: process.env.SHIPPING_DB_NAME || 'shipping_db',
    },
    migration: shippingMigration,
  },
  notification: {
    config: {
      host: process.env.NOTIFICATION_DB_HOST || 'localhost',
      port: parseInt(process.env.NOTIFICATION_DB_PORT || '5436'),
      user: process.env.NOTIFICATION_DB_USER || 'notification_user',
      password: process.env.NOTIFICATION_DB_PASSWORD || 'notification_pass',
      database: process.env.NOTIFICATION_DB_NAME || 'notification_db',
    },
    migration: notificationMigration,
  },
  customer: {
    config: {
      host: process.env.CUSTOMER_DB_HOST || 'localhost',
      port: parseInt(process.env.CUSTOMER_DB_PORT || '5438'),
      user: process.env.CUSTOMER_DB_USER || 'customer_user',
      password: process.env.CUSTOMER_DB_PASSWORD || 'customer_pass',
      database: process.env.CUSTOMER_DB_NAME || 'customer_db',
    },
    migration: customerMigration,
  },
};

async function runMigration(name: string): Promise<void> {
  const { config, migration } = databases[name];

  console.log(`Connecting to ${name} database at ${config.host}:${config.port}...`);
  const pool = new Pool({
    ...config,
    ssl: false,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error(`Pool error for ${name}:`, err);
  });

  const db = new Kysely<unknown>({
    dialect: new PostgresDialect({ pool }),
  });

  console.log(`Running migration for ${name}...`);
  
  try {
    await migration.up(db);
    console.log(`✅ ${name} migration completed`);
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log(`⏭️  ${name} migration skipped (tables already exist)`);
    } else {
      throw error;
    }
  } finally {
    await db.destroy();
  }
}

async function main(): Promise<void> {
  const target = process.argv[2];

  if (target && target !== 'all') {
    if (!databases[target]) {
      console.error(`Unknown database: ${target}`);
      console.log(`Available: ${Object.keys(databases).join(', ')}, all`);
      process.exit(1);
    }
    await runMigration(target);
  } else {
    for (const name of Object.keys(databases)) {
      await runMigration(name);
    }
  }

  console.log('\n✅ All migrations completed');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
