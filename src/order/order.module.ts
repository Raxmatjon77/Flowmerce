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
import {
  ORDER_WORKFLOW_ORCHESTRATOR,
  IOrderWorkflowOrchestrator,
} from './application/ports/workflow-orchestrator.port';
import { InventoryServiceAdapter } from './infrastructure/adapters/inventory-service.adapter';
import { PaymentServiceAdapter } from './infrastructure/adapters/payment-service.adapter';
import { ShippingServiceAdapter } from './infrastructure/adapters/shipping-service.adapter';
import { NotificationServiceAdapter } from './infrastructure/adapters/notification-service.adapter';
import { OrderWorkflowOrchestrator } from './infrastructure/temporal/orchestrator/order-workflow.orchestrator';
import { OrderActivitiesImpl } from './infrastructure/temporal/activities/order-activities.impl';
import { CreateOrderUseCase } from './application/use-cases/create-order/create-order.use-case';
import { GetOrderUseCase } from './application/use-cases/get-order/get-order.use-case';
import { ConfirmOrderUseCase } from './application/use-cases/confirm-order/confirm-order.use-case';
import { CancelOrderUseCase } from './application/use-cases/cancel-order/cancel-order.use-case';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status/update-order-status.use-case';
import { ListOrdersUseCase } from './application/use-cases/list-orders/list-orders.use-case';
import { ORDER_USE_CASE_TOKENS } from './application/injection-tokens';
import { OrderController } from './presentation/controllers/order.controller';
import { OrderEventConsumer } from './infrastructure/kafka/order-event-consumer';
import { OrderOutboxPollerService } from './infrastructure/kafka/order-outbox-poller.service';
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

    // Workflow orchestrator binding
    { provide: ORDER_WORKFLOW_ORCHESTRATOR, useClass: OrderWorkflowOrchestrator },

    // Port adapters
    { provide: INVENTORY_SERVICE_PORT, useClass: InventoryServiceAdapter },
    { provide: PAYMENT_SERVICE_PORT, useClass: PaymentServiceAdapter },
    { provide: SHIPPING_SERVICE_PORT, useClass: ShippingServiceAdapter },
    { provide: NOTIFICATION_SERVICE_PORT, useClass: NotificationServiceAdapter },

    // Use cases
    {
      provide: ORDER_USE_CASE_TOKENS.CREATE,
      useFactory: (
        orderRepository: IOrderRepository,
        eventPublisher: IEventPublisher,
        workflowOrchestrator: IOrderWorkflowOrchestrator,
      ) => new CreateOrderUseCase(orderRepository, eventPublisher, workflowOrchestrator),
      inject: [ORDER_REPOSITORY, EVENT_PUBLISHER, ORDER_WORKFLOW_ORCHESTRATOR],
    },
    {
      provide: ORDER_USE_CASE_TOKENS.GET,
      useFactory: (orderRepository: IOrderRepository) =>
        new GetOrderUseCase(orderRepository),
      inject: [ORDER_REPOSITORY],
    },
    {
      provide: ORDER_USE_CASE_TOKENS.CONFIRM,
      useFactory: (
        orderRepository: IOrderRepository,
        eventPublisher: IEventPublisher,
        workflowOrchestrator: IOrderWorkflowOrchestrator,
      ) => new ConfirmOrderUseCase(orderRepository, eventPublisher, workflowOrchestrator),
      inject: [ORDER_REPOSITORY, EVENT_PUBLISHER, ORDER_WORKFLOW_ORCHESTRATOR],
    },
    {
      provide: ORDER_USE_CASE_TOKENS.CANCEL,
      useFactory: (
        orderRepository: IOrderRepository,
        eventPublisher: IEventPublisher,
        workflowOrchestrator: IOrderWorkflowOrchestrator,
      ) => new CancelOrderUseCase(orderRepository, eventPublisher, workflowOrchestrator),
      inject: [ORDER_REPOSITORY, EVENT_PUBLISHER, ORDER_WORKFLOW_ORCHESTRATOR],
    },

    // Update order status use case (used by event consumer)
    {
      provide: ORDER_USE_CASE_TOKENS.UPDATE_STATUS,
      useFactory: (
        orderRepository: IOrderRepository,
        eventPublisher: IEventPublisher,
      ) => new UpdateOrderStatusUseCase(orderRepository, eventPublisher),
      inject: [ORDER_REPOSITORY, EVENT_PUBLISHER],
    },

    // List orders use case
    {
      provide: ORDER_USE_CASE_TOKENS.LIST,
      useFactory: (orderRepository: IOrderRepository) =>
        new ListOrdersUseCase(orderRepository),
      inject: [ORDER_REPOSITORY],
    },

    // Temporal activities
    OrderActivitiesImpl,

    // Kafka event consumer
    OrderEventConsumer,

    // Outbox publisher poller (publishes outbox_events -> Kafka)
    OrderOutboxPollerService,
  ],
  exports: [
    ORDER_REPOSITORY,
    ORDER_WORKFLOW_ORCHESTRATOR,
    ORDER_USE_CASE_TOKENS.CREATE,
    ORDER_USE_CASE_TOKENS.GET,
    ORDER_USE_CASE_TOKENS.CONFIRM,
    ORDER_USE_CASE_TOKENS.CANCEL,
    ORDER_USE_CASE_TOKENS.LIST,
  ],
})
export class OrderModule {}
