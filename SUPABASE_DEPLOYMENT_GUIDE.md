# Supabase Backend Deployment Guide

## Overview

Supabase provides PostgreSQL database hosting and authentication services. This guide covers:

- **Database Migration**: Moving from local PostgreSQL to Supabase
- **Authentication**: Using Supabase Auth or keeping JWT-based auth
- **Prisma ORM**: Connecting to Supabase PostgreSQL via Prisma
- **Supabase Functions**: Deploying backend API as serverless functions (optional)

---

## Part 1: Supabase Setup

### Step 1: Create Supabase Account & Project

1. **Go to Supabase**: https://supabase.com
2. **Sign up/Login** with GitHub (recommended)
3. **Create a New Project**
   - Organization: Create new or select existing
   - Project name: `willy-collection-api`
   - Database password: **Save this securely** (12+ chars, mixed case, numbers, symbols)
   - Region: Select closest to your users
   - Click "Create new project"

### Step 2: Get Your Database Credentials

Once project is created:

1. Go to **Project Settings** → **Database**
2. Copy these credentials (save in secure location):
   - **Host**: `db.{random-id}.supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: Your database password
   - **Connection String** (IMPORTANT - copy full string):
     ```
     postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
     ```

### Step 3: Enable PostgreSQL Extensions

In Supabase Dashboard:

1. Go to **Database** → **Extensions**
2. Enable these extensions:
   - `uuid-ossp` (for UUID generation)
   - `pgcrypto` (for cryptography)
   - `pg_stat_statements` (for monitoring)

---

## Part 2: Local Database Migration

### Step 1: Backup Current Database

```bash
# Windows - in backend directory
npm run db:backup
# Or manually:
pg_dump -U postgres -d sneaker_store > backup.sql
```

### Step 2: Configure Prisma Connection

Update `backend/.env.local`:

```env
# Supabase PostgreSQL Connection
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres?sslmode=require"

# Keep other environment variables
NODE_ENV=production
JWT_SECRET=[your-jwt-secret]
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=[your-admin-password]

# Cloudflare setup (we'll configure this in next section)
BACKEND_URL=https://api.yourdomain.com
```

**Important**: `?sslmode=require` is required for Supabase connections over internet.

### Step 3: Run Migrations on Supabase

```bash
cd backend

# Install dependencies
npm install

# Run all migrations
npx prisma migrate deploy

# Seed the database
npm run seed

# Verify connection
npx prisma db execute --stdin < check_connection.sql
```

After migrations, verify in Supabase Dashboard:

1. Go to **SQL Editor**
2. Run: `SELECT COUNT(*) FROM "Category";` - should return category count
3. Run: `SELECT COUNT(*) FROM "User";` - should return user count

---

## Part 3: Deploying Backend (Choose One)

### Option A: Supabase Functions (Recommended - Serverless)

Supabase Functions allow you to deploy Node.js code without managing servers.

#### Setup Supabase CLI

```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Login to Supabase
supabase login

# Link project
cd backend
supabase link --project-ref [PROJECT-ID]
```

#### Deploy as Function

```bash
# Create a new function
supabase functions new api

# Copy your Express routes to Supabase function format
# This requires restructuring Express app to work with serverless
```

**Note**: Full Express app restructuring needed for Supabase Functions.

---

### Option B: Keep Express on Render/Railway + Use Supabase DB (Recommended for Now)

Deploy Express backend on Render or Railway while using Supabase for database:

1. **Choose Platform**: Render (easier) or Railway
2. **Create New Web Service**:
   - Connect GitHub repository
   - Select `backend` as root directory
   - Set Environment: `Node`
   - Add environment variable:
     ```
     DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres?sslmode=require
     ```
   - Click Deploy

3. **Get API URL**: `https://willy-collection-api.render.com` (or Railway equivalent)

---

### Option C: Docker Deployment on Cloud VM

For maximum control and cost efficiency:

```bash
# Build Docker image
docker build -t willy-api .

# Push to Docker registry (Docker Hub, Google Cloud Registry, etc.)
docker push [your-registry]/willy-api:latest

# Deploy to your cloud VM and use Supabase connection string
```

---

## Part 4: Testing Database Connection

Create `backend/test-supabase.js`:

```javascript
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("Testing Supabase connection...");

    // Test query
    const categories = await prisma.category.findMany({ take: 5 });
    console.log("✅ Connected! Found categories:", categories.length);

    // Test user query
    const users = await prisma.user.findMany();
    console.log("✅ Users:", users.length);

    console.log("\n✅ All tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
```

Run test:

```bash
node test-supabase.js
```

---

## Part 5: Supabase Authentication (Optional)

If you want to use Supabase Auth instead of JWT:

### Enable Auth in Supabase Dashboard

1. Go to **Authentication** → **Providers**
2. Enable:
   - Email (default)
   - Google OAuth
   - GitHub OAuth (if desired)

### Update Backend Auth

Create `backend/src/middleware/supabaseAuth.js`:

```javascript
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

async function verifySupabaseToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw error;

    req.user = data.user;
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

module.exports = { verifySupabaseToken };
```

**OR** keep your existing JWT authentication (simpler, less refactoring needed).

---

## Part 6: Environment Variables for Supabase

### Required Variables

```env
# Supabase Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres?sslmode=require"

# Optional: If using Supabase Auth
SUPABASE_URL="https://[PROJECT-ID].supabase.co"
SUPABASE_ANON_KEY="eyJhbGc..."

# Backend settings
NODE_ENV=production
JWT_SECRET=[generate-new-secret]
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=[secure-password]

# CORS (will be enforced by Cloudflare)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Server
PORT=3001
```

---

## Part 7: Monitoring & Backups

### Enable Automatic Backups

In Supabase Dashboard:

1. **Database** → **Backups**
2. Enable automatic daily backups
3. Set retention to 30 days

### Monitor Database

1. **Monitoring** tab shows:
   - Queries per second
   - Connection count
   - Database size
   - Performance metrics

2. **SQL Editor** for direct queries
3. **Logs** for debugging

---

## Part 8: Common Issues & Solutions

### Connection Refused

```
Error: connect ECONNREFUSED
```

**Solution**: Check that:

- Database password is correct
- `?sslmode=require` is in connection string
- Firewall allows outgoing connections on port 5432
- Supabase project is not paused

### SSL Certificate Error

```
Error: self signed certificate
```

**Solution**: Ensure connection string includes `?sslmode=require`

### Too Many Connections

```
Error: too many connections
```

**Solution**:

- Supabase free tier allows 10 connections
- Use connection pooling (PgBouncer)
- Enable in Supabase: **Database** → **Connection pooling** → Set to `Transaction` mode

---

## Part 9: Deployment Checklist

- [ ] Supabase account created
- [ ] Database credentials saved securely
- [ ] Prisma configured with Supabase URL
- [ ] Migrations successfully applied
- [ ] Database seeded with initial data
- [ ] Connection test passed
- [ ] Backend deployed (Render/Railway/Docker)
- [ ] Environment variables set on hosting platform
- [ ] Backend API accessible from frontend
- [ ] Cloudflare configured (see next guide)
- [ ] SSL certificate active
- [ ] Database backups enabled
- [ ] Monitoring dashboard accessible

---

## Costs

### Supabase Pricing (as of 2026)

| Feature      | Free Tier | Pro Tier  |
| ------------ | --------- | --------- |
| Database     | 500 MB    | Unlimited |
| Auto-backups | Disabled  | Daily     |
| Connections  | 10        | Unlimited |
| Cost         | $0        | $25/month |

**Recommendation**: Start on Free, upgrade to Pro when ready for production ($25/month includes all features).

---

## Next Steps

1. **Proceed to Cloudflare Security Setup** (SECURITY_CLOUDFLARE_SETUP.md)
2. **Configure API Domain** with Cloudflare
3. **Test full deployment** with frontend
4. **Monitor performance** in Supabase dashboard

---

## Support & Documentation

- **Supabase Docs**: https://supabase.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs
- **Connection Pooling**: https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling
