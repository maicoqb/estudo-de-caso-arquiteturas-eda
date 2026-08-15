#!/bin/bash

API_URL="${1:-http://localhost:3001/api/orders}"

CUSTOMER_ID=$(printf '%04x%04x-%04x-%04x-%04x-%04x%04x%04x' $RANDOM $RANDOM $RANDOM $RANDOM $RANDOM $RANDOM $RANDOM $RANDOM)
PRODUCT_ID=$(printf '%04x%04x-%04x-%04x-%04x-%04x%04x%04x' $RANDOM $RANDOM $RANDOM $RANDOM $RANDOM $RANDOM $RANDOM $RANDOM)
QUANTITY=$((RANDOM % 5 + 1))
UNIT_PRICE=$((RANDOM % 100 + 10)).99

curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "'"$CUSTOMER_ID"'",
    "items": [
      {
        "productId": "'"$PRODUCT_ID"'",
        "quantity": '"$QUANTITY"',
        "unitPrice": '"$UNIT_PRICE"'
      }
    ],
    "payment": {
      "method": "credit_card",
      "cardLastFour": "'"$((RANDOM % 9000 + 1000))"'"
    },
    "shipping": {
      "address": "Rua Exemplo, '"$((RANDOM % 999 + 1))"'",
      "city": "São Paulo",
      "zipCode": "01000-000"
    }
  }'

echo ""
