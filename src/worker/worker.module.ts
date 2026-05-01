import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KyselyModule } from '@shared/infrastructure/database/kysely.module';
import { KafkaModule } from '@shared/infrastructure/kafka/kafka.module';
import {
  kafkaConfig,
  orderDbConfig,
  paymentDbConfig,
  inventoryDbConfig,
  shippingDbConfig,
  notificationDbConfig,
  outboxConfig,
  DbConfig,
  KafkaConfig,
} from '@shared/config';

// Order domain
import { OrderDatabase } from '@order/infrastructure/database/tables/order.table';
import {
  KyselyOrderRepository,
  KYSELY_ORDER_DB,
} from '@order/infrastructure/database/repositories/order.repository';
import { ORDER_REPOSITORY } from '@order/domain';
import { EVENT_PUBLISHER } from '@shared/application';
import { OrderEventPublisher } from '@order/infrastructure/kafka/order-event-publisher';
import { INVENTORY_SERVICE_PORT } from '@order/application/ports/inventory-service.port';
import { PAYMENT_SERVICE_PORT } from '@order/application/ports/payment-service.port';
import { SHIPPING_SERVICE_PORT } from '@order/application/ports/shipping-service.port';
import { NOTIFICATION_SERVICE_PORT } from '@order/application/ports/notification-service.port';
import { InventoryServiceAdapter } from '@order/infrastructure/adapters/inventory-service.adapter';
import { PaymentServiceAdapter } from '@order/infrastructure/adapters/payment-service.adapter';
import { ShippingServiceAdapter } from '@order/infrastructure/adapters/shipping-service.adapter';
import { NotificationServiceAdapter } from '@order/infrastructure/adapters/notification-service.adapter';
import { OrderActivitiesImpl } from '@order/infrastructure/temporal/activities/order-activities.impl';

// Other service modules (for adapters)
import { PaymentModule } from '@payment/payment.module';
import { InventoryModule } from '@inventory/inventory.module';
import { ShippingModule } from '@shipping/shipping.module';
import { NotificationModule } from '@notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        kafkaConfig,
        orderDbConfig,
        paymentDbConfig,
        inventoryDbConfig,
        shippingDbConfig,
        notificationDbConfig,
        outboxConfig,
      ],
      envFilePath: '.env',
    }),

    KafkaModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...config.get<KafkaConfig>('kafka')!,
        clientId: 'distributed-order-worker',
      }),
    }),

    KyselyModule.forFeatureAsync<OrderDatabase>({
      token: KYSELY_ORDER_DB,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get<DbConfig>('orderDb')!,
    }),

    PaymentModule,
    InventoryModule,
    ShippingModule,
    NotificationModule,
  ],
  providers: [
    { provide: ORDER_REPOSITORY, useClass: KyselyOrderRepository },
    { provide: EVENT_PUBLISHER, useClass: OrderEventPublisher },
    { provide: INVENTORY_SERVICE_PORT, useClass: InventoryServiceAdapter },
    { provide: PAYMENT_SERVICE_PORT, useClass: PaymentServiceAdapter },
    { provide: SHIPPING_SERVICE_PORT, useClass: ShippingServiceAdapter },
    { provide: NOTIFICATION_SERVICE_PORT, useClass: NotificationServiceAdapter },
    OrderActivitiesImpl,
  ],
  exports: [OrderActivitiesImpl],
})
export class WorkerModule {}
