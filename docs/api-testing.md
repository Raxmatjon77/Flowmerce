# API Testing Guide — Full Order Lifecycle

## Prerequisites

```bash
docker compose up -d        # Start infrastructure
npm run migrate:all         # Run all migrations
npm run seed:inventory      # Seed inventory data
npm run start:dev           # Start HTTP server (terminal 1)
npm run worker:dev          # Start Temporal worker (terminal 2)
```

Base URL: `http://localhost:3000`

### Available Inventory SKUs (from seed data)

| SKU | Product | Qty |
|-----|---------|-----|
| `SKU-LAPTOP-001` | MacBook Pro 14" | 100 |
| `SKU-LAPTOP-002` | MacBook Pro 16" | 50 |
| `SKU-LAPTOP-003` | MacBook Air 15" | 200 |
| `SKU-MOUSE-001` | Magic Mouse | 500 |
| `SKU-KEYBOARD-001` | Magic Keyboard with Touch ID | 300 |
| `SKU-MONITOR-001` | Studio Display 27" | 75 |
| `SKU-MONITOR-002` | Pro Display XDR 32" | 30 |
| `SKU-HEADPHONES-001` | AirPods Max | 200 |
| `SKU-HEADPHONES-002` | AirPods Pro 2nd Gen | 600 |
| `SKU-PHONE-001` | iPhone 15 Pro | 150 |
| `SKU-PHONE-002` | iPhone 15 Pro Max | 120 |
| `SKU-TABLET-001` | iPad Pro 12.9" | 120 |
| `SKU-WATCH-001` | Apple Watch Ultra 2 | 80 |
| `SKU-CHARGER-001` | MagSafe Charger | 1000 |
| `SKU-CABLE-001` | USB-C to Lightning Cable 2m | 2000 |

---

## Step 0: Authenticate

All endpoints (except health and inventory GET) require a JWT token.

### Login as Customer

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "customer-001",
    "role": "customer"
  }' | jq .
```

Save the token:

```bash
export TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId": "customer-001", "role": "customer"}' | jq -r '.accessToken')
```

### Login as Admin

```bash
export ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId": "admin-001", "role": "admin"}' | jq -r '.accessToken')
```

---

## Step 1: Check Inventory (Public)

```bash
curl -s http://localhost:3000/api/v1/inventory/sku/SKU-PHONE-001 | jq .
```

---

## Step 2: Create an Order

```bash
curl -s -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "customerId": "customer-001",
    "items": [
      {
        "productId": "SKU-PHONE-001",
        "productName": "iPhone 15 Pro",
        "quantity": 1,
        "unitPrice": 999.99,
        "currency": "USD"
      },
      {
        "productId": "SKU-HEADPHONES-002",
        "productName": "AirPods Pro 2nd Gen",
        "quantity": 2,
        "unitPrice": 249.99,
        "currency": "USD"
      }
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94105",
      "country": "US"
    }
  }' | jq .
```

Save the order ID:

```bash
export ORDER_ID="<order-id-from-response>"
```

---

## Step 3: Check Order Status

```bash
curl -s http://localhost:3000/api/v1/orders/$ORDER_ID \
  -H "Authorization: Bearer $TOKEN" | jq .
```

The status should progress through the workflow:
- `PENDING` → `INVENTORY_RESERVED` → `PAYMENT_PROCESSED` → waiting for confirmation

---

## Step 4: Confirm the Order (Admin only)

The Temporal workflow is waiting for a confirmation signal.

```bash
curl -s -X POST http://localhost:3000/api/v1/orders/$ORDER_ID/confirm \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
```

After confirmation, the workflow continues:
- `CONFIRMED` → `SHIPPED`

---

## Step 5: Check Final Order Status

```bash
curl -s http://localhost:3000/api/v1/orders/$ORDER_ID \
  -H "Authorization: Bearer $TOKEN" | jq .
```

Expected status: `SHIPPED`

---

## Step 6: Cancel an Order (Alternative Flow)

Instead of confirming, you can cancel:

```bash
curl -s -X POST http://localhost:3000/api/v1/orders/$ORDER_ID/cancel \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
```

This triggers Temporal compensation:
1. Refund payment (if processed)
2. Release inventory
3. Notify user of cancellation

---

## Other Service Endpoints

### Payments

```bash
# Process a payment directly
curl -s -X POST http://localhost:3000/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "orderId": "'$ORDER_ID'",
    "amount": 1499.97,
    "currency": "USD",
    "method": {
      "type": "credit_card",
      "last4Digits": "4242",
      "expiryMonth": 12,
      "expiryYear": 2027
    }
  }' | jq .

# Get payment by ID
curl -s http://localhost:3000/api/v1/payments/<payment-id> \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# Refund a payment
curl -s -X POST http://localhost:3000/api/v1/payments/<payment-id>/refund \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
```

### Inventory

```bash
# Reserve inventory
curl -s -X POST http://localhost:3000/api/v1/inventory/reserve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "orderId": "manual-test-001",
    "items": [
      { "sku": "SKU-PHONE-001", "quantity": 1 }
    ]
  }' | jq .

# Release inventory
curl -s -X POST http://localhost:3000/api/v1/inventory/release \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "orderId": "manual-test-001",
    "items": [
      { "sku": "SKU-PHONE-001", "quantity": 1 }
    ]
  }' | jq .
```

### Shipments

```bash
# Create a shipment
curl -s -X POST http://localhost:3000/api/v1/shipments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "orderId": "'$ORDER_ID'",
    "address": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94105",
      "country": "US"
    }
  }' | jq .

# Get shipment
curl -s http://localhost:3000/api/v1/shipments/<shipment-id> \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# Update shipment status
curl -s -X PATCH http://localhost:3000/api/v1/shipments/<shipment-id>/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{ "status": "DELIVERED" }' | jq .
```

### Notifications

```bash
# Send a notification
curl -s -X POST http://localhost:3000/api/v1/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "recipientId": "customer-001",
    "channel": "EMAIL",
    "type": "ORDER_CONFIRMED",
    "subject": "Your order has been confirmed",
    "body": "Thank you for your order!"
  }' | jq .

# Get notifications for a recipient
curl -s "http://localhost:3000/api/v1/notifications?recipientId=customer-001" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Health Checks (No auth required)

```bash
# Full health check
curl -s http://localhost:3000/health | jq .

# Liveness probe
curl -s http://localhost:3000/health/live | jq .

# Readiness probe
curl -s http://localhost:3000/health/ready | jq .
```

---

## Full Lifecycle Script

Run the complete order lifecycle in one go:

```bash
#!/bin/bash
set -e
BASE=http://localhost:3000

echo "=== Authenticating ==="
TOKEN=$(curl -s -X POST $BASE/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"customer-001","role":"customer"}' | jq -r '.accessToken')
ADMIN_TOKEN=$(curl -s -X POST $BASE/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"admin-001","role":"admin"}' | jq -r '.accessToken')
echo "Tokens acquired"

echo ""
echo "=== Checking Inventory ==="
curl -s $BASE/api/v1/inventory/sku/SKU-PHONE-001 | jq '{sku: .sku, available: .availableQuantity}'

echo ""
echo "=== Creating Order ==="
IDEMPOTENCY_KEY=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen)
ORDER=$(curl -s -X POST $BASE/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{
    "customerId":"customer-001",
    "items":[{"productId":"SKU-PHONE-001","productName":"iPhone 15 Pro","quantity":1,"unitPrice":999.99,"currency":"USD"}],
    "shippingAddress":{"street":"123 Main St","city":"San Francisco","state":"CA","zipCode":"94105","country":"US"}
  }')
ORDER_ID=$(echo $ORDER | jq -r '.id')
echo "Order created: $ORDER_ID"
echo $ORDER | jq '{id: .id, status: .status, totalAmount: .totalAmount}'

echo ""
echo "=== Waiting for workflow to process (3s) ==="
sleep 3

echo ""
echo "=== Checking Order Status ==="
curl -s $BASE/api/v1/orders/$ORDER_ID \
  -H "Authorization: Bearer $TOKEN" | jq '{id: .id, status: .status}'

echo ""
echo "=== Confirming Order ==="
curl -s -X POST $BASE/api/v1/orders/$ORDER_ID/confirm \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

echo ""
echo "=== Waiting for workflow to complete (2s) ==="
sleep 2

echo ""
echo "=== Final Order Status ==="
curl -s $BASE/api/v1/orders/$ORDER_ID \
  -H "Authorization: Bearer $TOKEN" | jq '{id: .id, status: .status}'

echo ""
echo "=== Done ==="
```

---

## Swagger UI

Interactive API docs available at: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

Use the "Authorize" button to enter your Bearer token for authenticated requests.
