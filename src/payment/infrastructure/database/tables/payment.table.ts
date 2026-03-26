import { Generated } from 'kysely';

export interface PaymentTable {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method_type: string;
  method_last4: string;
  method_expiry_month: number;
  method_expiry_year: number;
  transaction_id: string | null;
  failure_reason: string | null;
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

export interface PaymentDatabase {
  payments: PaymentTable;
  outbox_events: OutboxEventTable;
}
