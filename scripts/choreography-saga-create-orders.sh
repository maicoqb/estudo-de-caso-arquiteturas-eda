#!/bin/bash

SCRIPT_DIR="$(dirname "$0")"

echo "=== Creating order (success) ==="
bash "$SCRIPT_DIR/create-order.sh"

echo ""
echo "=== Creating order (inventory error) ==="
bash "$SCRIPT_DIR/create-order-inventory-error.sh"

echo ""
echo "=== Creating order (payment error) ==="
bash "$SCRIPT_DIR/create-order-payment-error.sh"

echo ""
echo "=== Creating order (shipping error - cascade compensation) ==="
bash "$SCRIPT_DIR/create-order-shipping-error.sh"
