#!/bin/bash

# Security hardening script for production deployment

set -e

echo "🔒 Applying security hardening..."

# Check files not committed to git
echo "Checking .gitignore coverage..."
git check-ignore -v .env || echo "⚠️  Warning: .env might be tracked"
git check-ignore -v .env.production || echo "⚠️  Warning: .env.production might be tracked"
git check-ignore -v data/dev.db || echo "⚠️  Warning: database might be tracked"

# Verify environment files
if grep -q "your-super-secret-jwt-key-change-in-production" backend/.env 2>/dev/null; then
    echo "❌ Error: Default JWT_SECRET is still in use!"
    exit 1
fi

echo "✓ Environment validation passed"

# Check file permissions
echo "Setting secure file permissions..."
chmod 600 .env* 2>/dev/null || true
chmod 744 deploy.sh hardening.sh

echo "✓ File permissions set"

# Verify Node.js dependencies are secure
echo "Checking npm vulnerabilities..."
cd backend && npm audit --audit-level=moderate
cd ../frontend && npm audit --audit-level=moderate
cd ..

echo "✓ Security audit passed"

echo "🔒 Security hardening complete!"
