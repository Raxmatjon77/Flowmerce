import { Generated } from 'kysely';
import { OutboxEventRow } from '@shared/infrastructure/kafka';

export interface ShipmentTable {
  id: string;
  order_id: string;
  tracking_number: string | null;
  carrier_name: string | null;
  carrier_code: string | null;
  status: string;
  shipping_street: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country: string;
  estimated_delivery: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface ShippingDatabase {
  shipments: ShipmentTable;
  outbox_events: OutboxEventRow;
}

export const KYSELY_SHIPPING_DB = Symbol('KYSELY_SHIPPING_DB');
