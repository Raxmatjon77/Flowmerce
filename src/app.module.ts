import { Module } from '@nestjs/common';
import { KafkaModule } from '@shared/infrastructure/kafka/kafka.module';
import { TemporalModule } from '@shared/infrastructure/temporal/temporal.module';
import { IdempotencyModule } from '@shared/infrastructure/idempotency';
import { AuthModule } from '@shared/infrastructure/auth';
import { HealthModule } from './health/health.module';
import { OrderModule } from '@order/order.module';
import { PaymentModule } from '@payment/payment.module';
import { InventoryModule } from '@inventory/inventory.module';
import { ShippingModule } from '@shipping/shipping.module';
import { NotificationModule } from '@notification/notification.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    // Authentication & Authorization (global guards)
    AuthModule,

    // Health checks (no dependencies, loads first)
    HealthModule,

    // Idempotency (global module)
    IdempotencyModule,

    // Global infrastructure modules
    KafkaModule.forRoot({
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      clientId: process.env.KAFKA_CLIENT_ID || 'distributed-order-platform',
    }),

    // Temporal is async — uses forRoot which returns a Promise<DynamicModule>
    TemporalModule.forRoot({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
      namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    }),

    // Feature modules
    OrderModule,
    PaymentModule,
    InventoryModule,
    ShippingModule,
    NotificationModule,
    DashboardModule,
  ],
})
export class AppModule {}
