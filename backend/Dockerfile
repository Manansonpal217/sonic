# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install --no-cache-dir uv

# Copy dependency files
COPY pyproject.toml ./

# Install dependencies directly (no editable install needed)
RUN uv pip install --system \
    django>=5.0.0 \
    djangorestframework>=3.14.0 \
    django-cors-headers>=4.3.0 \
    psycopg2-binary>=2.9.9 \
    pillow>=10.0.0 \
    python-decouple>=3.8 \
    django-filter>=23.3 \
    drf-spectacular>=0.27.0

# Copy project files
COPY . .

# Collect static files (skip if migrations don't exist yet)
RUN python manage.py collectstatic --noinput || true

# Expose port
EXPOSE 8000

# Create migrations, run migrations, then start server
CMD ["sh", "-c", "python manage.py makemigrations --noinput && python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]
