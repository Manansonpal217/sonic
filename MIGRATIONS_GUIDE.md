# Database Setup & Migrations Guide

## Status: ✅ Migrations Created Successfully

Your migrations have been created successfully! The file is here:
- `backend/sonic_app/migrations/0003_category_categoryfield_order_order_total_price_and_more.py`

## What Was Created:
- ✅ Category model
- ✅ CategoryField model  
- ✅ ProductFieldValue model
- ✅ OrderItem model
- ✅ Updated Order model (added order_total_price)
- ✅ Updated AddToCart model (cart_product now ForeignKey)
- ✅ Updated Product model (added product_category)

## To Apply Migrations:

You need a running PostgreSQL database. Choose one option:

### Option 1: Use Docker (Recommended)

1. **Make sure Docker Desktop is running**

2. **Start the database:**
```bash
cd backend
docker-compose up -d db
```

3. **Wait a few seconds for PostgreSQL to start, then run migrations:**
```bash
python3 manage.py migrate
```

4. **Start the backend:**
```bash
docker-compose up
```

### Option 2: Use Local PostgreSQL

If you have PostgreSQL installed locally:

1. **Update backend/.env file (or create it):**
```env
DB_NAME=sonic_db
DB_USER=your_local_user
DB_PASSWORD=your_local_password
DB_HOST=localhost
DB_PORT=5432
```

2. **Create the database:**
```bash
psql -U your_user -c "CREATE DATABASE sonic_db;"
```

3. **Run migrations:**
```bash
cd backend
python3 manage.py migrate
```

4. **Start the server:**
```bash
python3 manage.py runserver
```

## What to Do Next:

1. Choose one of the options above to get your database running
2. Run the migrations
3. Create a superuser: `python3 manage.py createsuperuser`
4. Start the backend server
5. Test the APIs at http://localhost:8000/api/
6. Access admin at http://localhost:8000/admin/

## Verification:

Once migrations are applied, you can verify by:
```bash
python3 manage.py showmigrations
```

All migrations should show `[X]` indicating they're applied.

## Need Help?

If you encounter issues:
1. Make sure Docker Desktop is running (for Option 1)
2. Make sure PostgreSQL is installed and running (for Option 2)
3. Check the error messages - they usually indicate what's missing


