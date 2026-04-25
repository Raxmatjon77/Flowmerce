import { Generated } from 'kysely';

export interface CustomerTable {
  id: string;
  user_id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface CustomerDatabase {
  customers: CustomerTable;
}

export const KYSELY_CUSTOMER_DB = Symbol('KYSELY_CUSTOMER_DB');
