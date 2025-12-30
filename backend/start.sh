#!/bin/bash

# Sonic Backend Quick Start Script

echo "🚀 Starting Sonic Backend..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration"
fi

# Check if Docker is running
if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo "🐳 Using Docker Compose..."
    docker-compose up --build
else
    echo "💻 Using local Python environment..."
    
    # Check if uv is installed
    if ! command -v uv &> /dev/null; then
        echo "❌ UV is not installed. Installing UV..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
    fi
    
    # Create virtual environment if it doesn't exist
    if [ ! -d ".venv" ]; then
        echo "📦 Creating virtual environment..."
        uv venv
    fi
    
    # Activate virtual environment
    source .venv/bin/activate
    
    # Install dependencies
    echo "📥 Installing dependencies..."
    uv pip install -e .
    
    # Run migrations
    echo "🗄️  Running migrations..."
    python manage.py migrate
    
    # Start server
    echo "✅ Starting development server..."
    python manage.py runserver
fi

