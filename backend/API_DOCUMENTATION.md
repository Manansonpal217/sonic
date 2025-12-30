# Sonic Backend API Documentation

Complete API reference for the Sonic Backend.

## Base URL
```
http://localhost:8000/api/
```

## Authentication
Currently, the API uses Django's default authentication. For production, consider implementing token-based authentication (JWT).

## Common Query Parameters

### Filtering
- Use model field names as query parameters: `?field_name=value`
- Multiple filters: `?field1=value1&field2=value2`

### Search
- `?search=keyword` - Searches across configured search fields

### Ordering
- `?ordering=field_name` - Ascending order
- `?ordering=-field_name` - Descending order

### Pagination
- `?page=1` - Page number (default: 1)
- `?page_size=20` - Items per page (default: 20)

---

## API Endpoints

### 1. Users API

**Base Path:** `/api/users/`

#### List Users
```http
GET /api/users/
```
**Query Parameters:**
- `user_status` - Filter by status (true/false)
- `search` - Search in username, email, first_name, last_name
- `ordering` - Order by created_at, username, email

**Response:** Paginated list of users

#### Create User
```http
POST /api/users/
```
**Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure_password",
  "password_confirm": "secure_password",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Get User
```http
GET /api/users/{id}/
```

#### Update User
```http
PUT /api/users/{id}/
PATCH /api/users/{id}/
```

#### Delete User
```http
DELETE /api/users/{id}/
```

#### Soft Delete Multiple Users
```http
DELETE /api/users/soft_delete/
```
**Body:**
```json
{
  "user_ids": [1, 2, 3]
}
```

---

### 2. Products API

**Base Path:** `/api/products/`

#### List Products
```http
GET /api/products/
```
**Query Parameters:**
- `product_status` - Filter by status
- `product_is_parent` - Filter parent products
- `product_parent_id` - Filter by parent
- `min_price` - Minimum price filter
- `max_price` - Maximum price filter
- `search` - Search in product_name, product_description

#### Create Product
```http
POST /api/products/
```
**Body:**
```json
{
  "product_name": "Product Name",
  "product_description": "Description",
  "product_price": "99.99",
  "product_image": "<file>",
  "product_is_parent": false,
  "product_parent_id": null,
  "product_status": true
}
```

#### Get Product Children
```http
GET /api/products/{id}/children/
```

#### Soft Delete Multiple Products
```http
DELETE /api/products/soft_delete/
```

---

### 3. Orders API

**Base Path:** `/api/orders/`

#### List Orders
```http
GET /api/orders/
```
**Query Parameters:**
- `order_status` - Filter by status (pending, processing, shipped, delivered, cancelled)
- `order_user` - Filter by user ID
- `order_product` - Filter by product ID
- `user_id` - Filter by user ID (alternative)

#### Create Order
```http
POST /api/orders/
```
**Body:**
```json
{
  "order_user": 1,
  "order_product": 1,
  "order_quantity": 2,
  "order_price": "199.98",
  "order_status": "pending",
  "order_date": "2024-01-01T00:00:00Z",
  "order_notes": "Special instructions"
}
```

---

### 4. Customize Orders API

**Base Path:** `/api/customize-orders/`

#### List Customize Orders
```http
GET /api/customize-orders/
```
**Query Parameters:**
- `order_status` - Filter by status
- `customize_user` - Filter by user ID
- `user_id` - Filter by user ID

#### Create Customize Order
```http
POST /api/customize-orders/
```
**Body (multipart/form-data):**
```json
{
  "customize_user": 1,
  "order_image": "<file>",
  "order_audio": "<file>",
  "order_description": "Customization details",
  "order_status": "pending"
}
```

---

### 5. Cart API

**Base Path:** `/api/cart/`

#### List Cart Items
```http
GET /api/cart/
```
**Query Parameters:**
- `cart_status` - Filter by status
- `cart_user` - Filter by user ID
- `user_id` - Filter by user ID (returns only active items)

#### Add to Cart
```http
POST /api/cart/
```
**Body:**
```json
{
  "cart_user": 1,
  "cart_product": "product_id_or_data",
  "cart_quantity": 1,
  "cart_status": true
}
```

#### Clear User's Cart
```http
POST /api/cart/clear_cart/
```
**Body:**
```json
{
  "user_id": 1
}
```

---

### 6. Banners API

**Base Path:** `/api/banners/`

#### List Banners
```http
GET /api/banners/
```
**Query Parameters:**
- `banner_status` - Filter by status
- `banner_product_id` - Filter by product

#### Get Active Banners
```http
GET /api/banners/active/
```

#### Create Banner
```http
POST /api/banners/
```
**Body (multipart/form-data):**
```json
{
  "banner_title": "Banner Title",
  "banner_image": "<file>",
  "banner_product_id": 1,
  "banner_status": true,
  "banner_order": 0
}
```

---

### 7. CMS API

**Base Path:** `/api/cms/`

#### List CMS Pages
```http
GET /api/cms/
```
**Query Parameters:**
- `cms_status` - Filter by status
- `search` - Search in title, content, slug

#### Get CMS Page by Slug
```http
GET /api/cms/{slug}/
```

#### Get Active CMS Pages
```http
GET /api/cms/active/
```

#### Create CMS Page
```http
POST /api/cms/
```
**Body:**
```json
{
  "cms_title": "Page Title",
  "cms_slug": "page-slug",
  "cms_content": "Page content",
  "cms_status": true
}
```

---

### 8. Notification Types API

**Base Path:** `/api/notification-types/`

#### List Notification Types
```http
GET /api/notification-types/
```

#### Create Notification Type
```http
POST /api/notification-types/
```
**Body:**
```json
{
  "notif_name": "Order Update",
  "notif_status": true
}
```

---

### 9. Notifications API

**Base Path:** `/api/notifications/`

#### List Notifications
```http
GET /api/notifications/
```
**Query Parameters:**
- `notification_read` - Filter by read status
- `notification_user` - Filter by user ID
- `notification_type` - Filter by type ID
- `user_id` - Filter by user ID
- `read` - Filter by read status (true/false)

#### Mark Notification as Read
```http
PATCH /api/notifications/{id}/mark_read/
```

#### Mark All Notifications as Read
```http
POST /api/notifications/mark_all_read/
```
**Body:**
```json
{
  "user_id": 1
}
```

---

### 10. Order Emails API

**Base Path:** `/api/order-emails/`

#### List Order Emails
```http
GET /api/order-emails/
```
**Query Parameters:**
- `mail_status` - Filter by status
- `mail_to` - Filter by recipient
- `mail_from` - Filter by sender

#### Create Order Email
```http
POST /api/order-emails/
```
**Body:**
```json
{
  "mail_from": "sender@example.com",
  "mail_to": "recipient@example.com",
  "mail_subject": "Order Confirmation",
  "mail_content": "Your order has been confirmed",
  "mail_user": "user_id_or_name",
  "mail_status": true
}
```

---

### 11. Sessions API

**Base Path:** `/api/sessions/`

#### List Sessions
```http
GET /api/sessions/
```
**Query Parameters:**
- `session_user` - Filter by user ID
- `device_type` - Filter by device type
- `user_id` - Filter by user ID

#### Update FCM Token
```http
POST /api/sessions/update_fcm_token/
```
**Body:**
```json
{
  "session_key": "session_key_string",
  "fcm_token": "fcm_token_string",
  "device_type": "iOS",
  "user_id": 1
}
```

---

## Response Formats

### Success Response
```json
{
  "id": 1,
  "field1": "value1",
  "field2": "value2"
}
```

### Paginated Response
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/endpoint/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      ...
    }
  ]
}
```

### Error Response
```json
{
  "field_name": ["Error message"],
  "non_field_errors": ["General error message"]
}
```

---

## Status Codes

- `200 OK` - Success
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## File Uploads

For endpoints that accept file uploads (images, audio), use `multipart/form-data` content type:

```bash
curl -X POST http://localhost:8000/api/products/ \
  -F "product_name=Product" \
  -F "product_price=99.99" \
  -F "product_image=@/path/to/image.jpg"
```

---

## Examples

### Get all active products
```bash
curl http://localhost:8000/api/products/?product_status=true
```

### Create an order
```bash
curl -X POST http://localhost:8000/api/orders/ \
  -H "Content-Type: application/json" \
  -d '{
    "order_user": 1,
    "order_product": 1,
    "order_quantity": 2,
    "order_price": "199.98",
    "order_status": "pending"
  }'
```

### Get user's notifications
```bash
curl http://localhost:8000/api/notifications/?user_id=1&read=false
```

### Mark notification as read
```bash
curl -X PATCH http://localhost:8000/api/notifications/1/mark_read/
```

