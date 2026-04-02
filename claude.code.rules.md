# Code Quality Rules

These rules are **mandatory** for all code generation and modifications in this project. Violations must be fixed before any code is considered complete.

---

## 1. Controller Rules

Controllers are thin HTTP adapters. They MUST NOT contain business logic.

**Allowed in controllers:**
- Route decorators, HTTP status codes, parameter extraction (`@Body`, `@Param`, `@Query`)
- Validation decorators (`class-validator`)
- Calling a use case's `execute()` method and returning the result

**Forbidden in controllers:**
- Repository or database access
- Domain entity method calls
- Conditional logic on domain state (e.g., `if (order.status === 'CANCELLED')`)
- Direct Kafka publishing or Temporal workflow interaction
- Any logic beyond request mapping and use case delegation

```typescript
// WRONG
@Post()
async create(@Body() dto) {
  const order = Order.create(dto);
  await this.orderRepository.save(order);
  await this.kafkaProducer.send('order.events', order);
  return order;
}

// CORRECT
@Post()
async create(@Body() dto: CreateOrderRequest) {
  return this.createOrderUseCase.execute(dto);
}
```

---

## 2. DRY — Extract Repeated Patterns

When the same pattern appears in 2+ places, extract it into a shared base class, generic function, or utility.

### Kafka Consumers

All consumers share identical boilerplate (subscribe, extract event, idempotency check, logging, error handling). Extract into a `BaseEventConsumer` class:

- `isDuplicate(eventId)` / `markProcessed(eventId)` — identical in every consumer, must live in a base class
- Event extraction (`value.eventType`, `value.eventId`) — standardize in the base handler
- Subscription setup with topic, groupId, DLQ, maxRetries — provide a declarative `subscribe()` helper

```typescript
// WRONG — copy-paste in every consumer
private async isDuplicate(eventId: string): Promise<boolean> {
  if (!eventId) return false;
  const existing = await this.idempotencyService.get(`order-consumer:${eventId}`);
  // ...
}

// CORRECT — inherit from base
abstract class BaseEventConsumer {
  protected abstract readonly consumerPrefix: string;
  
  protected async isDuplicate(eventId: string): Promise<boolean> { /* shared */ }
  protected async markProcessed(eventId: string): Promise<void> { /* shared */ }
  protected async subscribeWithIdempotency(config: SubscriptionConfig): Promise<void> { /* shared */ }
}
```

### Temporal Activities

When multiple activities follow the same pattern (fetch entity from repo → mutate → save), extract a helper:

```typescript
// WRONG — repeated in confirmOrder, cancelOrder, etc.
const order = await this.orderRepository.findById(orderId);
if (!order) throw new Error(`Order ${orderId} not found`);
order.confirm();
await this.orderRepository.save(order);

// CORRECT — extract helper
private async mutateOrder(orderId: string, action: (order: Order) => void): Promise<void> {
  const order = await this.orderRepository.findById(orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);
  action(order);
  await this.orderRepository.save(order);
}
```

### Temporal Workflows

Extract the compensation stack pattern into a reusable `SagaBuilder` or `withCompensation()` utility when the same try/catch + LIFO rollback pattern is needed across multiple workflows.

---

## 3. No Magic Strings

**Never use hardcoded string literals** for identifiers that are referenced in more than one place. Use constants, enums, or derived values.

### Kafka Topic Names

Define all topics in `src/shared/infrastructure/kafka/kafka.constants.ts`:

```typescript
export const KAFKA_TOPICS = {
  ORDER_EVENTS: 'order.events',
  PAYMENT_EVENTS: 'payment.events',
  INVENTORY_EVENTS: 'inventory.events',
  SHIPPING_EVENTS: 'shipping.events',
  NOTIFICATION_EVENTS: 'notification.events',
} as const;
```

DLQ topics MUST be derived, never hardcoded separately:

```typescript
export const dlqTopic = (topic: string) => `${topic}.dlq` as const;
// Usage: dlqTopic(KAFKA_TOPICS.ORDER_EVENTS) → 'order.events.dlq'
```

### Event Type Names

Define per-domain enums in each service's domain layer:

```typescript
// src/order/domain/events/order-event-types.ts
export enum OrderEventType {
  CREATED = 'OrderCreated',
  CONFIRMED = 'OrderConfirmed',
  CANCELLED = 'OrderCancelled',
  SHIPPED = 'OrderShipped',
  INVENTORY_RESERVED = 'OrderInventoryReserved',
  PAYMENT_PROCESSED = 'OrderPaymentProcessed',
}
```

### Consumer Group IDs

Define as constants, following the naming convention `{service}-service-{source}-consumer`:

```typescript
export const CONSUMER_GROUPS = {
  ORDER_PAYMENT: 'order-service-payment-consumer',
  ORDER_INVENTORY: 'order-service-inventory-consumer',
  ORDER_SHIPPING: 'order-service-shipping-consumer',
  // ...
} as const;
```

### Dependency Injection Tokens

Use exported `Symbol()` constants or string constants from a central location per module. Never write `@Inject('CreateOrderUseCase')` with an inline string:

```typescript
// src/order/application/injection-tokens.ts
export const ORDER_USE_CASE_TOKENS = {
  CREATE: 'CreateOrderUseCase',
  GET: 'GetOrderUseCase',
  CONFIRM: 'ConfirmOrderUseCase',
  CANCEL: 'CancelOrderUseCase',
} as const;

// Usage: @Inject(ORDER_USE_CASE_TOKENS.CREATE)
```

### Temporal Constants

Define in `src/shared/infrastructure/temporal/temporal.constants.ts`:

```typescript
export const TEMPORAL_TASK_QUEUES = {
  ORDER_PROCESSING: 'order-processing',
} as const;

export const TEMPORAL_WORKFLOW_ID_PREFIX = {
  ORDER: 'order-processing-',
} as const;
```

### Idempotency Key Prefixes

```typescript
export const IDEMPOTENCY_PREFIXES = {
  ORDER_CONSUMER: 'order-consumer',
  PAYMENT_CONSUMER: 'payment-consumer',
  INVENTORY_CONSUMER: 'inventory-consumer',
  SHIPPING_CONSUMER: 'shipping-consumer',
  NOTIFICATION_CONSUMER: 'notification-consumer',
} as const;
```

---

## 4. Kafka Best Practices

1. **Outbox pattern is mandatory** — never publish events directly from use cases or domain services. Events go into the `outbox_events` table in the same transaction as the entity mutation, then the `OutboxPublisherService` polls and publishes.

2. **Consumers MUST be idempotent** — use the `IdempotencyService` to deduplicate by `eventId`. Every consumer subscription must check before processing.

3. **Message key = aggregateId** — ensures partition ordering for the same aggregate. Never use random keys or omit the key.

4. **DLQ is mandatory** — every `consume()` call must specify a `deadLetterTopic`. Use the `dlqTopic()` helper to derive it from the base topic.

5. **Event payload standard** — every event published to Kafka must include:
   - `eventId` (UUID, unique per event)
   - `eventType` (from the domain event type enum)
   - `aggregateId` (the entity ID)
   - `occurredAt` (ISO 8601 timestamp)

6. **Consumer group naming** — follow the convention: `{owning-service}-service-{source-topic}-consumer`.

7. **Max retries** — always set `maxRetries` explicitly (default: 3). Do not rely on implicit defaults.

8. **No business logic in consumers** — consumers extract the event data and delegate to a use case. The consumer is an infrastructure adapter, not an application service.

---

## 5. Temporal Best Practices

1. **Workflow determinism** — workflows MUST NOT use:
   - `Date.now()` or `new Date()` (use `workflow.now()` from Temporal SDK)
   - `Math.random()` (use deterministic IDs passed as input)
   - Direct I/O (HTTP calls, DB queries, file system access)
   - Non-deterministic libraries

2. **Activities for all side effects** — database access, HTTP calls, Kafka publishing, file I/O, and any external interaction must happen inside activities, never in workflows.

3. **Explicit retry policies** — every `proxyActivities()` call must define:
   - `startToCloseTimeout` (mandatory, e.g., `'30s'`)
   - `retry: { maximumAttempts, initialInterval, backoffCoefficient }`
   - Never rely on Temporal's default retry behavior

4. **Compensation immediately after success** — push the compensation function to the stack right after the activity succeeds, before calling the next activity:
   ```typescript
   await activities.reserveInventory(orderId, items);
   compensations.push(() => activities.releaseInventory(orderId, items));
   // THEN proceed to next step
   ```

5. **Signals for external input** — when a workflow needs to wait for human approval or external system confirmation, use Temporal signals. Never poll an external system from within a workflow.

6. **Queries for read-only state** — expose workflow state via queries, not by writing to a database from within the workflow.

7. **Meaningful workflow IDs** — workflow IDs must be deterministic and business-meaningful (e.g., `order-processing-{orderId}`). Use constants for the prefix.

8. **Activity timeout is mandatory** — never create an activity without `startToCloseTimeout`. Hanging activities block the workflow indefinitely.

9. **Workflow timeout** — set `workflowRunTimeout` for the overall workflow to prevent indefinite execution (e.g., 24h for order processing with a confirmation wait).

---

## 6. General Code Quality

1. **Interfaces for all cross-layer dependencies** — application layer defines interfaces (ports), infrastructure implements them. Never import concrete implementations in the application or domain layers.

2. **One use case = one `execute()` method** — use cases are single-responsibility. If a use case grows beyond one responsibility, split it.

3. **Domain layer is framework-free** — no NestJS decorators (`@Injectable`, `@Module`), no Kafka imports, no Temporal imports, no database imports in the domain layer.

4. **Prefer composition over inheritance** — except for well-defined base classes like `AggregateRoot`, `Entity`, `ValueObject`, and `BaseEventConsumer`.

5. **No God services** — if a service has more than 5-7 dependencies or methods, it should be split into focused use cases.

6. **Error types** — use domain-specific error classes (not generic `Error`). Throw domain errors from the domain layer, and map them to HTTP responses in the presentation layer via exception filters.
