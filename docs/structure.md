# Project Structure & Architecture

## 1. Project Overview

**Flowmerce** is a Distributed Order & Fulfillment Platform built with strict Clean Architecture principles and Domain-Driven Design.

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | NestJS (TypeScript) |
| Workflow Engine | Temporal |
| Message Broker | Apache Kafka |
| Database | PostgreSQL (one per service) |
| Query Builder | Kysely (type-safe, no ORM) |
| Architecture | Clean Architecture + DDD |

### Services

The platform consists of 5 bounded contexts, each with its own database:

- **Order Service** — order lifecycle management, workflow orchestration
- **Payment Service** — payment processing, refunds
- **Inventory Service** — stock management, reservations
- **Shipping Service** — shipment creation, carrier tracking
- **Notification Service** — email/SMS/push notifications

---

## 2. Architecture

### Clean Architecture Layers

```
┌─────────────────────────────────────────────┐
│             Presentation Layer              │
│   Controllers, Request DTOs, Validation     │
├─────────────────────────────────────────────┤
│             Application Layer               │
│   Use Cases, DTOs, Ports (interfaces)       │
├─────────────────────────────────────────────┤
│              Domain Layer                   │
│   Entities, Value Objects, Domain Events    │
│   Repository Interfaces, Domain Errors      │
├─────────────────────────────────────────────┤
│           Infrastructure Layer              │
│   Repositories (Kysely), Kafka, Temporal    │
│   Adapters, External Integrations           │
└─────────────────────────────────────────────┘
```

### Dependency Direction

Dependencies flow **inward** — outer layers depend on inner layers, never the reverse:

```
Infrastructure → Application → Domain
Presentation  → Application → Domain
```

- **Domain** has zero framework dependencies (no NestJS, no Kafka, no Temporal)
- **Application** defines interfaces (ports) that Infrastructure implements
- **Infrastructure** contains all framework-specific code
- **Presentation** is a thin HTTP adapter that delegates to use cases

---

## 3. Folder Structure

Each service follows the same layout:

```
src/
├── main.ts                          # HTTP server entry point
├── app.module.ts                    # Root NestJS module
│
├── shared/                          # Cross-cutting concerns
│   ├── domain/
│   │   ├── aggregate-root.base.ts   # Base class with domain event tracking
│   │   ├── entity.base.ts           # Base entity with id, timestamps
│   │   ├── value-object.base.ts     # Immutable value object base
│   │   ├── domain-event.base.ts     # Event base (eventId, eventType, aggregateId)
│   │   └── result.ts                # Result<T, E> monad for error handling
│   ├── application/
│   │   ├── use-case.interface.ts    # IUseCase<TInput, TOutput>
│   │   └── event-publisher.interface.ts  # IEventPublisher
│   └── infrastructure/
│       ├── database/
│       │   └── kysely.module.ts     # Dynamic Kysely connection factory
│       ├── kafka/
│       │   ├── kafka.constants.ts   # Topics, event types, consumer groups
│       │   ├── kafka.module.ts      # Global Kafka client singleton
│       │   ├── kafka-producer.service.ts
│       │   ├── kafka-consumer.service.ts
│       │   ├── base-event-consumer.ts    # Shared consumer boilerplate
│       │   └── outbox/
│       │       └── outbox-publisher.service.ts  # Outbox pattern poller
│       ├── temporal/
│       │   ├── temporal.module.ts   # Global Temporal client
│       │   └── temporal.constants.ts # Task queues, workflow IDs
│       └── idempotency/
│           ├── idempotency.service.ts
│           ├── idempotency.guard.ts
│           ├── idempotency.interceptor.ts
│           └── idempotent.decorator.ts
│
├── order/                           # Order bounded context
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── order.entity.ts      # Aggregate root with state machine
│   │   │   └── order-item.entity.ts
│   │   ├── value-objects/
│   │   │   ├── order-status.value-object.ts  # 7-state enum + transitions
│   │   │   ├── money.value-object.ts
│   │   │   └── shipping-address.value-object.ts
│   │   ├── repositories/
│   │   │   └── order.repository.interface.ts
│   │   ├── events/                  # Domain events
│   │   │   ├── order-created.event.ts
│   │   │   ├── order-confirmed.event.ts
│   │   │   ├── order-cancelled.event.ts
│   │   │   └── ...
│   │   └── errors/
│   │       └── order-domain.errors.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── create-order/create-order.use-case.ts
│   │   │   ├── get-order/get-order.use-case.ts
│   │   │   ├── confirm-order/confirm-order.use-case.ts
│   │   │   ├── cancel-order/cancel-order.use-case.ts
│   │   │   └── update-order-status/update-order-status.use-case.ts
│   │   ├── dtos/
│   │   ├── ports/                   # Interfaces for external services
│   │   │   ├── inventory-service.port.ts
│   │   │   ├── payment-service.port.ts
│   │   │   ├── shipping-service.port.ts
│   │   │   ├── notification-service.port.ts
│   │   │   └── workflow-orchestrator.port.ts
│   │   └── injection-tokens.ts      # DI token constants
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── tables/order.table.ts
│   │   │   ├── migrations/001_create_orders.ts
│   │   │   ├── repositories/order.repository.ts
│   │   │   └── mappers/order.mapper.ts
│   │   ├── temporal/
│   │   │   ├── workflows/order-processing.workflow.ts
│   │   │   ├── activities/order.activities.ts
│   │   │   └── order-workflow-orchestrator.ts
│   │   ├── kafka/
│   │   │   ├── order-event-publisher.ts
│   │   │   └── order-event-consumer.ts
│   │   ├── adapters/                # Port implementations
│   │   │   ├── inventory-service.adapter.ts
│   │   │   ├── payment-service.adapter.ts
│   │   │   ├── shipping-service.adapter.ts
│   │   │   └── notification-service.adapter.ts
│   │   └── order.module.ts          # NestJS module wiring
│   └── presentation/
│       ├── controllers/order.controller.ts
│       └── dto/create-order.request.ts
│
├── payment/                         # Same structure as order/
├── inventory/
├── shipping/
├── notification/
│
├── health/                          # Health check module
│   ├── presentation/controllers/health.controller.ts
│   └── infrastructure/indicators/
│       ├── database.health.ts
│       ├── kafka.health.ts
│       └── temporal.health.ts
│
└── worker/                          # Temporal worker process
    ├── worker.ts                    # Entry point (no HTTP)
    └── worker.module.ts             # Minimal NestJS context
```

---

## 4. Domain Layer

The domain layer contains pure business logic with zero framework dependencies.

### Base Classes

**AggregateRoot** (`shared/domain/aggregate-root.base.ts`)
- Extends `Entity` with domain event tracking
- `addDomainEvent(event)` — records an event during a state change
- `clearDomainEvents()` — returns all pending events and clears the list (used after persistence)

**Entity** (`shared/domain/entity.base.ts`)
- Provides `id`, `createdAt`, `updatedAt`
- Equality by identity (`equals()`)

**ValueObject** (`shared/domain/value-object.base.ts`)
- Immutable (props frozen on construction)
- Equality by value (deep comparison)

**DomainEvent** (`shared/domain/domain-event.base.ts`)
- Every event has: `eventId` (UUID), `eventType`, `aggregateId`, `occurredOn`
- Must implement `toPrimitives()` for serialization

### Order Entity (Example Aggregate)

The `Order` entity demonstrates the domain modeling pattern:

```typescript
// Factory method — all validation happens here
const order = Order.create({
  id: orderId,
  customerId,
  items,               // OrderItem[] value objects
  shippingAddress,     // ShippingAddress value object
  totalAmount,         // Money value object
});
// → Adds OrderCreatedEvent to domain events

// State transitions — each validates the transition and emits an event
order.reserveInventory();   // PENDING → INVENTORY_RESERVED
order.processPayment();     // INVENTORY_RESERVED → PAYMENT_PROCESSED
order.confirm();            // PAYMENT_PROCESSED → CONFIRMED
order.ship();               // CONFIRMED → SHIPPED
order.deliver();            // SHIPPED → DELIVERED
order.cancel();             // Most states → CANCELLED
```

**State Machine** (`OrderStatus` value object):

```
PENDING → INVENTORY_RESERVED → PAYMENT_PROCESSED → CONFIRMED → SHIPPED → DELIVERED
   ↓              ↓
CANCELLED      CANCELLED
```

Invalid transitions throw `InvalidOrderTransitionError`.

---

## 5. Application Layer

### Use Case Pattern

Every use case implements `IUseCase<TInput, TOutput>` with a single `execute()` method:

```typescript
export class CreateOrderUseCase implements IUseCase<CreateOrderDto, OrderResponseDto> {
  constructor(
    private readonly orderRepository: IOrderRepository,     // Domain interface
    private readonly eventPublisher: IEventPublisher,       // Domain interface
    private readonly workflowOrchestrator: IOrderWorkflowOrchestrator, // Port
  ) {}

  async execute(input: CreateOrderDto): Promise<OrderResponseDto> {
    // 1. Create domain entity (validation + events)
    const order = Order.create({ ... });

    // 2. Persist
    await this.orderRepository.save(order);

    // 3. Publish domain events (via outbox)
    await this.eventPublisher.publishAll(order.clearDomainEvents());

    // 4. Start workflow
    await this.workflowOrchestrator.startOrderProcessing({ ... });

    // 5. Return DTO
    return OrderResponseDto.fromDomain(order);
  }
}
```

### Ports (Interfaces)

Ports define what the application layer needs from external systems without knowing implementations:

```typescript
// Application layer defines the contract
interface IInventoryServicePort {
  reserveInventory(orderId: string, items: InventoryReservationItem[]): Promise<void>;
  releaseInventory(orderId: string, items: InventoryReservationItem[]): Promise<void>;
}

// Infrastructure layer implements it
class InventoryServiceAdapter implements IInventoryServicePort {
  constructor(private readonly reserveUseCase: ReserveInventoryUseCase) {}
  async reserveInventory(orderId, items) {
    await this.reserveUseCase.execute({ orderId, items });
  }
}
```

### Injection Tokens

All DI tokens are defined as constants per service (never inline strings):

```typescript
// src/order/application/injection-tokens.ts
export const ORDER_USE_CASE_TOKENS = {
  CREATE: 'CreateOrderUseCase',
  GET: 'GetOrderUseCase',
  CONFIRM: 'ConfirmOrderUseCase',
  CANCEL: 'CancelOrderUseCase',
  UPDATE_STATUS: 'UpdateOrderStatusUseCase',
} as const;
```

---

## 6. Infrastructure Layer

### Kysely Repositories

Repositories implement domain interfaces using type-safe Kysely queries:

```typescript
class KyselyOrderRepository implements IOrderRepository {
  constructor(@Inject(KYSELY_ORDER_DB) private readonly db: Kysely<OrderDatabase>) {}

  async findById(id: string): Promise<Order | null> {
    const row = await this.db
      .selectFrom('orders')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst();
    return row ? OrderMapper.toDomain(row) : null;
  }

  async save(order: Order): Promise<void> {
    // Insert or update with explicit Kysely queries
  }
}
```

### Kafka Event Publisher (Outbox Pattern)

Events are **never published directly** to Kafka. Instead:

1. The event publisher inserts events into the `outbox_events` table in the same DB transaction as the entity change
2. The `OutboxPublisherService` polls the outbox table and publishes to Kafka
3. After successful Kafka send, the event is marked as published

```
Use Case → Repository.save(entity)
        → EventPublisher.publishAll(events) → INSERT INTO outbox_events
                                                      ↓
                                           OutboxPublisherService (polling)
                                                      ↓
                                              KafkaProducerService.send()
```

This guarantees at-least-once delivery even if the app crashes after persisting.

### Kafka Consumers (BaseEventConsumer)

All consumers extend `BaseEventConsumer` which provides:

- **Idempotency** — deduplication by eventId via IdempotencyService
- **Declarative subscriptions** — `subscribe({ topic, groupId, handlers })`
- **Automatic DLQ** — dead letter topic derived from base topic
- **Logging** — structured event processing logs

```typescript
class OrderEventConsumer extends BaseEventConsumer {
  protected readonly consumerPrefix = IDEMPOTENCY_PREFIXES.ORDER_CONSUMER;

  async onModuleInit() {
    await this.subscribe({
      topic: KAFKA_TOPICS.PAYMENT_EVENTS,
      groupId: CONSUMER_GROUPS.ORDER_PAYMENT,
      handlers: [
        {
          eventType: PaymentEventType.PROCESSED,
          handle: async (value) => {
            await this.updateOrderStatusUseCase.execute({ ... });
          },
        },
      ],
    });
  }
}
```

### Temporal Workflow Orchestrator

The orchestrator is an infrastructure adapter implementing the `IOrderWorkflowOrchestrator` port:

```typescript
class OrderWorkflowOrchestrator implements IOrderWorkflowOrchestrator {
  async startOrderProcessing(input) {
    await this.temporalClient.workflow.start(orderProcessingWorkflow, {
      workflowId: `${TEMPORAL_WORKFLOW_ID_PREFIX.ORDER}${input.orderId}`,
      taskQueue: TEMPORAL_TASK_QUEUES.ORDER_PROCESSING,
      args: [input],
    });
  }

  async confirmOrder(orderId) {
    const handle = this.temporalClient.workflow.getHandle(workflowId);
    await handle.signal(confirmOrderSignal);
  }
}
```

### Service Adapters

Adapters bridge between services. The Order service calls other services through adapter classes that implement port interfaces:

```
OrderModule
  ├── InventoryServiceAdapter  → calls ReserveInventoryUseCase (from InventoryModule)
  ├── PaymentServiceAdapter    → calls ProcessPaymentUseCase (from PaymentModule)
  ├── ShippingServiceAdapter   → calls CreateShipmentUseCase (from ShippingModule)
  └── NotificationServiceAdapter → calls SendNotificationUseCase (from NotificationModule)
```

---

## 7. Presentation Layer

Controllers are **thin HTTP adapters**. They handle only:
- Route decorators and HTTP status codes
- Parameter extraction (`@Body`, `@Param`, `@Query`)
- Validation (via `class-validator` decorators on request DTOs)
- Delegating to a use case and returning the result

```typescript
@Controller('api/v1/orders')
export class OrderController {
  constructor(
    @Inject(ORDER_USE_CASE_TOKENS.CREATE)
    private readonly createOrderUseCase: CreateOrderUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Idempotent()
  @UseGuards(IdempotencyGuard)
  @UseInterceptors(IdempotencyInterceptor)
  async createOrder(@Body() request: CreateOrderRequest): Promise<OrderResponseDto> {
    return this.createOrderUseCase.execute({
      customerId: request.customerId,
      items: request.items,
      shippingAddress: request.shippingAddress,
    });
  }
}
```

### REST Endpoints

| Service | Method | Endpoint | Description |
|---------|--------|----------|-------------|
| Order | POST | `/api/v1/orders` | Create order (idempotent) |
| Order | GET | `/api/v1/orders/:id` | Get order by ID |
| Order | POST | `/api/v1/orders/:id/confirm` | Send confirmation signal |
| Order | POST | `/api/v1/orders/:id/cancel` | Cancel order |
| Payment | POST | `/api/v1/payments` | Process payment |
| Payment | GET | `/api/v1/payments/:id` | Get payment by ID |
| Payment | POST | `/api/v1/payments/:id/refund` | Refund payment |
| Inventory | GET | `/api/v1/inventory/:id` | Get item by ID |
| Inventory | GET | `/api/v1/inventory/sku/:sku` | Get item by SKU |
| Inventory | POST | `/api/v1/inventory/reserve` | Reserve inventory |
| Inventory | POST | `/api/v1/inventory/release` | Release reservation |
| Shipping | POST | `/api/v1/shipments` | Create shipment |
| Shipping | GET | `/api/v1/shipments/:id` | Get shipment |
| Shipping | PATCH | `/api/v1/shipments/:id/status` | Update status |
| Notification | POST | `/api/v1/notifications` | Send notification |
| Notification | GET | `/api/v1/notifications?recipientId=` | List by recipient |
| Health | GET | `/health` | Full health check |
| Health | GET | `/health/live` | Liveness probe |
| Health | GET | `/health/ready` | Readiness probe |

### Idempotency

The Order creation endpoint supports idempotency via the `Idempotency-Key` header:

1. `IdempotencyGuard` checks if the key has been seen before
2. If cached, returns the stored response immediately
3. If new, `IdempotencyInterceptor` caches the response after execution
4. Cache TTL: 24 hours

---

## 8. Request Flow (End-to-End)

### Creating an Order — Full Trace

```
Client
  │
  ▼
POST /api/v1/orders
  Headers: { Idempotency-Key: "uuid-123" }
  Body: { customerId, items[], shippingAddress }
  │
  ▼
OrderController.createOrder()
  │  @Idempotent() → IdempotencyGuard → IdempotencyInterceptor
  │
  ▼
CreateOrderUseCase.execute()
  │
  ├── 1. Order.create(props)                    [Domain Layer]
  │     → Validates customerId, items
  │     → Calculates totalAmount
  │     → Adds OrderCreatedEvent
  │
  ├── 2. orderRepository.save(order)            [Infrastructure Layer]
  │     → INSERT INTO orders + order_items
  │
  ├── 3. eventPublisher.publishAll(events)      [Infrastructure Layer]
  │     → INSERT INTO outbox_events (same DB)
  │
  └── 4. workflowOrchestrator.startOrderProcessing()
        → Temporal client starts orderProcessingWorkflow
  │
  ▼
Returns OrderResponseDto (201 Created)
```

### Temporal Workflow Execution (async, in worker process)

```
orderProcessingWorkflow(input)
  │
  ├── Step 1: activities.reserveInventory(orderId, items)
  │     → InventoryServiceAdapter → ReserveInventoryUseCase
  │     → Push compensation: releaseInventory()
  │     → activities.updateOrderStatus(orderId, INVENTORY_RESERVED)
  │
  ├── Step 2: activities.processPayment(orderId, amount, method)
  │     → PaymentServiceAdapter → ProcessPaymentUseCase
  │     → Push compensation: refundPayment(paymentId)
  │     → activities.updateOrderStatus(orderId, PAYMENT_PROCESSED)
  │
  ├── Step 3: Wait for confirmation signal (24h timeout)
  │     → Client calls POST /orders/:id/confirm
  │     → ConfirmOrderUseCase sends Temporal signal
  │     → activities.confirmOrder(orderId)
  │
  ├── Step 4: activities.createShipment(orderId, address)
  │     → ShippingServiceAdapter → CreateShipmentUseCase
  │     → activities.updateOrderStatus(orderId, SHIPPED)
  │
  └── Step 5: activities.notifyUser(customerId, ORDER_CONFIRMED)
        → NotificationServiceAdapter → SendNotificationUseCase
```

### Failure & Compensation (Saga Pattern)

If any step fails, compensations execute in LIFO order:

```
Step 2 fails (payment)
  │
  ├── compensation[1]: refundPayment(paymentId)     ← skipped (payment failed)
  ├── compensation[0]: releaseInventory(orderId)    ← executed
  ├── cancelOrder(orderId)                          ← mark order cancelled
  └── notifyUser(customerId, ORDER_CANCELLED)       ← inform user
```

---

## 9. Kafka Integration

### Topics & Constants

All Kafka identifiers are centralized in `src/shared/infrastructure/kafka/kafka.constants.ts`:

```typescript
KAFKA_TOPICS = {
  ORDER_EVENTS: 'order.events',
  PAYMENT_EVENTS: 'payment.events',
  INVENTORY_EVENTS: 'inventory.events',
  SHIPPING_EVENTS: 'shipping.events',
  NOTIFICATION_EVENTS: 'notification.events',
}

// DLQ topics derived automatically
dlqTopic(KAFKA_TOPICS.ORDER_EVENTS) → 'order.events.dlq'
```

### Event Type Enums

```typescript
enum OrderEventType {
  CREATED = 'OrderCreated',
  CONFIRMED = 'OrderConfirmed',
  CANCELLED = 'OrderCancelled',
  SHIPPED = 'OrderShipped',
  ...
}
```

### Event Flow

```
Domain Entity
  │ addDomainEvent(new OrderCreatedEvent(...))
  ▼
EventPublisher.publishAll()
  │ INSERT INTO outbox_events (topic, aggregate_id, event_type, payload)
  ▼
OutboxPublisherService (polling every 1s)
  │ SELECT FROM outbox_events WHERE published = false FOR UPDATE SKIP LOCKED
  │ KafkaProducerService.send(topic, key=aggregate_id, payload)
  │ UPDATE outbox_events SET published = true
  ▼
Kafka Broker
  │
  ▼
BaseEventConsumer.subscribe()
  │ Idempotency check (by eventId)
  │ Route to handler by eventType
  │ Call use case
  │ Mark processed
  ▼
Use Case executes business logic
```

### Consumer Architecture

| Consumer | Listens To | Reacts To |
|----------|-----------|-----------|
| OrderEventConsumer | payment, inventory, shipping | Syncs order status |
| PaymentEventConsumer | order | Audit logging |
| InventoryEventConsumer | order | Cancellation awareness |
| ShippingEventConsumer | order | Confirmation/cancellation tracking |
| NotificationEventConsumer | all topics | Sends user notifications |

---

## 10. Temporal Integration

### Workflow Rules

- **Deterministic**: no `Date.now()`, no `Math.random()`, no I/O inside workflows
- **Activities for side effects**: all DB, HTTP, and Kafka operations happen in activities
- **Signals for external input**: order confirmation uses a Temporal signal
- **Retry policies**: 3 attempts, 1s initial interval, 2x backoff, 30s timeout per activity

### Worker Process

The Temporal worker runs as a separate process (`npm run worker`):

```
worker.ts
  │
  ├── Bootstrap NestJS context (no HTTP server)
  ├── Connect to Temporal server
  ├── Register activities (bound to OrderActivitiesImpl)
  ├── Register workflow path (order-processing.workflow.ts)
  └── Start polling task queue: "order-processing"
```

### Activity Helpers

Activities use a `mutateOrder()` helper to avoid repeating fetch-check-mutate-save:

```typescript
private async mutateOrder(orderId: string, action: (order: Order) => void): Promise<void> {
  const order = await this.orderRepository.findById(orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);
  action(order);
  await this.orderRepository.save(order);
}

// Usage
async confirmOrder(orderId: string) {
  await this.mutateOrder(orderId, (order) => order.confirm());
}
```

---

## 11. Database

### Per-Service Isolation

Each service has its own PostgreSQL database (no shared tables):

| Service | Database | Port | Token |
|---------|----------|------|-------|
| Order | order_db | 5432 | KYSELY_ORDER_DB |
| Payment | payment_db | 5433 | KYSELY_PAYMENT_DB |
| Inventory | inventory_db | 5434 | KYSELY_INVENTORY_DB |
| Shipping | shipping_db | 5435 | KYSELY_SHIPPING_DB |
| Notification | notification_db | 5436 | KYSELY_NOTIFICATION_DB |

### Kysely Module

The `KyselyModule.forFeature<T>()` factory creates typed database connections:

```typescript
KyselyModule.forFeature<OrderDatabase>({
  host: process.env.ORDER_DB_HOST || 'localhost',
  port: parseInt(process.env.ORDER_DB_PORT || '5432', 10),
  user: 'order_user',
  password: 'order_pass',
  database: 'order_db',
  token: KYSELY_ORDER_DB,  // Injection token
})
```

### Migrations

Each service has its own migration files at `infrastructure/database/migrations/`:

```bash
npm run migrate:order       # Run order service migrations
npm run migrate:payment     # Run payment service migrations
npm run migrate:all         # Run all migrations
```

### Outbox Table

Every database includes an `outbox_events` table for reliable event publishing:

```sql
CREATE TABLE outbox_events (
  id UUID PRIMARY KEY,
  aggregate_id VARCHAR NOT NULL,
  event_type VARCHAR NOT NULL,
  topic VARCHAR NOT NULL,
  payload JSONB NOT NULL,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 12. Health Checks

Three Kubernetes-compatible endpoints:

| Endpoint | Purpose | Checks |
|----------|---------|--------|
| `GET /health` | Full system health | Memory, Database, Kafka, Temporal |
| `GET /health/live` | Liveness probe | Memory heap only (fast) |
| `GET /health/ready` | Readiness probe | Database + Temporal (traffic routing) |

Thresholds: Heap < 300MB, RSS < 500MB.

---

## 13. Infrastructure Setup

### Docker Compose Services

```bash
docker compose up -d   # Start all infrastructure
```

| Service | Image | Port |
|---------|-------|------|
| order-db | postgres:16 | 5432 |
| payment-db | postgres:16 | 5433 |
| inventory-db | postgres:16 | 5434 |
| shipping-db | postgres:16 | 5435 |
| notification-db | postgres:16 | 5436 |
| temporal-db | postgres:16 | 5437 |
| temporal | temporalio/auto-setup:1.24.2 | 7233 |
| temporal-ui | temporalio/ui:2.31.2 | 8233 |
| kafka | apache/kafka:3.9.0 | 9092 |
| kafka-ui | provectuslabs/kafka-ui | 8080 |

### Running the Application

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Run migrations
npm run migrate:all

# 3. Seed inventory data
npm run seed:inventory

# 4. Start the HTTP server
npm run start:dev

# 5. Start the Temporal worker (separate terminal)
npm run worker:dev
```

### Environment Variables

```env
# Databases (per service)
ORDER_DB_HOST=localhost
ORDER_DB_PORT=5432
ORDER_DB_USER=order_user
ORDER_DB_PASSWORD=order_pass
ORDER_DB_NAME=order_db

# Kafka
KAFKA_BROKERS=localhost:9092

# Temporal
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=order-processing
```

---

## 14. Code Quality Rules

All code must comply with the rules defined in [claude.code.rules.md](../claude.code.rules.md):

- **No business logic in controllers** — controllers only delegate to use cases
- **DRY** — repeated patterns extracted into base classes (BaseEventConsumer, mutateOrder helper)
- **No magic strings** — all topics, event types, consumer groups, inject tokens, and Temporal identifiers use centralized constants
- **Kafka best practices** — outbox pattern, idempotent consumers, message key = aggregateId, mandatory DLQ
- **Temporal best practices** — deterministic workflows, explicit retry policies, compensation immediately after success
