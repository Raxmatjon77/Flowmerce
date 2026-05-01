import 'dotenv/config';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

// Migration imports
import * as orderMigration001 from '../src/order/infrastructure/database/migrations/001_create_orders';
import * as paymentMigration001 from '../src/payment/infrastructure/database/migrations/001_create_payments';
import * as inventoryMigration001 from '../src/inventory/infrastructure/database/migrations/001_create_inventory';
import * as inventoryMigration002 from '../src/inventory/infrastructure/database/migrations/002_add_unit_price_to_inventory';
import * as shippingMigration001 from '../src/shipping/infrastructure/database/migrations/001_create_shipping';
import * as notificationMigration001 from '../src/notification/infrastructure/database/migrations/001_create_notification';
import * as customerMigration001 from '../src/customer/infrastructure/database/migrations/001_create_customers';

interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

interface Migration {
  up: (db: Kysely<unknown>) => Promise<void>;
}

const databases: Record<string, { config: DbConfig; migrations: Migration[] }> = {
  order: {
    config: {
      host: process.env.ORDER_DB_HOST || 'localhost',
      port: parseInt(process.env.ORDER_DB_PORT || '5432'),
      user: process.env.ORDER_DB_USER || 'order_user',
      password: process.env.ORDER_DB_PASSWORD || 'order_pass',
      database: process.env.ORDER_DB_NAME || 'order_db',
    },
    migrations: [orderMigration001],
  },
  payment: {
    config: {
      host: process.env.PAYMENT_DB_HOST || 'localhost',
      port: parseInt(process.env.PAYMENT_DB_PORT || '5433'),
      user: process.env.PAYMENT_DB_USER || 'payment_user',
      password: process.env.PAYMENT_DB_PASSWORD || 'payment_pass',
      database: process.env.PAYMENT_DB_NAME || 'payment_db',
    },
    migrations: [paymentMigration001],
  },
  inventory: {
    config: {
      host: process.env.INVENTORY_DB_HOST || 'localhost',
      port: parseInt(process.env.INVENTORY_DB_PORT || '5434'),
      user: process.env.INVENTORY_DB_USER || 'inventory_user',
      password: process.env.INVENTORY_DB_PASSWORD || 'inventory_pass',
      database: process.env.INVENTORY_DB_NAME || 'inventory_db',
    },
    migrations: [inventoryMigration001, inventoryMigration002],
  },
  shipping: {
    config: {
      host: process.env.SHIPPING_DB_HOST || 'localhost',
      port: parseInt(process.env.SHIPPING_DB_PORT || '5435'),
      user: process.env.SHIPPING_DB_USER || 'shipping_user',
      password: process.env.SHIPPING_DB_PASSWORD || 'shipping_pass',
      database: process.env.SHIPPING_DB_NAME || 'shipping_db',
    },
    migrations: [shippingMigration001],
  },
  notification: {
    config: {
      host: process.env.NOTIFICATION_DB_HOST || 'localhost',
      port: parseInt(process.env.NOTIFICATION_DB_PORT || '5436'),
      user: process.env.NOTIFICATION_DB_USER || 'notification_user',
      password: process.env.NOTIFICATION_DB_PASSWORD || 'notification_pass',
      database: process.env.NOTIFICATION_DB_NAME || 'notification_db',
    },
    migrations: [notificationMigration001],
  },
  customer: {
    config: {
      host: process.env.CUSTOMER_DB_HOST || 'localhost',
      port: parseInt(process.env.CUSTOMER_DB_PORT || '5438'),
      user: process.env.CUSTOMER_DB_USER || 'customer_user',
      password: process.env.CUSTOMER_DB_PASSWORD || 'customer_pass',
      database: process.env.CUSTOMER_DB_NAME || 'customer_db',
    },
    migrations: [customerMigration001],
  },
};

async function runMigrations(name: string): Promise<void> {
  const { config, migrations } = databases[name];

  console.log(`Connecting to ${name} database at ${config.host}:${config.port}...`);
  const pool = new Pool({ ...config, ssl: false, connectionTimeoutMillis: 5000 });
  pool.on('error', (err) => console.error(`Pool error for ${name}:`, err));

  const db = new Kysely<unknown>({ dialect: new PostgresDialect({ pool }) });

  for (let i = 0; i < migrations.length; i++) {
    const label = `${name} migration ${String(i + 1).padStart(3, '0')}`;
    console.log(`Running ${label}...`);
    try {
      await migrations[i].up(db);
      console.log(`✅ ${label} completed`);
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate column')) {
        console.log(`⏭️  ${label} skipped (already applied)`);
      } else {
        await db.destroy();
        throw error;
      }
    }
  }

  await db.destroy();
}

async function main(): Promise<void> {
  const target = process.argv[2];

  if (target && target !== 'all') {
    if (!databases[target]) {
      console.error(`Unknown database: ${target}`);
      console.log(`Available: ${Object.keys(databases).join(', ')}, all`);
      process.exit(1);
    }
    await runMigrations(target);
  } else {
    for (const name of Object.keys(databases)) {
      await runMigrations(name);
    }
  }

  console.log('\n✅ All migrations completed');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
