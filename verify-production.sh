#!/bin/bash
# ============================================================================
# Production Deployment Verification Script
# ============================================================================
# Verifies that the Willy Collection website is properly configured for
# production deployment and ready to be deployed to Render, Railway, or Vercel
#
# Usage: bash verify-production.sh
# ============================================================================

set -e

echo "🔍 Verifying Production Readiness..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0

# Test function
test_check() {
  local name="$1"
  local condition="$2"
  
  if eval "$condition"; then
    echo -e "${GREEN}✓${NC} $name"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} $name"
    ((FAIL++))
  fi
}

warn_check() {
  local name="$1"
  local condition="$2"
  
  if eval "$condition"; then
    echo -e "${YELLOW}⚠${NC} $name (warning)"
    ((WARN++))
  fi
}

# ============================================================================
# 1. Environment Files
# ============================================================================
echo "📋 Environment Files:"
test_check "Backend .env.example exists" "[ -f 'backend/.env.example' ]"
test_check "Frontend .env.example exists" "[ -f 'frontend/.env.example' ]"
echo ""

# ============================================================================
# 2. Dependencies
# ============================================================================
echo "📦 Dependencies:"
test_check "Backend package.json exists" "[ -f 'backend/package.json' ]"
test_check "Frontend package.json exists" "[ -f 'frontend/package.json' ]"
test_check "Backend has express dependency" "grep -q '\"express\"' backend/package.json"
test_check "Frontend uses Next.js" "grep -q '\"next\"' frontend/package.json"
test_check "Backend has prisma" "grep -q '\"@prisma/client\"' backend/package.json"
echo ""

# ============================================================================
# 3. Production Scripts
# ============================================================================
echo "🚀 Production Scripts:"
test_check "Backend has production script" "grep -q '\"prod\"' backend/package.json"
test_check "Frontend has production script" "grep -q '\"prod\"' frontend/package.json"
test_check "Backend has start script" "grep -q '\"start\"' backend/package.json"
test_check "Frontend has start script" "grep -q '\"start\"' frontend/package.json"
echo ""

# ============================================================================
# 4. Database & ORM
# ============================================================================
echo "🗄️  Database & ORM:"
test_check "Prisma schema exists" "[ -f 'backend/prisma/schema.prisma' ]"
test_check "Database migrations folder exists" "[ -d 'backend/prisma/migrations' ]"
test_check "Seed script exists" "[ -f 'backend/scripts/seed.js' ]"
echo ""

# ============================================================================
# 5. Security Configuration
# ============================================================================
echo "🔒 Security Configuration:"
test_check "Server has security headers" "grep -q 'X-Frame-Options' backend/src/server.js"
test_check "HTTPS enforcement exists" "grep -q 'https' backend/src/server.js"
test_check "CORS configured" "grep -q 'cors' backend/src/server.js"
test_check "Rate limiting configured" "grep -q 'rateLimit' backend/src/server.js"
test_check "JWT validation exists" "grep -q 'jsonwebtoken' backend/src/server.js"
echo ""

# ============================================================================
# 6. Frontend Configuration
# ============================================================================
echo "🎨 Frontend Configuration:"
test_check "next.config.js exists" "[ -f 'frontend/next.config.js' ]"
test_check "tailwind.config.js exists" "[ -f 'frontend/tailwind.config.js' ]"
test_check "vercel.json exists" "[ -f 'frontend/vercel.json' ]"
echo ""

# ============================================================================
# 7. Docker Configuration
# ============================================================================
echo "🐳 Docker Configuration:"
test_check "Backend Dockerfile exists" "[ -f 'backend/Dockerfile' ]"
test_check "Frontend Dockerfile exists" "[ -f 'frontend/Dockerfile' ]"
test_check "docker-compose.yml exists" "[ -f 'docker-compose.yml' ]"
echo ""

# ============================================================================
# 8. Deployment Documentation
# ============================================================================
echo "📚 Deployment Documentation:"
test_check "Deployment guide exists" "[ -f 'DEPLOYMENT_TO_PRODUCTION.md' ]"
test_check "Vercel guide exists" "[ -f 'VERCEL_DEPLOYMENT_GUIDE.md' ]"
test_check "Render guide exists" "[ -f 'RENDER_DEPLOYMENT_GUIDE.md' ]"
test_check "Railway guide exists" "[ -f 'RAILWAY_DEPLOYMENT_GUIDE.md' ]"
test_check "Quick reference exists" "[ -f 'DEPLOYMENT_QUICK_REFERENCE.md' ]"
echo ""

# ============================================================================
# 9. Health Checks & Endpoints
# ============================================================================
echo "🏥 Health Checks:"
test_check "Health check endpoint exists" "grep -q '/api/health' backend/src/routes/health.js 2>/dev/null || grep -q '/health' backend/src/server.js"
test_check "Readiness check endpoint" "grep -q '/ready' backend/src/routes/health.js 2>/dev/null || grep -q '/ready' backend/src/server.js"
echo ""

# ============================================================================
# 10. Code Quality Checks
# ============================================================================
echo "✨ Code Quality:"
warn_check "Check for console.log in production" "grep -r 'console\.log' backend/src --include='*.js' | wc -l | grep -qv '^0$' || true"
warn_check "Check for TODO comments" "grep -r 'TODO\|FIXME' backend/src frontend/pages frontend/components --include='*.js' 2>/dev/null | wc -l | grep -qv '^0$' || true"
echo ""

# ============================================================================
# Summary
# ============================================================================
echo "════════════════════════════════════════════════════════════════════════"
echo -e "Results: ${GREEN}${PASS} Passed${NC} | ${RED}${FAIL} Failed${NC} | ${YELLOW}${WARN} Warnings${NC}"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✓ All critical checks passed! The website is ready for deployment.${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Choose your backend platform (Render or Railway)"
  echo "2. Choose your frontend platform (Vercel recommended for Next.js)"
  echo "3. Follow the appropriate deployment guide:"
  echo "   - Frontend: Read VERCEL_DEPLOYMENT_GUIDE.md"
  echo "   - Backend:  Read RENDER_DEPLOYMENT_GUIDE.md or RAILWAY_DEPLOYMENT_GUIDE.md"
  echo ""
  exit 0
else
  echo -e "${RED}✗ Some critical checks failed. Please fix the issues above.${NC}"
  echo ""
  exit 1
fi
