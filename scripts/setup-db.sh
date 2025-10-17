#!/bin/bash

# TaskMaestro Database Setup Script

echo "🚀 TaskMaestro Database Setup"
echo "==============================="

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
    
    # Check if container already exists
    if [ "$(docker ps -aq -f name=taskmaestro-db)" ]; then
        echo "📦 Container 'taskmaestro-db' already exists"
        
        # Start if not running
        if [ ! "$(docker ps -q -f name=taskmaestro-db)" ]; then
            echo "🔄 Starting existing container..."
            docker start taskmaestro-db
        else
            echo "✅ Container is already running"
        fi
    else
        echo "🔧 Creating new PostgreSQL container..."
        docker run --name taskmaestro-db \
            -e POSTGRES_PASSWORD=password \
            -e POSTGRES_DB=taskmaestro \
            -p 5432:5432 \
            -d postgres:15-alpine
        
        echo "⏳ Waiting for PostgreSQL to start..."
        sleep 5
    fi
    
    # Update .env file
    echo "📝 Updating .env file..."
    if [ ! -f .env ]; then
        cp .env.example .env
    fi
    
    # Update DATABASE_URL in .env
    if grep -q "DATABASE_URL=" .env; then
        sed -i.bak 's|DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:password@localhost:5432/taskmaestro"|g' .env
    else
        echo 'DATABASE_URL="postgresql://postgres:password@localhost:5432/taskmaestro"' >> .env
    fi
    
    echo "🎉 Docker setup complete!"
    echo "📍 Database URL: postgresql://postgres:password@localhost:5432/taskmaestro"
    
else
    echo "❌ Docker not found"
    echo ""
    echo "Please install PostgreSQL using one of these options:"
    echo ""
    echo "1. Install Docker and run this script again"
    echo "2. Install PostgreSQL locally:"
    echo "   - macOS: brew install postgresql"
    echo "   - Ubuntu: sudo apt-get install postgresql"
    echo "   - Windows: Download from https://www.postgresql.org/download/"
    echo ""
    echo "3. Use a cloud database:"
    echo "   - Neon: https://neon.tech (recommended)"
    echo "   - Supabase: https://supabase.com"
    echo "   - Railway: https://railway.app"
    echo ""
    echo "Then update your .env file with the appropriate DATABASE_URL"
fi

echo ""
echo "Next steps:"
echo "1. Run 'npm run db:push' to create the database schema"
echo "2. Run 'npm run dev' to start the application"