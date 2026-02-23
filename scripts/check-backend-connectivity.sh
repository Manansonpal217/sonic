#!/bin/bash
# Backend connectivity check for mobile app
# Run from project root: ./scripts/check-backend-connectivity.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Backend Connectivity Diagnostics ==="
echo ""

# 1. Mac IP
MAC_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "NOT_FOUND")
echo "1. Mac LAN IP (en0): $MAC_IP"
if [ "$MAC_IP" = "NOT_FOUND" ]; then
  echo "   Trying alternatives..."
  MAC_IP=$(ifconfig 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
  echo "   Fallback IP: $MAC_IP"
fi
echo ""

# 2. .env config
API_URL=$(grep EXPO_PUBLIC_API_BASE_URL .env 2>/dev/null | cut -d= -f2- || echo "NOT SET")
echo "2. App .env EXPO_PUBLIC_API_BASE_URL: ${API_URL:-NOT SET}"
echo ""

# 3. Backend reachable?
echo "3. Testing backend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 http://localhost:8000/app/health 2>/dev/null || echo "FAIL")
if [ "$HTTP_CODE" = "200" ]; then
  echo "   localhost:8000 → OK (200)"
else
  echo "   localhost:8000 → FAIL (code: $HTTP_CODE). Is Docker backend running? Try: cd backend && docker compose up"
fi

if [ -n "$MAC_IP" ] && [ "$MAC_IP" != "NOT_FOUND" ]; then
  HTTP_CODE_LAN=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "http://${MAC_IP}:8000/app/health" 2>/dev/null || echo "FAIL")
  if [ "$HTTP_CODE_LAN" = "200" ]; then
    echo "   ${MAC_IP}:8000 → OK (200) - Phone can use this"
  else
    echo "   ${MAC_IP}:8000 → FAIL. Phone may not reach backend."
  fi
fi
echo ""

# 4. Docker
echo "4. Docker backend:"
docker ps --format "   {{.Names}}: {{.Status}}" 2>/dev/null | grep sonic || echo "   No sonic containers (run: cd backend && docker compose up)"
echo ""

# 5. Checklist
echo "=== Checklist for physical device ==="
echo "   [ ] Mac and phone on same WiFi"
echo "   [ ] .env has EXPO_PUBLIC_API_BASE_URL=http://${MAC_IP}:8000/app"
echo "   [ ] Metro restarted with: npx expo start --clear"
echo "   [ ] Backend running (docker compose up)"
echo ""
echo "If APIs still fail, check Metro logs for '[API] BASE_URL =' to see what URL the app is using."
