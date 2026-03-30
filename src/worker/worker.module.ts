import { Module } from '@nestjs/common';
import { KyselyModule } from '@shared/infrastructure/database/kysely.module';
import { KafkaModule } from '@shared/infrastructure/kafka/kafka.module';

// Order domain
import { OrderDatabase } from '@order/infrastructure/database/tables/order.table';
import {
  KyselyOrderRepository,
  KYSELY_ORDER_DB,
} from '@order/infrastructure/database/repositories/order.repository';
import { ORDER_REPOSITORY } from '@order/domain';
import { EVENT_PUBLISHER } from '@shared/application';
import { OrderEventPublisher } from '@order/infrastructure/kafka/order-event-publisher';
import {
  INVENTORY_SERVICE_PORT,
} from '@order/application/ports/inventory-service.port';
import {
  PAYMENT_SERVICE_PORT,
} from '@order/application/ports/payment-service.port';
import {
  SHIPPING_SERVICE_PORT,
} from '@order/application/ports/shipping-service.port';
import {
  NOTIFICATION_SERVICE_PORT,
} from '@order/application/ports/notification-service.port';
import { InventoryServiceAdapter } from '@order/infrastructure/adapters/inventory-service.adapter';
import { PaymentServiceAdapter } from '@order/infrastructure/adapters/payment-service.adapter';
import { ShippingServiceAdapter } from '@order/infrastructure/adapters/shipping-service.adapter';
import { NotificationServiceAdapter } from '@order/infrastructure/adapters/notification-service.adapter';
import { OrderActivitiesImpl } from '@order/infrastructure/temporal/activities/order.activities';

// Other service modules (for adapters)
import { PaymentModule } from '@payment/payment.module';
import { InventoryModule } from '@inventory/inventory.module';
import { ShippingModule } from '@shipping/shipping.module';
import { NotificationModule } from '@notification/notification.module';

/**
 * WorkerModule - Minimal NestJS module for Temporal worker
 * 
 * This module only includes dependencies needed for activity execution.
 * It doesn't include HTTP controllers or other API-related components.
 */
@Module({
  imports: [
    // Kafka for event publishing
    KafkaModule.forRoot({
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      clientId: process.env.KAFKA_CLIENT_ID || 'distributed-order-worker',
    }),

    // Order database
    KyselyModule.forFeature<OrderDatabase>({
      host: process.env.ORDER_DB_HOST || 'localhost',
      port: parseInt(process.env.ORDER_DB_PORT || '5432', 10),
      user: process.env.ORDER_DB_USER || 'order_user',
      password: process.env.ORDER_DB_PASSWORD || 'order_pass',
      database: process.env.ORDER_DB_NAME || 'order_db',
      token: KYSELY_ORDER_DB,
    }),

    // Other service modules
    PaymentModule,
    InventoryModule,
    ShippingModule,
    NotificationModule,
  ],
  providers: [
    // Repository
    { provide: ORDER_REPOSITORY, useClass: KyselyOrderRepository },

    // Event publisher
    { provide: EVENT_PUBLISHER, useClass: OrderEventPublisher },

    // Port adapters
    { provide: INVENTORY_SERVICE_PORT, useClass: InventoryServiceAdapter },
    { provide: PAYMENT_SERVICE_PORT, useClass: PaymentServiceAdapter },
    { provide: SHIPPING_SERVICE_PORT, useClass: ShippingServiceAdapter },
    { provide: NOTIFICATION_SERVICE_PORT, useClass: NotificationServiceAdapter },

    // Activities implementation
    OrderActivitiesImpl,
  ],
  exports: [OrderActivitiesImpl],
})
export class WorkerModule {}
