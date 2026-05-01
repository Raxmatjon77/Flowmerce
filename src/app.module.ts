import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  appConfig,
  jwtConfig,
  kafkaConfig,
  temporalConfig,
  outboxConfig,
  idempotencyConfig,
  orderDbConfig,
  paymentDbConfig,
  inventoryDbConfig,
  shippingDbConfig,
  notificationDbConfig,
  customerDbConfig,
} from '@shared/config';
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
import { KafkaConfig } from '@shared/config/kafka.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        jwtConfig,
        kafkaConfig,
        temporalConfig,
        outboxConfig,
        idempotencyConfig,
        orderDbConfig,
        paymentDbConfig,
        inventoryDbConfig,
        shippingDbConfig,
        notificationDbConfig,
        customerDbConfig,
      ],
      envFilePath: '.env',
    }),

    AuthModule,
    HealthModule,
    IdempotencyModule,

    KafkaModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get<KafkaConfig>('kafka')!,
    }),

    TemporalModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        address: config.get<string>('temporal.address')!,
        namespace: config.get<string>('temporal.namespace')!,
      }),
    }),

    OrderModule,
    PaymentModule,
    InventoryModule,
    ShippingModule,
    NotificationModule,
    DashboardModule,
  ],
})
export class AppModule {}
