#!/bin/bash

API_URL="${1:-http://localhost:3001/api/orders}"

curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "error-shipping",
    "items": [
      {
        "productId": "product-123",
        "quantity": 1,
        "unitPrice": 79.90
      }
    ],
    "payment": {
      "method": "credit_card",
      "cardLastFour": "1234"
    },
    "shipping": {
      "address": "Endereço Inválido, 000",
      "city": "São Paulo",
      "zipCode": "00000-000"
    }
  }'

echo ""
