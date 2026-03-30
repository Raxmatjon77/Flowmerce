#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="${API_URL:-http://localhost:3000}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Flowmerce Order Test Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. Create Order
echo -e "${YELLOW}[1/4] Creating order...${NC}"
ORDER_RESPONSE=$(curl -s -X POST "${API_URL}/api/v1/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cust-test-001",
    "items": [
      {
        "productId": "SKU-LAPTOP-001",
        "productName": "MacBook Pro 14",
        "quantity": 1,
        "unitPrice": 1999.99
      },
      {
        "productId": "SKU-MOUSE-001",
        "productName": "Magic Mouse",
        "quantity": 2,
        "unitPrice": 99.00
      }
    ],
    "shippingAddress": {
      "street": "123 Amir Temur St",
      "city": "Tashkent",
      "state": "Tashkent",
      "zipCode": "100000",
      "country": "UZ"
    }
  }')

# Check if order was created
if echo "$ORDER_RESPONSE" | grep -q '"id"'; then
  ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "${GREEN}✅ Order created: ${ORDER_ID}${NC}"
  echo "$ORDER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ORDER_RESPONSE"
else
  echo -e "${RED}❌ Failed to create order${NC}"
  echo "$ORDER_RESPONSE"
  exit 1
fi

echo ""

# 2. Get Order
echo -e "${YELLOW}[2/4] Fetching order status...${NC}"
sleep 2  # Wait for workflow to start
GET_RESPONSE=$(curl -s "${API_URL}/api/v1/orders/${ORDER_ID}")
echo "$GET_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$GET_RESPONSE"

echo ""

# 3. Confirm Order (send signal to Temporal)
echo -e "${YELLOW}[3/4] Confirming order (sending Temporal signal)...${NC}"
CONFIRM_RESPONSE=$(curl -s -X POST "${API_URL}/api/v1/orders/${ORDER_ID}/confirm")
echo "$CONFIRM_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CONFIRM_RESPONSE"

echo ""

# 4. Final status check
echo -e "${YELLOW}[4/4] Final order status...${NC}"
sleep 3  # Wait for workflow to process
FINAL_RESPONSE=$(curl -s "${API_URL}/api/v1/orders/${ORDER_ID}")
echo "$FINAL_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$FINAL_RESPONSE"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Test completed!${NC}"
echo -e "${BLUE}Order ID: ${ORDER_ID}${NC}"
echo -e "${BLUE}Temporal UI: http://localhost:8233${NC}"
echo -e "${BLUE}========================================${NC}"
