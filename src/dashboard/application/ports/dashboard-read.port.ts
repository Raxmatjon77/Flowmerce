export const DASHBOARD_READ_PORT = Symbol('DASHBOARD_READ_PORT');

export interface DashboardOrderRecord {
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
  created_at: Date;
  updated_at: Date;
}

export interface DashboardOrderItemRecord {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface DashboardInventoryRecord {
  id: string;
  sku: string;
  product_name: string;
  total_quantity: number;
  reserved_quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface DashboardPaymentRecord {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method_type: string;
  method_last4: string | null;
  transaction_id: string | null;
  failure_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DashboardShipmentRecord {
  id: string;
  order_id: string;
  tracking_number: string | null;
  carrier_name: string | null;
  status: string;
  shipping_street: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country: string;
  estimated_delivery: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface DashboardNotificationRecord {
  id: string;
  recipient_id: string;
  channel: string;
  type: string;
  status: string;
  subject: string;
  body: string;
  failure_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface IDashboardReadPort {
  getOrders(): Promise<DashboardOrderRecord[]>;
  getOrderItems(): Promise<DashboardOrderItemRecord[]>;
  findOrderById(orderId: string): Promise<DashboardOrderRecord | null>;
  findOrderItemsByOrderId(orderId: string): Promise<DashboardOrderItemRecord[]>;
  getInventoryItems(): Promise<DashboardInventoryRecord[]>;
  getPayments(): Promise<DashboardPaymentRecord[]>;
  findPaymentByOrderId(orderId: string): Promise<DashboardPaymentRecord | null>;
  getShipments(): Promise<DashboardShipmentRecord[]>;
  findShipmentByOrderId(orderId: string): Promise<DashboardShipmentRecord | null>;
  getNotifications(): Promise<DashboardNotificationRecord[]>;
}
