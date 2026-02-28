# Railway Deployment Guide

Railway ([https://railway.app](https://railway.app)) offers simplicity and flexibility for deploying Node.js and PostgreSQL applications. This guide covers deploying your Willy Collection API to Railway.

## Prerequisites

- GitHub account with repository pushed
- Railway.app account (GitHub signin)
- (Optional) Custom domain

## Step-by-Step Deployment

### Step 1: Create Project on Railway

1. Go to [https://railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Select **"GitHub Repo"**
4. Authorize GitHub if prompted
5. Select your repository

### Step 2: Add PostgreSQL Database

1. In your Railway project dashboard, click **"Add Service"**
2. Select **"PostgreSQL"**
3. Railway automatically creates the database and DATABASE_URL env var
4. No configuration needed - Railway handles everything

### Step 3: Deploy Backend Service

1. Click **"Add Service"** → **"GitHub Repo"** again
2. Select same repository
3. Configure:
   - **Service Name**: `willy-api`
   - **Deploy from**: Select repository
   - **Root Directory**: `backend` (important!)
   - **Environment**: Node (auto-detected)

### Step 4: Set up Build & Start Commands

In the service settings, configure:

```
Build Command:    npm install
Start Command:    npm run prod
```

Or for automatic migrations:

```
Build Command:    npm install && npx prisma migrate deploy && npm run seed
Start Command:    npm run prod
```

### Step 5: Add Environment Variables

Click on your backend service → **"Variables"** and add:

```env
NODE_ENV=production
JWT_SECRET=<generate-32-char-random-string>
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong-12+-char-password>
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
LOG_LEVEL=info
PORT=3001
```

**Important**: Railway automatically provides `DATABASE_URL` from the PostgreSQL service - do NOT manually add it.

### Step 6: Trigger Initial Deployment

1. Click **"Deploy"** to start the deployment
2. Monitor logs in the Railway dashboard
3. Wait for green "Active" status
4. Your backend URL will be displayed (looks like: `https://willy-api-prod-xxxxx.railway.app`)

### Step 7: Run Initial Database Setup

If you didn't include migrations in the build command, run them manually:

1. In Railway dashboard, click your backend service
2. Click **"Shell"** tab (top right)
3. Run:
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```

## Verify Deployment

```bash
# Replace with your Railway URL
BACKEND_URL="https://your-railway-backend-url.railway.app"

# Test health endpoint
curl $BACKEND_URL/api/health
# Expected response: {"ok":true,"timestamp":"2026-02-28T...","uptime":[number],"environment":"production"}

# Test readiness
curl $BACKEND_URL/ready
# Expected response: {"ready":true}

# Test login endpoint
curl -X POST $BACKEND_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'
# Expected response: {"success":true,"token":"eyJhbGciOiJIUzI1NiIs...","admin":{...}}
```

## Environment Variables Table

| Variable                  | Purpose                      | Example                  |
| ------------------------- | ---------------------------- | ------------------------ |
| `NODE_ENV`                | Application environment      | `production`             |
| `JWT_SECRET`              | Token signing secret         | Random 32-char base64    |
| `ADMIN_EMAIL`             | Initial admin email          | `admin@example.com`      |
| `ADMIN_PASSWORD`          | Initial admin password       | Strong secure password   |
| `ALLOWED_ORIGINS`         | CORS allowed domains         | `https://yourdomain.com` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window      | `100`                    |
| `RATE_LIMIT_WINDOW_MS`    | Rate limit window (ms)       | `900000`                 |
| `PORT`                    | Port (Railway sets this)     | `3001`                   |
| `DATABASE_URL`            | PostgreSQL connection string | Auto-provided by Railway |

## Troubleshooting

### Build fails with "npm not found"

- Check **Root Directory** is set to `backend`
- Ensure `package.json` exists in the backend folder

### "Connect ECONNREFUSED" errors

- Database hasn't started yet - wait 30 seconds and retry
- DATABASE_URL wasn't auto-injected - check PostgreSQL service is linked

### 502 Bad Gateway / Application crashes

- Check service logs (Railway dashboard → Logs)
- Verify all environment variables are set
- Check NODE_ENV=production is set
- Look for database connection errors

### Can't connect to database

- Copy DATABASE_URL from PostgreSQL service variables
- Verify it's in the backend service environment
- Check PostgreSQL service is in "Active" state

### Need to view logs

Click service → **"Logs"** tab to see real-time application output

## Auto-Deploy Setup

Railway auto-deploys when code is pushed:

1. Make your changes locally
2. Run:
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```
3. Railway automatically detects changes and redeploys
4. Monitor progress in Railway dashboard (Deployments tab)

**Disable auto-deploy** if needed in Service Settings → Deployment

## Database Backups

Railway doesn't provide automatic backups on free tier. For production:

1. Use [pgbackrest](https://pgbackrest.org/) to backup manually
2. Or upgrade to a paid plan that includes backups
3. Or use third-party tools like [pgAdmin](https://www.pgadmin.org/)

### Manual Database Backup

```bash
# From Railway Shell, dump database:
pg_dump $DATABASE_URL > backup.sql

# Download from Railway file system
```

## Production Checklist

- [ ] PostgreSQL service is deployed and active
- [ ] Backend service is deployed and active
- [ ] All environment variables are correctly set
- [ ] Database migrations completed successfully
- [ ] Health check endpoint (/api/health) responds
- [ ] Can log in with admin credentials
- [ ] Frontend is configured with correct BACKEND_URL
- [ ] Logs have been reviewed for errors
- [ ] Backup plan is in place
- [ ] Custom domain set up (optional)

## Scaling on Railway

### Increase Resources

1. Service Settings → Plan
2. Select higher tier (Hobby, Pro, Team)
3. Resources increase (may restart service)

### Multiple Instances

1. Service Settings → Deploy
2. Set "Number of Replicas"
3. Railway load-balances automatically

### Connect Custom Domain

1. Service Settings → Custom Domain
2. Add your domain (e.g., `api.yourdomain.com`)
3. Update DNS records as instructed

## Cost on Railway

- **Free tier**: Limited (good for testing)
- **Hobby ($5/month)**: Limited resources
- **Pro ($20+/month)**: Production-grade
- **Scale as needed**: Pay per usage

Start with Hobby plan for most use cases.

## Next Steps

1. ✅ Backend deployed on Railway
2. → Deploy frontend on Vercel (see DEPLOYMENT_TO_PRODUCTION.md)
3. → Update frontend NEXT_PUBLIC_API_URL to Railway backend URL
4. → Update ALLOWED_ORIGINS on Railway with Vercel domain
5. → Test full application flow
6. → Set up monitoring (Sentry, LogRocket, etc.)

## Support & Documentation

- Railway Docs: [https://docs.railway.app](https://docs.railway.app)
- Discord Community: [https://discord.gg/railway](https://discord.gg/railway)
- Contact: [support@railway.app](mailto:support@railway.app)
