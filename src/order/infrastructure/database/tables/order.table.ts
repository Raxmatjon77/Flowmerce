import { Generated } from 'kysely';

export interface OrderTable {
  id: string;
  customer_id: string;
  status: string;
  total_amount: number;
  currency: string;
  shipping_street: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip_code: string;
  shipping_country: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface OrderItemTable {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  currency: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface OutboxEventTable {
  id: string;
  aggregate_id: string;
  event_type: string;
  topic: string;
  payload: string;
  published: Generated<boolean>;
  created_at: Generated<Date>;
}

export interface OrderDatabase {
  orders: OrderTable;
  order_items: OrderItemTable;
  outbox_events: OutboxEventTable;
}
