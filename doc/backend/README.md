# Sonic Backend API

Django REST Framework backend API for the Sonic application with PostgreSQL database.

## Features

- ✅ Complete CRUD operations for all models
- ✅ Django REST Framework with ViewSets
- ✅ PostgreSQL database
- ✅ Docker containerization
- ✅ Soft delete functionality
- ✅ Filtering, searching, and ordering
- ✅ File upload support (images, audio)
- ✅ CORS configuration
- ✅ Admin interface

## Tech Stack

- **Framework**: Django 5.0+
- **API**: Django REST Framework
- **Database**: PostgreSQL 15
- **Package Manager**: UV
- **Containerization**: Docker & Docker Compose

## Project Structure

```
backend/
├── sonic_backend/          # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── sonic_app/              # Main application
│   ├── models.py           # Database models
│   ├── serializers.py      # DRF serializers
│   ├── views.py            # ViewSets with CRUD
│   ├── urls.py             # API routes
│   └── admin.py            # Admin configuration
├── manage.py
├── pyproject.toml          # UV dependencies
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Database Schema

The backend includes the following models:

1. **User** - User authentication and profiles
2. **Product** - Product catalog with parent-child relationships
3. **Order** - Customer orders
4. **CustomizeOrders** - Customized order requests
5. **AddToCart** - Shopping cart items
6. **Banners** - Promotional banners
7. **CMS** - Content Management System pages
8. **NotificationType** - Notification type definitions
9. **NotificationTable** - User notifications
10. **OrderEmails** - Order-related email records
11. **Session** - User sessions with FCM tokens

## Setup Instructions

### ⚠️ Important: Database Connection Issue

If you see `Connection refused` errors, PostgreSQL is not running. **Use Docker Compose** (Option 1) - it automatically starts PostgreSQL for you!

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed troubleshooting.

### Prerequisites

- Python 3.11+
- UV package manager
- **Docker and Docker Compose** (Recommended - handles PostgreSQL automatically)
- PostgreSQL (Only needed if not using Docker)

### Option 1: Docker Setup (Recommended - Easiest)

1. **Clone and navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **Create superuser** (in another terminal)
   ```bash
   docker-compose exec web python manage.py createsuperuser
   ```

The API will be available at `http://localhost:8000`

### Option 2: Local Development Setup

1. **Install UV** (if not already installed)
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Create virtual environment and install dependencies**
   ```bash
   cd backend
   uv venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   uv pip install -e .
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb sonic_db
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run development server**
   ```bash
   python manage.py runserver
   ```

## API Endpoints

All endpoints are prefixed with `/api/`

### Users
- `GET /api/users/` - List users
- `POST /api/users/` - Create user
- `GET /api/users/{id}/` - Get user details
- `PUT /api/users/{id}/` - Update user
- `PATCH /api/users/{id}/` - Partial update user
- `DELETE /api/users/{id}/` - Delete user
- `DELETE /api/users/soft_delete/` - Soft delete multiple users

### Products
- `GET /api/products/` - List products
- `POST /api/products/` - Create product
- `GET /api/products/{id}/` - Get product details
- `PUT /api/products/{id}/` - Update product
- `PATCH /api/products/{id}/` - Partial update product
- `DELETE /api/products/{id}/` - Delete product
- `GET /api/products/{id}/children/` - Get child products
- `DELETE /api/products/soft_delete/` - Soft delete multiple products

### Orders
- `GET /api/orders/` - List orders
- `POST /api/orders/` - Create order
- `GET /api/orders/{id}/` - Get order details
- `PUT /api/orders/{id}/` - Update order
- `PATCH /api/orders/{id}/` - Partial update order
- `DELETE /api/orders/{id}/` - Delete order
- `DELETE /api/orders/soft_delete/` - Soft delete multiple orders

### Customize Orders
- `GET /api/customize-orders/` - List customize orders
- `POST /api/customize-orders/` - Create customize order
- `GET /api/customize-orders/{id}/` - Get customize order details
- `PUT /api/customize-orders/{id}/` - Update customize order
- `PATCH /api/customize-orders/{id}/` - Partial update customize order
- `DELETE /api/customize-orders/{id}/` - Delete customize order

### Cart
- `GET /api/cart/` - List cart items
- `POST /api/cart/` - Add to cart
- `GET /api/cart/{id}/` - Get cart item details
- `PUT /api/cart/{id}/` - Update cart item
- `PATCH /api/cart/{id}/` - Partial update cart item
- `DELETE /api/cart/{id}/` - Delete cart item
- `POST /api/cart/clear_cart/` - Clear user's cart

### Banners
- `GET /api/banners/` - List banners
- `POST /api/banners/` - Create banner
- `GET /api/banners/{id}/` - Get banner details
- `PUT /api/banners/{id}/` - Update banner
- `PATCH /api/banners/{id}/` - Partial update banner
- `DELETE /api/banners/{id}/` - Delete banner
- `GET /api/banners/active/` - Get active banners

### CMS
- `GET /api/cms/` - List CMS pages
- `POST /api/cms/` - Create CMS page
- `GET /api/cms/{slug}/` - Get CMS page by slug
- `PUT /api/cms/{slug}/` - Update CMS page
- `PATCH /api/cms/{slug}/` - Partial update CMS page
- `DELETE /api/cms/{slug}/` - Delete CMS page
- `GET /api/cms/active/` - Get active CMS pages

### Notifications
- `GET /api/notifications/` - List notifications
- `POST /api/notifications/` - Create notification
- `GET /api/notifications/{id}/` - Get notification details
- `PUT /api/notifications/{id}/` - Update notification
- `PATCH /api/notifications/{id}/mark_read/` - Mark notification as read
- `POST /api/notifications/mark_all_read/` - Mark all notifications as read
- `DELETE /api/notifications/{id}/` - Delete notification

### Sessions
- `GET /api/sessions/` - List sessions
- `POST /api/sessions/` - Create session
- `GET /api/sessions/{id}/` - Get session details
- `PUT /api/sessions/{id}/` - Update session
- `POST /api/sessions/update_fcm_token/` - Update FCM token

## Filtering and Search

Most endpoints support:
- **Filtering**: Use query parameters (e.g., `?order_status=pending`)
- **Search**: Use `?search=keyword` for text search
- **Ordering**: Use `?ordering=field_name` or `?ordering=-field_name` for descending
- **Pagination**: Results are paginated (20 per page by default)

### Examples

```
GET /api/products/?product_status=true&min_price=10&max_price=100
GET /api/orders/?user_id=1&order_status=pending
GET /api/notifications/?user_id=1&read=false
GET /api/products/?search=laptop&ordering=-created_at
```

## API Documentation

### Swagger UI (Interactive)
Access interactive API documentation at:
- **Swagger UI**: `http://localhost:8000/docs/`
- **ReDoc**: `http://localhost:8000/docs/redoc/`
- **OpenAPI Schema**: `http://localhost:8000/api/schema/`

The Swagger documentation provides:
- Complete list of all API endpoints
- Request/response schemas
- Try-it-out functionality to test APIs directly
- Filtering and search capabilities
- Authentication information

## Database Management

### pgweb (Web-based PostgreSQL Client)

A web-based PostgreSQL client is available at:
- **pgweb**: `http://localhost:8081`

pgweb provides:
- Visual database browser
- SQL query editor
- Table data viewer and editor
- Database schema explorer
- Export/import functionality

The connection is automatically configured using your database credentials.

### Direct PostgreSQL Connection

You can also connect directly using any PostgreSQL client:

```
Host: localhost
Port: 5432
Database: sonic_db
Username: sonic_user
Password: sonic_password
```

## Admin Interface

Access the Django admin at `http://localhost:8000/admin/`

Login with the superuser credentials created during setup.

## Environment Variables

Key environment variables (see `.env.example`):

- `SECRET_KEY` - Django secret key
- `DEBUG` - Debug mode (True/False)
- `ALLOWED_HOSTS` - Comma-separated list of allowed hosts
- `DB_NAME` - PostgreSQL database name
- `DB_USER` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password
- `DB_HOST` - Database host (**must be the DB service name in Docker/Kubernetes**, e.g. `db` or `postgres`, not `localhost`)
- `DB_PORT` - Database port
- `CORS_ALLOWED_ORIGINS` - Comma-separated CORS origins

### Kubernetes / container orchestration

If you deploy the backend image to **Kubernetes** (or any environment where the app and PostgreSQL run in different pods/containers), the app will get "Connection refused" to `localhost:5432` unless you override the database URL:

- Set **`DB_HOST`** to the **PostgreSQL service hostname** in your cluster (e.g. `postgres`, `sonic-postgres`, or whatever your Postgres Service is named).
- Set **`DB_PORT=5432`** (internal port).
- Ensure `DB_NAME`, `DB_USER`, and `DB_PASSWORD` match your Postgres deployment.

Example (Kubernetes Deployment env):

```yaml
env:
  - name: DB_HOST
    value: "postgres"   # or your Postgres Service name
  - name: DB_PORT
    value: "5432"
  - name: DB_NAME
    valueFrom:
      secretKeyRef:
        name: sonic-db
        key: db-name
  # ... DB_USER, DB_PASSWORD from Secret as needed
```

Without this, the container uses `localhost` and tries to connect to Postgres inside its own pod, so the readiness probe fails and migrations exit with "Connection refused".

### DigitalOcean App Platform

When you deploy on **DigitalOcean App Platform** and add a **PostgreSQL database** (or use a managed DB), bind it to your backend component. Then either:

**Option A – Use `DATABASE_URL` (simplest)**  
In the backend component’s **Environment Variables**, add:

- **Key:** `DATABASE_URL`  
- **Value:** `${your_database_name.DATABASE_URL}`  

Replace `your_database_name` with the name of your database component (e.g. `db` → `${db.DATABASE_URL}`). App Platform will inject the full Postgres URL at runtime. The backend supports `DATABASE_URL` and will use it instead of `DB_*` when set.

**Option B – Map individual variables**  
If you prefer separate vars, add:

- `DB_HOST` = `${your_database_name.HOSTNAME}`
- `DB_PORT` = `${your_database_name.PORT}`
- `DB_USER` = `${your_database_name.USERNAME}`
- `DB_PASSWORD` = `${your_database_name.PASSWORD}`
- `DB_NAME` = `${your_database_name.DATABASE}` (or your DB name, e.g. `sonic_db`)

Again, replace `your_database_name` with your database component name. Ensure the database component is in the same app and bound to the backend so these variables are available.

## Development

### Running Tests
```bash
python manage.py test
```

### Creating Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Accessing Django Shell
```bash
python manage.py shell
```

### Collecting Static Files
```bash
python manage.py collectstatic
```

## Docker Commands

```bash
# Build and start containers
docker-compose up --build

# Start in background
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f web

# Execute commands in container
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser

# Remove volumes (WARNING: deletes database)
docker-compose down -v
```

## License

This project is part of the Sonic application.

