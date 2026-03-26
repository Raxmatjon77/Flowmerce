import { Module } from '@nestjs/common';
import { KyselyModule } from '@shared/infrastructure/database/kysely.module';
import { OrderDatabase } from './infrastructure/database/tables/order.table';
import {
  KyselyOrderRepository,
  KYSELY_ORDER_DB,
} from './infrastructure/database/repositories/order.repository';
import { ORDER_REPOSITORY, IOrderRepository } from '@order/domain';
import { EVENT_PUBLISHER, IEventPublisher } from '@shared/application';
import { OrderEventPublisher } from './infrastructure/kafka/order-event-publisher';
import {
  INVENTORY_SERVICE_PORT,
} from './application/ports/inventory-service.port';
import {
  PAYMENT_SERVICE_PORT,
} from './application/ports/payment-service.port';
import {
  SHIPPING_SERVICE_PORT,
} from './application/ports/shipping-service.port';
import {
  NOTIFICATION_SERVICE_PORT,
} from './application/ports/notification-service.port';
import { InventoryServiceAdapter } from './infrastructure/adapters/inventory-service.adapter';
import { PaymentServiceAdapter } from './infrastructure/adapters/payment-service.adapter';
import { ShippingServiceAdapter } from './infrastructure/adapters/shipping-service.adapter';
import { NotificationServiceAdapter } from './infrastructure/adapters/notification-service.adapter';
import { OrderActivitiesImpl } from './infrastructure/temporal/activities/order.activities';
import { CreateOrderUseCase } from './application/use-cases/create-order/create-order.use-case';
import { GetOrderUseCase } from './application/use-cases/get-order/get-order.use-case';
import { ConfirmOrderUseCase } from './application/use-cases/confirm-order/confirm-order.use-case';
import { CancelOrderUseCase } from './application/use-cases/cancel-order/cancel-order.use-case';
import { OrderController } from './presentation/controllers/order.controller';
import { PaymentModule } from '@payment/payment.module';
import { InventoryModule } from '@inventory/inventory.module';
import { ShippingModule } from '@shipping/shipping.module';
import { NotificationModule } from '@notification/notification.module';

@Module({
  imports: [
    KyselyModule.forFeature<OrderDatabase>({
      host: process.env.ORDER_DB_HOST || 'localhost',
      port: parseInt(process.env.ORDER_DB_PORT || '5432', 10),
      user: process.env.ORDER_DB_USER || 'order_user',
      password: process.env.ORDER_DB_PASSWORD || 'order_pass',
      database: process.env.ORDER_DB_NAME || 'order_db',
      token: KYSELY_ORDER_DB,
    }),
    // Import other service modules — adapters depend on their exported use cases
    PaymentModule,
    InventoryModule,
    ShippingModule,
    NotificationModule,
  ],
  controllers: [OrderController],
  providers: [
    // Repository binding
    { provide: ORDER_REPOSITORY, useClass: KyselyOrderRepository },

    // Event publisher binding
    { provide: EVENT_PUBLISHER, useClass: OrderEventPublisher },

    // Port adapters
    { provide: INVENTORY_SERVICE_PORT, useClass: InventoryServiceAdapter },
    { provide: PAYMENT_SERVICE_PORT, useClass: PaymentServiceAdapter },
    { provide: SHIPPING_SERVICE_PORT, useClass: ShippingServiceAdapter },
    { provide: NOTIFICATION_SERVICE_PORT, useClass: NotificationServiceAdapter },

    // Use cases (factory providers — use cases have no @Injectable decorator)
    {
      provide: 'CreateOrderUseCase',
      useFactory: (
        orderRepository: IOrderRepository,
        eventPublisher: IEventPublisher,
      ) => new CreateOrderUseCase(orderRepository, eventPublisher),
      inject: [ORDER_REPOSITORY, EVENT_PUBLISHER],
    },
    {
      provide: 'GetOrderUseCase',
      useFactory: (orderRepository: IOrderRepository) =>
        new GetOrderUseCase(orderRepository),
      inject: [ORDER_REPOSITORY],
    },
    {
      provide: 'ConfirmOrderUseCase',
      useFactory: (
        orderRepository: IOrderRepository,
        eventPublisher: IEventPublisher,
      ) => new ConfirmOrderUseCase(orderRepository, eventPublisher),
      inject: [ORDER_REPOSITORY, EVENT_PUBLISHER],
    },
    {
      provide: 'CancelOrderUseCase',
      useFactory: (
        orderRepository: IOrderRepository,
        eventPublisher: IEventPublisher,
      ) => new CancelOrderUseCase(orderRepository, eventPublisher),
      inject: [ORDER_REPOSITORY, EVENT_PUBLISHER],
    },

    // Temporal activities
    OrderActivitiesImpl,
  ],
  exports: [
    ORDER_REPOSITORY,
    'CreateOrderUseCase',
    'GetOrderUseCase',
    'ConfirmOrderUseCase',
    'CancelOrderUseCase',
  ],
})
export class OrderModule {}
