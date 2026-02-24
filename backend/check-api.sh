#!/bin/bash
# Usage: ./check-api.sh https://your-app-xxxxx.ondigitalocean.app
# Replace with your actual Digital Ocean app URL

BASE_URL="${1:-https://your-app.ondigitalocean.app}"

echo "=== Testing: $BASE_URL ==="
echo ""

echo "1. Health endpoint (/app/health):"
curl -s -w "\n   HTTP Status: %{http_code}\n" "$BASE_URL/app/health"
echo ""

echo "2. API root (/api/):"
curl -s -w "\n   HTTP Status: %{http_code}\n" "$BASE_URL/api/"
echo ""

echo "3. Schema/docs (/api/schema/):"
curl -s -w "\n   HTTP Status: %{http_code}\n" "$BASE_URL/api/schema/" | head -c 200
echo "..."
echo ""
