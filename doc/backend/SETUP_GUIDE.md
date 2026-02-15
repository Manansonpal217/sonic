# Setup Guide - Troubleshooting Database Connection

## Problem
You're seeing this error:
```
psycopg2.OperationalError: connection to server at "localhost" (::1), port 5432 failed: Connection refused
```

This means PostgreSQL is not running on your local machine.

## Solution Options

### Option 1: Use Docker Compose (Recommended - Easiest)

Docker Compose will automatically start PostgreSQL for you:

```bash
cd /Users/manansonpal/Desktop/backend

# Make sure Docker is running on your Mac
# Then run:
docker-compose up --build
```

This will:
1. Start PostgreSQL database container
2. Start Django application container
3. Run migrations automatically
4. Make the API available at http://localhost:8000

**To create a superuser:**
```bash
# In another terminal
docker-compose exec web python manage.py createsuperuser
```

**To stop:**
```bash
docker-compose down
```

---

### Option 2: Install PostgreSQL Locally

If you prefer to run PostgreSQL locally:

#### macOS (using Homebrew):
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database
createdb sonic_db

# Create user (optional, or use your existing PostgreSQL user)
createuser sonic_user
```

#### Update .env file:
```bash
cd /Users/manansonpal/Desktop/backend
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:
```env
DB_NAME=sonic_db
DB_USER=your_postgres_username  # Usually your macOS username
DB_PASSWORD=your_postgres_password  # Leave empty if no password set
DB_HOST=localhost
DB_PORT=5432
```

#### Then run migrations:
```bash
source .venv/bin/activate
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

---

### Option 3: Use SQLite for Development (Quick Test)

If you just want to test the API quickly without PostgreSQL:

1. **Temporarily modify settings.py** to use SQLite:

Edit `sonic_backend/settings.py` and change the DATABASES section:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

2. **Run migrations:**
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**Note:** SQLite is fine for development, but PostgreSQL is required for production. Remember to revert this change before deploying.

---

## Quick Start (Docker - Recommended)

```bash
cd /Users/manansonpal/Desktop/backend
docker-compose up --build
```

That's it! The database will be set up automatically.

## Verify Setup

Once running, test the API:
```bash
curl http://localhost:8000/api/products/
```

Or visit in browser:
- API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/

