# Distributed Order & Fulfillment Platform

A production-grade distributed system for order processing, built with **NestJS**, **Temporal**, **Kafka**, and **PostgreSQL**. Designed as a learning project for understanding distributed systems patterns, saga orchestration, and event-driven architecture.

## 🎯 What This Project Demonstrates

- **Saga Pattern** with Temporal for distributed transactions
- **Event-Driven Architecture** with Kafka
- **Clean Architecture** (Domain-Driven Design aligned)
- **Outbox Pattern** for reliable event publishing
- **Compensation Logic** for failure rollback
- **Dead Letter Queue (DLQ)** handling

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           API Gateway                                │
│                     (Order Controller - REST)                        │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Temporal Workflow                            │
│                    (Order Processing Saga)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Reserve  │→ │ Process  │→ │  Wait    │→ │ Create   │→ │ Notify │ │
│  │Inventory │  │ Payment  │  │ Confirm  │  │ Shipment │  │  User  │ │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └──────────┘  └────────┘ │
│       │             │                                                │
│       │ ◄───────────┴─── Compensation on Failure ───────────────────│
└───────┼─────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────────┐
│                           Service Layer                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐  │
│  │   Order     │ │  Payment    │ │  Inventory  │ │    Shipping     │  │
│  │  Service    │ │  Service    │ │   Service   │ │    Service      │  │
│  │  (Port:3000)│ │             │ │             │ │                 │  │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └───────┬─────────┘  │
│         │               │               │                │            │
│  ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐ ┌───────▼─────────┐  │
│  │ PostgreSQL  │ │ PostgreSQL  │ │ PostgreSQL  │ │   PostgreSQL    │  │
│  │  :5432      │ │  :5433      │ │  :5434      │ │     :5435       │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────────┐
│                              Kafka                                     │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────────────────┐ │
│  │ order.events   │ │ payment.events │ │ inventory/shipping/notif   │ │
│  └────────────────┘ └────────────────┘ └────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                    Dead Letter Queues (DLQ)                     │   │
│  └────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Services

| Service | Responsibility | Database Port |
|---------|---------------|---------------|
| **Order** | Order lifecycle, workflow orchestration | 5432 |
| **Payment** | Payment processing, refunds | 5433 |
| **Inventory** | Stock management, reservations | 5434 |
| **Shipping** | Shipment creation, tracking | 5435 |
| **Notification** | User notifications (email, SMS, push) | 5436 |

Each service has its own **bounded context** and **isolated database** — no shared state.

---

## 🔄 Order Processing Workflow (Saga)

The core workflow orchestrates a distributed transaction across multiple services:

```
1. Reserve Inventory     ──► Compensation: Release Inventory
        │
        ▼
2. Process Payment       ──► Compensation: Refund Payment
        │
        ▼
3. Wait for Confirmation ──► 24h timeout → Auto-cancel
        │
        ▼
4. Create Shipment
        │
        ▼
5. Notify User
```

### Failure Handling

When any step fails, compensations execute in **LIFO order**:

```typescript
// Compensation stack (simplified)
if (paymentFails) {
  await releaseInventory();  // Undo step 1
}
if (shipmentFails) {
  await refundPayment();     // Undo step 2
  await releaseInventory();  // Undo step 1
}
```

### Signal-Based Confirmation

The workflow waits for an external confirmation signal before shipping:

```typescript
// Send confirmation signal via Temporal API
await client.workflow.signalWithStart('orderProcessingWorkflow', {
  signal: 'confirmOrder',
  signalArgs: [],
});
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | NestJS (TypeScript) |
| **Workflow Engine** | Temporal |
| **Message Broker** | Kafka (KafkaJS) |
| **Database** | PostgreSQL |
| **Query Builder** | Kysely (type-safe, no ORM magic) |
| **Container** | Docker + Docker Compose |

---

## 📁 Project Structure

```
src/
├── app.module.ts                 # Root module
├── main.ts                       # Entry point
│
├── order/                        # Order bounded context
│   ├── domain/                   # Business logic (entities, value objects)
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── events/
│   │   ├── errors/
│   │   └── repositories/        # Repository interfaces
│   ├── application/              # Use cases, DTOs, ports
│   │   ├── use-cases/
│   │   ├── dtos/
│   │   └── ports/               # External service interfaces
│   ├── infrastructure/           # Implementations
│   │   ├── database/            # Kysely repositories
│   │   ├── kafka/               # Event publishers
│   │   ├── temporal/            # Workflows & activities
│   │   └── adapters/            # External service adapters
│   └── presentation/             # Controllers
│       └── controllers/
│
├── payment/                      # Same structure
├── inventory/                    # Same structure
├── shipping/                     # Same structure
├── notification/                 # Same structure
│
└── shared/                       # Cross-cutting concerns
    ├── domain/                   # Base classes (Entity, ValueObject, etc.)
    ├── application/              # Interfaces (EventPublisher, UseCase)
    ├── infrastructure/
    │   ├── database/            # Kysely module
    │   ├── kafka/               # Producer, Consumer, Outbox
    │   └── temporal/            # Temporal module
    └── presentation/             # Filters, interceptors
```

### Layer Dependencies (Clean Architecture)

```
Infrastructure → Application → Domain
      │               │            │
      │               │            └── No external dependencies
      │               └── Only depends on Domain
      └── Implements interfaces from Application/Domain
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Kafka running on `localhost:9092` (or use Docker)

### 1. Clone & Install

```bash
cd ~/coding/learning-pros/distrubuted-order
npm install
```

### 2. Start Infrastructure

```bash
# Start databases + Temporal
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env if needed
```

### 4. Run Migrations

```bash
npm run migrate:all
```

### 5. Start the Application

```bash
# Start NestJS app
npm run start:dev

# In another terminal, start Temporal worker
npm run temporal:worker
```

### 6. Access UIs

- **API:** http://localhost:3000
- **Temporal UI:** http://localhost:8233

---

## 🔌 API Endpoints

### Create Order

```bash
POST /orders
Content-Type: application/json

{
  "customerId": "cust-123",
  "items": [
    { "sku": "SKU-001", "quantity": 2, "unitPrice": 29.99 }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94102",
    "country": "US"
  },
  "paymentMethod": {
    "type": "CREDIT_CARD",
    "last4Digits": "4242",
    "expiryMonth": 12,
    "expiryYear": 2027
  }
}
```

### Confirm Order (via Temporal signal)

```bash
POST /orders/:orderId/confirm
```

### Get Order

```bash
GET /orders/:orderId
```

---

## ⚡ Key Patterns Implemented

### 1. Saga Pattern (Temporal)

Orchestrated saga with explicit compensation:

```typescript
// workflow
const compensations: Array<() => Promise<void>> = [];

await activities.reserveInventory(orderId, items);
compensations.push(() => activities.releaseInventory(orderId, items));

await activities.processPayment(orderId, amount);
compensations.push(() => activities.refundPayment(paymentId));

// On failure
for (const comp of compensations.reverse()) {
  await comp();  // LIFO execution
}
```

### 2. Outbox Pattern (Kafka)

Guarantees atomicity between database writes and event publishing:

```typescript
// 1. Write to DB + outbox in same transaction
await db.transaction().execute(async (trx) => {
  await trx.insertInto('orders').values(order).execute();
  await trx.insertInto('outbox_events').values({
    topic: 'order.events',
    payload: JSON.stringify(event),
    published: false,
  }).execute();
});

// 2. Background poller publishes to Kafka
// SELECT * FROM outbox_events WHERE published = false FOR UPDATE SKIP LOCKED
// → Publish to Kafka → Mark as published
```

### 3. Dead Letter Queue (DLQ)

Failed messages after max retries go to DLQ:

```typescript
if (retryCount >= maxRetries) {
  await producer.send({
    topic: 'order.events.dlq',
    messages: [{ ...message, headers: { 'x-error': error.message } }],
  });
}
```

### 4. Retry with Backoff (Temporal)

```typescript
const activities = proxyActivities<OrderActivities>({
  startToCloseTimeout: '30s',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1s',
    backoffCoefficient: 2,  // 1s → 2s → 4s
  },
});
```

---

## 🧪 Testing Failure Scenarios

### 1. Payment Failure

```bash
# Simulate payment failure (mock returns error for amount > 1000)
POST /orders
{ "items": [{ "unitPrice": 1001 }] }

# Expected: Inventory released, order cancelled
```

### 2. Confirmation Timeout

```bash
# Create order but don't confirm
POST /orders

# Wait 24h (or adjust timeout for testing)
# Expected: Auto-cancel, compensation executed
```

### 3. Kafka Down

```bash
# Stop Kafka
docker-compose stop kafka

# Create order
# Expected: Outbox stores event, publishes when Kafka recovers
```

---

## 📊 Monitoring

### Temporal UI

- View running workflows
- Inspect workflow history
- See retry attempts and failures
- Send signals manually

Access: http://localhost:8233

### Kafka Topics

```bash
# List topics
kafka-topics.sh --list --bootstrap-server localhost:9092

# Consume events
kafka-console-consumer.sh --topic order.events --bootstrap-server localhost:9092 --from-beginning
```

---

## 🎓 Learning Objectives

This project teaches:

| Concept | Where to Look |
|---------|---------------|
| **Saga Orchestration** | `src/order/infrastructure/temporal/workflows/` |
| **Compensation Logic** | `orderProcessingWorkflow` catch block |
| **Clean Architecture** | Any service's `domain/` vs `infrastructure/` |
| **Outbox Pattern** | `src/shared/infrastructure/kafka/outbox/` |
| **Event-Driven Design** | `*-event-publisher.ts` files |
| **DLQ Handling** | `kafka-consumer.service.ts` |
| **Type-Safe Queries** | Any `*.repository.ts` using Kysely |

---

## 🚧 What's Next (Improvement Ideas)

- [ ] Add integration tests with Testcontainers
- [ ] Implement idempotency keys in consumers
- [ ] Add distributed tracing (OpenTelemetry)
- [ ] Implement circuit breaker pattern
- [ ] Add Kubernetes manifests
- [ ] Implement CQRS for read optimization
- [ ] Add metrics (Prometheus + Grafana)

---

## 📚 Resources

- [Temporal Documentation](https://docs.temporal.io/)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Kysely Documentation](https://kysely.dev/)
- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Saga Pattern - Microsoft](https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga)
- [Outbox Pattern - Microservices.io](https://microservices.io/patterns/data/transactional-outbox.html)

---

## License

MIT — Use this for learning, break things, and build cool stuff.
