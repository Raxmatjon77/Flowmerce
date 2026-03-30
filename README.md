# Flowmerce — Distributed Order & Fulfillment Platform

A production-grade distributed system for order processing, built with **NestJS**, **Temporal**, **Kafka**, and **PostgreSQL**. Designed as a learning project for understanding distributed systems patterns, saga orchestration, and event-driven architecture.

## 🎯 What This Project Demonstrates

- **Saga Pattern** with Temporal for distributed transactions
- **Event-Driven Architecture** with Kafka
- **Clean Architecture** (Domain-Driven Design aligned)
- **Outbox Pattern** for reliable event publishing
- **Compensation Logic** for failure rollback
- **Dead Letter Queue (DLQ)** handling
- **Health Checks** for Kubernetes readiness/liveness
- **Idempotency Keys** for safe request retries

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
├── health/                       # Health check endpoints
│   ├── health.module.ts
│   ├── presentation/controllers/
│   └── infrastructure/indicators/
│
├── worker/                       # Temporal worker (separate process)
│   ├── worker.module.ts
│   └── worker.ts
│
├── order/                        # Order bounded context
│   ├── domain/                   # Business logic (entities, value objects)
│   ├── application/              # Use cases, DTOs, ports
│   ├── infrastructure/           # DB, Kafka, Temporal, adapters
│   └── presentation/             # Controllers
│
├── payment/                      # Same structure
├── inventory/                    # Same structure
├── shipping/                     # Same structure
├── notification/                 # Same structure
│
└── shared/                       # Cross-cutting concerns
    ├── domain/                   # Base classes (Entity, ValueObject)
    ├── application/              # Interfaces (EventPublisher, UseCase)
    └── infrastructure/
        ├── database/             # Kysely module
        ├── kafka/                # Producer, Consumer, Outbox
        ├── temporal/             # Temporal client module
        └── idempotency/          # Idempotency key handling
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Kafka running on `localhost:9092`

### 1. Clone & Install

```bash
git clone https://github.com/Raxmatjon77/Flowmerce.git
cd Flowmerce
npm install
```

### 2. Start Infrastructure

```bash
# Start databases + Temporal + Temporal UI
docker compose up -d

# Verify services are running
docker compose ps
```

### 3. Configure Environment

```bash
cp .env.example .env
```

### 4. Run Migrations & Seed Data

```bash
npm run migrate:all
npm run seed:inventory
```

### 5. Start the Application

```bash
# Terminal 1: Start NestJS API
npm run start

# Terminal 2: Start Temporal Worker
npm run worker
```

### 6. Access UIs

| Service | URL |
|---------|-----|
| **API** | http://localhost:3000 |
| **Health Check** | http://localhost:3000/health |
| **Temporal UI** | http://localhost:8233 |

---

## 🔌 API Endpoints

### Health Checks

```bash
GET /health          # Full health (DB, Kafka, Temporal, Memory)
GET /health/live     # Liveness probe (is process alive?)
GET /health/ready    # Readiness probe (can accept traffic?)
```

### Orders

```bash
POST   /api/v1/orders              # Create order
GET    /api/v1/orders/:id          # Get order by ID
POST   /api/v1/orders/:id/confirm  # Confirm order (Temporal signal)
POST   /api/v1/orders/:id/cancel   # Cancel order
```

### Create Order Example

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "customerId": "cust-001",
    "items": [
      {
        "productId": "SKU-LAPTOP-001",
        "productName": "MacBook Pro 14",
        "quantity": 1,
        "unitPrice": 1999.99
      }
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Tashkent",
      "state": "Tashkent",
      "zipCode": "100000",
      "country": "UZ"
    }
  }'
```

---

## 🔑 Idempotency Keys

Prevent duplicate order processing by sending `Idempotency-Key` header:

```bash
curl -X POST /api/v1/orders \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '...'
```

**Behavior:**
- First request: Creates order, caches response
- Same key again: Returns cached response (with `X-Idempotency-Replayed: true`)
- Concurrent requests with same key: Returns `409 Conflict`
- Keys expire after 24 hours

---

## ⚡ Key Patterns Implemented

### 1. Saga Pattern (Temporal)

```typescript
const compensations: Array<() => Promise<void>> = [];

await activities.reserveInventory(orderId, items);
compensations.push(() => activities.releaseInventory(orderId, items));

await activities.processPayment(orderId, amount);
compensations.push(() => activities.refundPayment(paymentId));

// On failure — execute compensations in LIFO order
for (const comp of compensations.reverse()) {
  await comp();
}
```

### 2. Outbox Pattern (Kafka)

```typescript
await db.transaction().execute(async (trx) => {
  await trx.insertInto('orders').values(order).execute();
  await trx.insertInto('outbox_events').values({
    topic: 'order.events',
    payload: JSON.stringify(event),
    published: false,
  }).execute();
});
// Background poller publishes to Kafka
```

### 3. Health Checks

```typescript
@Get('ready')
@HealthCheck()
async readiness() {
  return this.health.check([
    () => this.database.isHealthy('database'),
    () => this.temporal.isHealthy('temporal'),
  ]);
}
```

### 4. Idempotency

```typescript
@Post()
@Idempotent()
@UseGuards(IdempotencyGuard)
@UseInterceptors(IdempotencyInterceptor)
async createOrder(@Body() dto: CreateOrderDto) {
  // ...
}
```

---

## 🧪 NPM Scripts

```bash
npm run start           # Start API server
npm run start:dev       # Start with watch mode
npm run worker          # Start Temporal worker
npm run worker:dev      # Start worker with watch mode
npm run build           # Build for production
npm run migrate:all     # Run all database migrations
npm run seed:inventory  # Seed inventory data
npm run test:order      # Test order creation flow
```

---

## 📊 Kubernetes Deployment

### Liveness & Readiness Probes

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

---

## 🚧 Roadmap

- [x] Health check endpoints
- [x] Idempotency keys
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Structured logging (JSON)
- [ ] Rate limiting
- [ ] Authentication/Authorization (JWT)
- [ ] Circuit breaker pattern
- [ ] Prometheus metrics
- [ ] Integration tests (Testcontainers)
- [ ] Kubernetes manifests
- [ ] CQRS for read optimization

---

## 📚 Resources

- [Temporal Documentation](https://docs.temporal.io/)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Kysely Documentation](https://kysely.dev/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Saga Pattern - Microsoft](https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga)
- [Outbox Pattern](https://microservices.io/patterns/data/transactional-outbox.html)

---

## License

MIT — Use this for learning, break things, and build cool stuff.
