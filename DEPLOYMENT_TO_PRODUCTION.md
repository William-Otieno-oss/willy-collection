# Deployment to Production Guide

## Overview

This guide covers deploying the Willy Collection sneaker store to production:

- **Frontend**: Vercel (Next.js optimized)
- **Backend**: Render or Railway (Node.js + PostgreSQL)

## Prerequisites

- GitHub account with repository access
- Vercel account (free tier sufficient)
- Render or Railway account (production database required)
- Domain name (optional, but recommended)

---

## Part 1: Backend Deployment (Render or Railway)

### Option A: Deploy to Render

#### Step 1: Prepare Backend

1. Ensure `.env.example` documents all required variables
2. Commit all code to GitHub

#### Step 2: Create PostgreSQL Database on Render

1. Go to [render.com](https://render.com)
2. Sign up / Log in
3. Click **New +** → **PostgreSQL**
4. Configure:
   - **Name**: `willy-collection-db`
   - **Database**: `willy_production`
   - **User**: `postgres`
   - **Region**: Select closest to your users
   - **Plan**: Standard (production) or Free (testing)
5. Copy the **Internal Database URL** (use for backend)
6. Copy the **External Database URL** (use for migrations)

#### Step 3: Create Backend Service

1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `willy-collection-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma migrate deploy && npm run seed`
   - **Start Command**: `npm run prod`
   - **Root Directory**: `backend`

#### Step 4: Set Environment Variables

In Render dashboard, add these environment variables:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=<generate-secure-32-char-string>
DATABASE_URL=<postgresql-internal-url-from-step-2>
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<generate-strong-password>
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
S3_REGION=us-east-1
S3_BUCKET=willy-collection-prod
```

#### Step 5: Deploy

- Render auto-deploys when code is pushed to main branch
- Monitor logs in Render dashboard
- Wait for database migration to complete

### Option B: Deploy to Railway

#### Step 1: Create PostgreSQL Database on Railway

1. Go to [railway.app](https://railway.app)
2. Sign up / Log in
3. Create new project
4. Add PostgreSQL plugin
5. Copy `DATABASE_URL` from the PostgreSQL service

#### Step 2: Deploy Backend Service

1. Click **New** → **GitHub Repo**
2. Select your repository
3. Configure:
   - **Root Directory**: `backend`
4. Add environment variables (same as Render above)
5. Set start command: `npm run prod`

#### Step 3: Verify Deployment

- Check Railway logs for successful startup
- Run readiness check: `curl https://your-backend-url/ready`

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

1. Update `frontend/next.config.js` to remove development rewrites
2. Ensure `NEXT_PUBLIC_API_URL` is properly set
3. Commit to GitHub

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up / Log in with GitHub
3. Click **Import Project**
4. Select your repository
5. Configure:
   - **Framework**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Set Production Environment Variables

In Vercel dashboard, add:

```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

### Step 4: Deploy Custom Domain (Optional)

1. Go to project **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

---

## Part 3: Environment Variable Setup

### Generate Secure JWT Secret

```bash
# On macOS/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))
```

### Security Checklist

- [ ] JWT_SECRET is 32+ characters
- [ ] ADMIN_PASSWORD is strong (12+ chars, mixed case, numbers, symbols)
- [ ] ALLOWED_ORIGINS includes your domain only
- [ ] DATABASE_URL is kept secret (never in git)
- [ ] S3 credentials (if using) are environment variables only

---

## Part 4: Post-Deployment Verification

### Test Backend Endpoints

```bash
# Health check
curl https://your-backend-url/api/health

# Readiness check
curl https://your-backend-url/ready

# Test login (should work with seeded admin account)
curl -X POST https://your-backend-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-admin-password"}'
```

### Test Frontend

1. Visit `https://yourdomain.com`
2. Verify sneakers load
3. Test login with admin credentials
4. Test adding to cart
5. Test API calls in browser console

### Monitor Performance

- Check Vercel Analytics dashboard
- Review Render/Railway logs for errors
- Monitor database connection pool

---

## Part 5: Backup & Database Access

### Connect to Production Database Directly

```bash
# Using psql (install: brew install postgresql on macOS)
psql "your-database-url"

# Query example
SELECT * FROM "User" LIMIT 5;
```

### Automatic Backups

- Render: Automatic daily backups (configurable)
- Railway: Configurable retention period

---

## Troubleshooting

### Frontend not connecting to backend

- Check `NEXT_PUBLIC_API_URL` in Vercel
- Verify backend ALLOWED_ORIGINS includes frontend domain
- Check browser console for CORS errors

### Database connection errors

- Verify DATABASE_URL is correct
- Check database is running and accessible
- Review Prisma migration logs

### 502 / Service Unavailable

- Check backend logs on Render/Railway
- Verify NODE_ENV=production is set
- Ensure health check endpoint responds

### Admin login fails

- Verify ADMIN_PASSWORD matches seeded value
- Check JWT_SECRET is consistent
- Review auth logs on backend

---

## Rolling Back

### Vercel Rollback

1. Go to **Deployments**
2. Find previous successful deployment
3. Click **...** menu → **Promote to Production**

### Render/Railway Rollback

1. Click on previous deployment
2. Click **Redeploy**

---

## Next Steps

1. Set up monitoring (Sentry, LogRocket, etc.)
2. Configure CDN for static assets
3. Enable SSL/TLS (automatic on Vercel/Render)
4. Set up email notifications for errors
5. Plan regular database backups
6. Configure CI/CD for automated testing
