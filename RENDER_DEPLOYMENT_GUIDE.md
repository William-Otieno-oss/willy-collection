# Render.com Backend Deployment Configuration

## Prerequisites

- GitHub account with repository access
- Render.com account (free or paid)
- PostgreSQL database (Render-managed or external)

## Step-by-Step Deployment

### 1. Create PostgreSQL Database Service on Render

```bash
Navigate to https://render.com/dashboard
1. Click "New +" → "PostgreSQL"
2. Fill in:
   - Name: willy-collection-db
   - Database: willy_production
   - User: postgres
   - Region: (Select closest to your location)
   - Plan: Standard (for production)
3. Click "Create Database"
4. **Important**: Save both URLs:
   - Internal Database URL (copy to backend env var DATABASE_URL)
   - External Database URL (only for psql connections, not for app)
```

### 2. Create Web Service for Backend

```bash
1. From Render dashboard, click "New +" → "Web Service"
2. Connect your GitHub repository:
   - If not connected, authorize GitHub access
   - Select your repository
3. Configure service:
   - Name: willy-collection-api
   - Environment: Node
   - Region: (Match database region)
   - Plan: Standard (for production)
4. Configure build and start commands:
```

Build Command: npm install
Start Command: node src/server.js

```
5. Click "Advanced" and add environment variables (see below)
6. Click "Create Web Service"
```

### 3. Add Environment Variables

In the Render dashboard for your web service, add these environment variables:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=<generate-with-openssl-rand-base64-32>
DATABASE_URL=<copy-internal-url-from-postgresql-service>
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong-password-12+-chars>
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
LOG_LEVEL=info
```

### 4. Setup Initial Database

After deployment starts, you need to run migrations ONE TIME:

```bash
# Option 1: Via Render Shell (if available)
1. Click "Shell" tab in service
2. Run: npx prisma migrate deploy

# Option 2: Via Custom Build Command (recommended)
Update your build command in Render to:
npm install && npx prisma migrate deploy && npm run seed
```

This will:

- Install dependencies
- Apply all database migrations
- Seed the initial admin user

### 5. Verify Deployment

```bash
# Get your backend URL from Render (looks like: https://willy-backend-xxxx.onrender.com)

# Test health endpoint
curl https://your-render-url/api/health
# Expected: {"ok":true,"timestamp":"...","uptime":...,"environment":"production"}

# Test readiness
curl https://your-render-url/ready
# Expected: {"ready":true}

# Test login endpoint
curl -X POST https://your-render-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password-here"}'
# Expected: {"success":true,"token":"...","admin":{...}}
```

## Environment Variables Explained

| Variable                  | Purpose                                 | Example                          |
| ------------------------- | --------------------------------------- | -------------------------------- |
| `NODE_ENV`                | Tells app it's in production            | `production`                     |
| `PORT`                    | Port to listen on (Render assigns this) | `10000`                          |
| `JWT_SECRET`              | Secret key for signing JWT tokens       | `base64-random-string`           |
| `DATABASE_URL`            | PostgreSQL connection string            | `postgresql://user:pass@host/db` |
| `ADMIN_EMAIL`             | Initial admin email                     | `admin@example.com`              |
| `ADMIN_PASSWORD`          | Initial admin password                  | Secure password                  |
| `ALLOWED_ORIGINS`         | Frontend domains (CORS)                 | `https://yourdomain.com`         |
| `RATE_LIMIT_MAX_REQUESTS` | Requests per window                     | `100`                            |
| `RATE_LIMIT_WINDOW_MS`    | Rate limit window (ms)                  | `900000` (15 mins)               |

## Troubleshooting Render Deployment

### Build fails with "npm not found"

- Ensure `root directory` is NOT set or is set to `.`
- Make sure you're deploying from the correct repo root

### Database connection timeout

- Verify DATABASE_URL is correct
- Check PostgreSQL service is running
- Ensure database name, user, and password are correct

### 502 Bad Gateway

- Check application logs in Render dashboard
- Verify PORT environment variable is set
- Confirm all required env vars are defined

### Static files not serving

- Backend serves uploads from `/uploads` directory
- Images are stored locally in `backend/uploads/`
- For production, consider uploading to S3 instead

### Need to run migrations manually

Click "Shell" in Render dashboard and run:

```bash
npx prisma migrate deploy
npm run seed
```

## Auto-Deploy from GitHub

Render automatically deploys when you push to main branch:

1. Make changes locally
2. Commit and push: `git push origin main`
3. Render detects changes and starts deploy automatically
4. Monitor progress in the Render dashboard

To disable auto-deploy:

- Service Settings → Auto-Deploy → Toggle OFF

## Database Backups

Render automatically backs up PostgreSQL databases:

- Free tier: 7-day retention
- Paid tier: Configurable retention
- Access backups: Database Service → Backups

## Scaling for Production

### Increase Resources

1. Service Settings → Plan
2. Select higher tier (Starter, Standard, Pro)
3. Scale restarts the service (brief downtime)

### Add a Cache Layer (Redis)

1. Create new Redis instance on Render
2. Add REDIS_URL to environment variables
3. Update code to use Redis for sessions

### Enable Custom Domain

1. Service Settings → Custom Domain
2. Add your domain
3. Update DNS records as instructed

## Production Checklist

- [ ] Database is on Standard (production) plan
- [ ] All environment variables are set
- [ ] JWT_SECRET is a strong, random string
- [ ] ALLOWED_ORIGINS includes your frontend domain
- [ ] Database migrations completed successfully
- [ ] Admin user created (check /api/health)
- [ ] Health check endpoint responds
- [ ] Monitored logs for first startup
- [ ] Backup plan is configured
- [ ] Custom domain is set up (if using)

## Cost Estimate (Render)

- **Web Service** (auto-scales): $7-28/month
- **PostgreSQL Database**: $15-30/month (Standard)
- **Total typical**: $22-58/month

Free tier available for testing (not production).

## Next Steps

1. Deploy frontend to Vercel (see DEPLOYMENT_TO_PRODUCTION.md)
2. Point frontend NEXT_PUBLIC_API_URL to your Render backend URL
3. Update ALLOWED_ORIGINS on Render with Vercel domain
4. Test full end-to-end flow (frontend → backend → database)
5. Monitor application logs for the first 24 hours
6. Set up error monitoring (Sentry recommended)
