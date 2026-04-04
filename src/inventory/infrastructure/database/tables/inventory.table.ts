import { Generated } from 'kysely';
import { OutboxEventRow } from '@shared/infrastructure/kafka';

export interface InventoryItemTable {
  id: string;
  sku: string;
  product_name: string;
  total_quantity: number;
  reserved_quantity: number;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface ReservationTable {
  id: string;
  inventory_item_id: string;
  order_id: string;
  quantity: number;
  expires_at: Date;
  released: boolean;
  created_at: Generated<Date>;
}

export interface InventoryDatabase {
  inventory_items: InventoryItemTable;
  reservations: ReservationTable;
  outbox_events: OutboxEventRow;
}

export const KYSELY_INVENTORY_DB = Symbol('KYSELY_INVENTORY_DB');
