# Production Deployment Guide - Willy Collection Sneaker Store

## 📋 Current Status

✅ **Application is production-ready** with:

- Security hardening (CSP, HSTS, auth middleware)
- Performance optimization (gzip compression, image optimization)
- Database seeding (brands, categories, banners, mega-menu items)
- Comprehensive error handling and logging
- Docker support (Dockerfile included for both services)

## 🚀 Deployment Options

### Option 1: Node.js Production (Current - No Docker Required)

**Frontend and Backend are currently running:**

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

**To keep them running:**

- Ensure `npm run start` continues in both directories
- Monitor logs in terminal

### Option 2: Docker Compose Deployment

**Prerequisites:**

```bash
# Install Docker and Docker Compose
# https://docs.docker.com/get-docker/
# https://docs.docker.com/compose/install/
```

**Deploy:**

```bash
cd "C:\Data\Willy Collection website"
docker-compose up -d
```

**Verify:**

```bash
docker-compose ps
docker-compose logs -f
```

### Option 3: Cloud Deployment (AWS, DigitalOcean, Heroku, etc.)

**Required setup:**

1. Create production database (PostgreSQL recommended over SQLite)
2. Set up environment variables in cloud platform
3. Push code to GitHub/GitLab
4. Connect repository to deployment service
5. Configure CI/CD pipeline

**Key environment variables:**

```
NODE_ENV=production
JWT_SECRET=<generate-strong-secret>
DATABASE_URL=<production-database-url>
NEXT_PUBLIC_API_URL=<api-domain-url>
AWS_ACCESS_KEY_ID=<your-key> (if using S3)
AWS_SECRET_ACCESS_KEY=<your-secret> (if using S3)
```

## 📊 Architecture

```
┌─────────────────────────────────────────────────┐
│         Frontend (Next.js on port 3000)         │
│  - Client pages (/products, /categories, etc)   │
│  - Admin panel (/admin/dashboard, /admin/...)   │
│  - Image optimization                           │
│  - Static generation & caching                  │
└────────────────┬────────────────────────────────┘
                 │ (API calls)
┌────────────────┴────────────────────────────────┐
│        Backend API (Express on port 4000)       │
│  - REST endpoints (/api/sneakers, /api/...)     │
│  - Authentication (JWT)                         │
│  - Database (SQLite/PostgreSQL)                 │
│  - File uploads (local/S3)                      │
│  - Rate limiting & security middleware          │
└─────────────────────────────────────────────────┘
```

## 🔐 Security Checklist

- ✅ CSP headers hardened (no 'unsafe-inline')
- ✅ HSTS enabled for HTTPS
- ✅ CORS whitelist configured
- ✅ Rate limiting active
- ✅ Input validation on all routes
- ✅ Auth middleware on admin routes
- ✅ Secure password hashing (bcrypt)
- ✅ JWT token-based authentication
- ✅ Environment variables for secrets (not hardcoded)

**Before production:**

- [ ] Change JWT_SECRET
- [ ] Update ALLOWED_ORIGINS with real domain
- [ ] Enable HTTPS/SSL certificate
- [ ] Set up database backups
- [ ] Configure error monitoring (Sentry, etc.)
- [ ] Set up log aggregation (ELK, DataDog, etc.)

## 📈 Performance Features

- ✅ Gzip compression middleware
- ✅ Database indexes on frequently queried fields
- ✅ Image optimization (Next.js Image component)
- ✅ Client-side caching (SWR)
- ✅ Static page generation
- ✅ Efficient API response formats

## 🗄️ Database

**Development:** SQLite (file: `backend/dev.db`)

**Production options:**

1. **SQLite** (simple, no separate server)
   - Good for small-medium deployments
   - Use: `DATABASE_URL=file:/data/prod.db` with volume mounts

2. **PostgreSQL** (recommended for production)
   - Better concurrency and scaling
   - Set: `DATABASE_URL=postgresql://user:password@host:5432/dbname`

3. **MySQL/MariaDB**
   - Adjust Prisma schema provider

**Migration on new database:**

```bash
cd backend
npx prisma migrate deploy
npm run seed-brands-safe
npm run seed-banners
```

## 📱 Admin Access

**Default credentials:**

- Email: `admin@example.com`
- Password: `password123`

**Change immediately after deployment:**

1. Login at `/admin/login`
2. Navigate to settings
3. Update admin credentials

## 🔗 API Endpoints

| Method | Endpoint          | Purpose             |
| ------ | ----------------- | ------------------- |
| GET    | `/api/health`     | Server health check |
| GET    | `/api/sneakers`   | List all sneakers   |
| GET    | `/api/categories` | List categories     |
| GET    | `/api/brands`     | List brands         |
| GET    | `/api/banners`    | List banners        |
| POST   | `/api/orders`     | Create order        |
| POST   | `/api/auth/login` | Admin login         |

## 📊 Monitoring & Logs

**View production logs:**

```bash
# Docker Compose
docker-compose logs -f backend
docker-compose logs -f frontend

# Direct Node.js
# Check terminal output where npm start was run
```

**Health check:**

```bash
curl http://localhost:4000/api/health
```

## 🚨 Troubleshooting

**Port already in use:**

```bash
# Windows
taskkill /F /IM node.exe

# Linux/Mac
killall node
```

**Database issues:**

```bash
# Rebuild database
rm backend/dev.db
npx prisma migrate deploy
npm run seed-brands-safe
npm run seed-banners
```

**Frontend not connecting to backend:**

- Check `NEXT_PUBLIC_API_URL` environment variable
- Ensure backend is running on correct port
- Check CORS settings in backend

## 📞 Support

For issues or questions:

1. Check application logs
2. Review error messages in browser DevTools
3. Verify environment variables are set correctly
4. Check database connectivity

## 🎯 Next Steps

1. **Immediate:**
   - Keep current Node.js deployment running
   - Monitor application for errors

2. **Short-term (1-2 weeks):**
   - Set up proper database backups
   - Configure monitoring/alerting
   - Add SSL certificate for HTTPS

3. **Medium-term (1-3 months):**
   - Consider Docker deployment
   - Migrate to PostgreSQL if scaling
   - Set up CI/CD pipeline

4. **Long-term:**
   - Implement caching layer (Redis)
   - Add CDN for static assets
   - Scale with load balancer

---

**Deployment Date:** February 19, 2026
**Status:** ✅ Production Ready
**Version:** Latest (with full audit & hardening)
