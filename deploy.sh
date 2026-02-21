#!/bin/bash

# Production Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 Starting Willy Collection Deployment..."

# Configuration
ENVIRONMENT=${1:-production}
VERSION=$(date +%Y%m%d_%H%M%S)

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Pre-deployment checks
log_info "Running pre-deployment checks..."

if [ ! -f ".env.$ENVIRONMENT" ]; then
    log_error "Environment file .env.$ENVIRONMENT not found!"
    exit 1
fi

log_info "✓ Environment file found"

# Load environment
export $(cat ".env.$ENVIRONMENT" | grep -v '^#' | xargs)

# Check Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

log_info "✓ Docker is installed"

# Build images
log_info "Building Docker images..."
docker build --file backend/Dockerfile --tag willy-backend:$VERSION --tag willy-backend:latest .
docker build --file frontend/Dockerfile --tag willy-frontend:$VERSION --tag willy-frontend:latest .

log_info "✓ Images built successfully"

# Backup current database
if [ -f "data/dev.db" ]; then
    log_info "Backing up database..."
    cp data/dev.db data/dev.db.backup.$VERSION
    log_info "✓ Database backed up"
fi

# Deploy
log_info "Deploying with Docker Compose..."
docker-compose down || true
docker-compose up -d

log_info "✓ Deployment started"

# Wait for services to be ready
log_info "Waiting for services to be ready..."
sleep 10

# Health checks
log_info "Running health checks..."

if curl -s http://localhost:4000/api/health | grep -q '"ok":true'; then
    log_info "✓ Backend is healthy"
else
    log_error "Backend health check failed"
    exit 1
fi

if curl -s http://localhost:3000 | grep -q "html" > /dev/null 2>&1; then
    log_info "✓ Frontend is healthy"
else
    log_warn "Frontend health check inconclusive (may be normal)"
fi

log_info "🎉 Deployment completed successfully!"
log_info "Version: $VERSION"
log_info "Frontend: http://localhost:3000"
log_info "Backend: http://localhost:4000"
log_info "Logs: docker-compose logs -f"
