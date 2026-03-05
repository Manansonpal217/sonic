#!/bin/bash
# Upload a category image to backend and verify fetch
# Usage: ./scripts/upload-category-image.sh [image_file]
# For production: API_BASE=https://sonic-db-n7v6t.ondigitalocean.app/api ./scripts/upload-category-image.sh

set -e
API_BASE="${API_BASE:-http://localhost:8000/api}"
IMAGE_FILE="${1:-/tmp/test-image.png}"

if [ ! -f "$IMAGE_FILE" ]; then
  echo "Creating test image..."
  echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" | base64 -d > /tmp/test-image.png
  IMAGE_FILE=/tmp/test-image.png
fi

echo "=== 1. Create category with image (no auth required) ==="
CREATE_RESP=$(curl -s -X POST "$API_BASE/categories/" \
  -F "category_name=CurlUploadTest" \
  -F "category_status=true" \
  -F "category_image=@$IMAGE_FILE")
CAT_ID=$(echo "$CREATE_RESP" | grep -o '"id":[0-9]*' | cut -d':' -f2)
if [ -z "$CAT_ID" ]; then
  echo "Create failed: $CREATE_RESP"
  exit 1
fi
echo "Created category id: $CAT_ID"

echo ""
echo "=== 2. Get image URL from category ==="
IMG_URL=$(echo "$CREATE_RESP" | grep -o '"category_image":"[^"]*"' | cut -d'"' -f4)
echo "Image URL: $IMG_URL"

echo ""
echo "=== 3. Fetch image to verify ==="
FETCH_URL="${IMG_URL/http:/https:}"
FETCH_URL="${FETCH_URL:-$IMG_URL}"
HTTP_CODE=$(curl -s -o /tmp/fetched-image -w "%{http_code}" "$FETCH_URL")
echo "HTTP status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
  echo "SUCCESS: Image uploaded and fetchable."
  file /tmp/fetched-image
else
  echo "NOTE: Upload succeeded but fetch returned $HTTP_CODE."
  echo "On DigitalOcean App Platform, media uses ephemeral storage - configure Spaces for persistent media."
fi
