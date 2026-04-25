import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

interface InventoryDatabase {
  inventory_items: {
    id: string;
    sku: string;
    product_name: string;
    total_quantity: number;
    reserved_quantity: number;
    unit_price: number;
    created_at: Date;
    updated_at: Date;
  };
}

const inventoryItems = [
  { sku: 'SKU-LAPTOP-001', productName: 'MacBook Pro 14"', quantity: 100, unitPrice: 199900 },
  { sku: 'SKU-LAPTOP-002', productName: 'MacBook Pro 16"', quantity: 50, unitPrice: 249900 },
  { sku: 'SKU-LAPTOP-003', productName: 'MacBook Air 15"', quantity: 200, unitPrice: 129900 },
  { sku: 'SKU-MOUSE-001', productName: 'Magic Mouse', quantity: 500, unitPrice: 7900 },
  { sku: 'SKU-KEYBOARD-001', productName: 'Magic Keyboard with Touch ID', quantity: 300, unitPrice: 12900 },
  { sku: 'SKU-MONITOR-001', productName: 'Studio Display 27"', quantity: 75, unitPrice: 159900 },
  { sku: 'SKU-MONITOR-002', productName: 'Pro Display XDR 32"', quantity: 30, unitPrice: 499900 },
  { sku: 'SKU-HEADPHONES-001', productName: 'AirPods Max', quantity: 200, unitPrice: 54900 },
  { sku: 'SKU-HEADPHONES-002', productName: 'AirPods Pro 2nd Gen', quantity: 600, unitPrice: 24900 },
  { sku: 'SKU-PHONE-001', productName: 'iPhone 15 Pro', quantity: 150, unitPrice: 99900 },
  { sku: 'SKU-PHONE-002', productName: 'iPhone 15 Pro Max', quantity: 120, unitPrice: 119900 },
  { sku: 'SKU-TABLET-001', productName: 'iPad Pro 12.9"', quantity: 120, unitPrice: 109900 },
  { sku: 'SKU-WATCH-001', productName: 'Apple Watch Ultra 2', quantity: 80, unitPrice: 79900 },
  { sku: 'SKU-CHARGER-001', productName: 'MagSafe Charger', quantity: 1000, unitPrice: 3900 },
  { sku: 'SKU-CABLE-001', productName: 'USB-C to Lightning Cable 2m', quantity: 2000, unitPrice: 2900 },
];

async function seed(): Promise<void> {
  const pool = new Pool({
    host: process.env.INVENTORY_DB_HOST || 'localhost',
    port: parseInt(process.env.INVENTORY_DB_PORT || '5434', 10),
    user: process.env.INVENTORY_DB_USER || 'inventory_user',
    password: process.env.INVENTORY_DB_PASSWORD || 'inventory_pass',
    database: process.env.INVENTORY_DB_NAME || 'inventory_db',
  });

  const db = new Kysely<InventoryDatabase>({
    dialect: new PostgresDialect({ pool }),
  });

  console.log('Seeding inventory data...\n');

  let inserted = 0;
  let skipped = 0;

  for (const item of inventoryItems) {
    const result = await db
      .insertInto('inventory_items')
      .values({
        id: uuidv4(),
        sku: item.sku,
        product_name: item.productName,
        total_quantity: item.quantity,
        reserved_quantity: 0,
        unit_price: item.unitPrice,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict((oc) => oc.column('sku').doNothing())
      .executeTakeFirst();

    const rowsAffected = Number(result?.numInsertedOrUpdatedRows ?? 0);

    if (rowsAffected > 0) {
      console.log(`  [ADDED]   ${item.sku}: ${item.productName} (qty: ${item.quantity}, price: ${item.unitPrice})`);
      inserted++;
    } else {
      console.log(`  [EXISTS]  ${item.sku}: ${item.productName} -- skipped`);
      skipped++;
    }
  }

  await db.destroy();

  console.log(`\nSeed complete: ${inserted} inserted, ${skipped} already existed.`);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
