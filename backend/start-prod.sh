#!/bin/bash
# Production startup script for backend
# This script ensures database migrations are applied before starting the server

set -e  # Exit on any error

echo "🚀 Starting Willy Collection API..."

# Load environment variables
export NODE_ENV=production

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Seed admin user if this is first boot
echo "🌱 Seeding initial data..."
npm run seed

# Start the application
echo "✅ Starting server..."
exec node --enable-source-maps src/server.js
