# ============================================================================
# Production Deployment Verification Script (PowerShell)
# ============================================================================
# Verifies that the Willy Collection website is properly configured for
# production deployment and ready to be deployed to Render, Railway, or Vercel
#
# Usage: .\verify-production.ps1
# ============================================================================

$pass = 0
$fail = 0
$warn = 0

function Test-Check {
    param(
        [string]$Name,
        [scriptblock]$Condition
    )
    
    if (& $Condition) {
        Write-Host "✓ $Name" -ForegroundColor Green
        $Script:pass++
    } else {
        Write-Host "✗ $Name" -ForegroundColor Red
        $Script:fail++
    }
}

function Warn-Check {
    param(
        [string]$Name,
        [scriptblock]$Condition
    )
    
    if (& $Condition) {
        Write-Host "⚠ $Name (warning)" -ForegroundColor Yellow
        $Script:warn++
    }
}

Write-Host "🔍 Verifying Production Readiness..." -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 1. Environment Files
# ============================================================================
Write-Host "📋 Environment Files:" -ForegroundColor Cyan
Test-Check "Backend .env.example exists" { Test-Path "backend\.env.example" }
Test-Check "Frontend .env.example exists" { Test-Path "frontend\.env.example" }
Write-Host ""

# ============================================================================
# 2. Dependencies
# ============================================================================
Write-Host "📦 Dependencies:" -ForegroundColor Cyan
Test-Check "Backend package.json exists" { Test-Path "backend\package.json" }
Test-Check "Frontend package.json exists" { Test-Path "frontend\package.json" }
Test-Check "Backend has express dependency" { (Get-Content "backend\package.json") -match '"express"' }
Test-Check "Frontend uses Next.js" { (Get-Content "frontend\package.json") -match '"next"' }
Test-Check "Backend has prisma" { (Get-Content "backend\package.json") -match '@prisma/client' }
Write-Host ""

# ============================================================================
# 3. Production Scripts
# ============================================================================
Write-Host "🚀 Production Scripts:" -ForegroundColor Cyan
Test-Check "Backend has production script" { (Get-Content "backend\package.json") -match '"prod"' }
Test-Check "Frontend has production script" { (Get-Content "frontend\package.json") -match '"prod"' }
Test-Check "Backend has start script" { (Get-Content "backend\package.json") -match '"start"' }
Test-Check "Frontend has start script" { (Get-Content "frontend\package.json") -match '"start"' }
Write-Host ""

# ============================================================================
# 4. Database & ORM
# ============================================================================
Write-Host "🗄️ Database & ORM:" -ForegroundColor Cyan
Test-Check "Prisma schema exists" { Test-Path "backend\prisma\schema.prisma" }
Test-Check "Database migrations folder exists" { Test-Path "backend\prisma\migrations" }
Test-Check "Seed script exists" { Test-Path "backend\scripts\seed.js" }
Write-Host ""

# ============================================================================
# 5. Security Configuration
# ============================================================================
Write-Host "🔒 Security Configuration:" -ForegroundColor Cyan
Test-Check "Server has security headers" { (Get-Content "backend\src\server.js") -match 'X-Frame-Options' }
Test-Check "HTTPS enforcement exists" { (Get-Content "backend\src\server.js") -match 'https' }
Test-Check "CORS configured" { (Get-Content "backend\src\server.js") -match 'cors' }
Test-Check "Rate limiting configured" { (Get-Content "backend\src\server.js") -match 'rateLimit' }
Test-Check "JWT validation exists" { (Get-Content "backend\src\server.js") -match 'jsonwebtoken' }
Write-Host ""

# ============================================================================
# 6. Frontend Configuration
# ============================================================================
Write-Host "🎨 Frontend Configuration:" -ForegroundColor Cyan
Test-Check "next.config.js exists" { Test-Path "frontend\next.config.js" }
Test-Check "tailwind.config.js exists" { Test-Path "frontend\tailwind.config.js" }
Test-Check "vercel.json exists" { Test-Path "frontend\vercel.json" }
Write-Host ""

# ============================================================================
# 7. Docker Configuration
# ============================================================================
Write-Host "🐳 Docker Configuration:" -ForegroundColor Cyan
Test-Check "Backend Dockerfile exists" { Test-Path "backend\Dockerfile" }
Test-Check "Frontend Dockerfile exists" { Test-Path "frontend\Dockerfile" }
Test-Check "docker-compose.yml exists" { Test-Path "docker-compose.yml" }
Write-Host ""

# ============================================================================
# 8. Deployment Documentation
# ============================================================================
Write-Host "📚 Deployment Documentation:" -ForegroundColor Cyan
Test-Check "Deployment guide exists" { Test-Path "DEPLOYMENT_TO_PRODUCTION.md" }
Test-Check "Vercel guide exists" { Test-Path "VERCEL_DEPLOYMENT_GUIDE.md" }
Test-Check "Render guide exists" { Test-Path "RENDER_DEPLOYMENT_GUIDE.md" }
Test-Check "Railway guide exists" { Test-Path "RAILWAY_DEPLOYMENT_GUIDE.md" }
Test-Check "Quick reference exists" { Test-Path "DEPLOYMENT_QUICK_REFERENCE.md" }
Write-Host ""

# ============================================================================
# Summary
# ============================================================================
Write-Host "════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
$results = "Results: $pass Passed | $fail Failed | $warn Warnings"
Write-Host $results -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($fail -eq 0) {
    Write-Host "✓ All critical checks passed! The website is ready for deployment." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Choose your backend platform (Render or Railway)"
    Write-Host "2. Choose your frontend platform (Vercel recommended for Next.js)"
    Write-Host "3. Follow the appropriate deployment guide:"
    Write-Host "   - Frontend: Read VERCEL_DEPLOYMENT_GUIDE.md"
    Write-Host "   - Backend:  Read RENDER_DEPLOYMENT_GUIDE.md or RAILWAY_DEPLOYMENT_GUIDE.md"
    Write-Host ""
    exit 0
} else {
    Write-Host "✗ Some critical checks failed. Please fix the issues above." -ForegroundColor Red
    Write-Host ""
    exit 1
}
