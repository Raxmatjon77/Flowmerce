import { registerAs } from '@nestjs/config';

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export const orderDbConfig = registerAs('orderDb', (): DbConfig => ({
  host: process.env.ORDER_DB_HOST ?? 'localhost',
  port: parseInt(process.env.ORDER_DB_PORT ?? '5432', 10),
  user: process.env.ORDER_DB_USER ?? 'order_user',
  password: process.env.ORDER_DB_PASSWORD ?? 'order_pass',
  database: process.env.ORDER_DB_NAME ?? 'order_db',
}));

export const paymentDbConfig = registerAs('paymentDb', (): DbConfig => ({
  host: process.env.PAYMENT_DB_HOST ?? 'localhost',
  port: parseInt(process.env.PAYMENT_DB_PORT ?? '5433', 10),
  user: process.env.PAYMENT_DB_USER ?? 'payment_user',
  password: process.env.PAYMENT_DB_PASSWORD ?? 'payment_pass',
  database: process.env.PAYMENT_DB_NAME ?? 'payment_db',
}));

export const inventoryDbConfig = registerAs('inventoryDb', (): DbConfig => ({
  host: process.env.INVENTORY_DB_HOST ?? 'localhost',
  port: parseInt(process.env.INVENTORY_DB_PORT ?? '5434', 10),
  user: process.env.INVENTORY_DB_USER ?? 'inventory_user',
  password: process.env.INVENTORY_DB_PASSWORD ?? 'inventory_pass',
  database: process.env.INVENTORY_DB_NAME ?? 'inventory_db',
}));

export const shippingDbConfig = registerAs('shippingDb', (): DbConfig => ({
  host: process.env.SHIPPING_DB_HOST ?? 'localhost',
  port: parseInt(process.env.SHIPPING_DB_PORT ?? '5435', 10),
  user: process.env.SHIPPING_DB_USER ?? 'shipping_user',
  password: process.env.SHIPPING_DB_PASSWORD ?? 'shipping_pass',
  database: process.env.SHIPPING_DB_NAME ?? 'shipping_db',
}));

export const notificationDbConfig = registerAs('notificationDb', (): DbConfig => ({
  host: process.env.NOTIFICATION_DB_HOST ?? 'localhost',
  port: parseInt(process.env.NOTIFICATION_DB_PORT ?? '5436', 10),
  user: process.env.NOTIFICATION_DB_USER ?? 'notification_user',
  password: process.env.NOTIFICATION_DB_PASSWORD ?? 'notification_pass',
  database: process.env.NOTIFICATION_DB_NAME ?? 'notification_db',
}));

export const customerDbConfig = registerAs('customerDb', (): DbConfig => ({
  host: process.env.CUSTOMER_DB_HOST ?? 'localhost',
  port: parseInt(process.env.CUSTOMER_DB_PORT ?? '5438', 10),
  user: process.env.CUSTOMER_DB_USER ?? 'customer_user',
  password: process.env.CUSTOMER_DB_PASSWORD ?? 'customer_pass',
  database: process.env.CUSTOMER_DB_NAME ?? 'customer_db',
}));
