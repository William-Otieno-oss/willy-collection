# Production Deployment Guide

## Pre-Deployment Checklist

### Security

- [ ] Change `JWT_SECRET` to a strong random value (min 32 characters)
- [ ] Set `NODE_ENV=production`
- [ ] Update `ALLOWED_ORIGINS` to your domain(s)
- [ ] Remove all `.env` files from git (check `.gitignore`)
- [ ] Ensure HTTPS/TLS is configured on your reverse proxy
- [ ] Set up rate limiting headers in your reverse proxy
- [ ] Configure CORS properly on your domain

### Database

- [ ] Back up existing database
- [ ] Run `npx prisma migrate deploy` to apply all migrations
- [ ] Verify database indexes are created
- [ ] Set up automated database backups
- [ ] Test database recovery process

### Frontend

- [ ] Update `NEXT_PUBLIC_API_URL` to production API URL
- [ ] Run full test suite: `npm run build && npm run start`
- [ ] Verify all pages load successfully
- [ ] Test API calls with real backend
- [ ] Verify static assets load correctly

### Backend

- [ ] Set appropriate `LOG_LEVEL` (recommend "warn" in production)
- [ ] Configure AWS S3 if using cloud storage (`AWS_*` env vars)
- [ ] Ensure all required dependencies are installed
- [ ] Test with production database
- [ ] Verify all external services are accessible

### Infrastructure

- [ ] Docker images built and tested
- [ ] docker-compose.yml configured for production
- [ ] Environment files (.env.production) secured
- [ ] Reverse proxy (nginx/apache) configured
- [ ] SSL certificates installed
- [ ] Firewall rules configured
- [ ] Backup and disaster recovery plan in place

### Monitoring & Logging

- [ ] Set up application logging to centralized system (ELK, CloudWatch, etc.)
- [ ] Configure health check monitoring
- [ ] Set up alerting for errors and downtime
- [ ] Enable performance monitoring
- [ ] Plan for log retention and cleanup

### Performance

- [ ] Database connection pooling configured (if using PostgreSQL)
- [ ] CDN configured for static assets
- [ ] Image optimization verified
- [ ] Build output size reviewed (`npm run build`)
- [ ] Load testing completed

## Deployment Steps

### 1. Build Docker Images

```bash
docker build --target production -f backend/Dockerfile -t willy-backend:latest .
docker build --target production -f frontend/Dockerfile -t willy-frontend:latest .
```

### 2. Deploy with Docker Compose

```bash
# Create production environment file
cp .env.production.example .env.production
# Edit values as needed
nano .env.production

# Deploy
docker-compose -f docker-compose.yml up -d

# Check status
docker-compose ps
docker-compose logs -f
```

### 3. Verify Deployment

```bash
# Health checks
curl http://localhost:4000/api/health
curl http://localhost:3000/

# Database connectivity
docker-compose exec backend npx prisma db execute --stdin < /dev/null

# Check logs
docker-compose logs backend
docker-compose logs frontend
```

### 4. Post-Deployment

- [ ] Monitor logs for errors
- [ ] Test user login flow
- [ ] Create test order
- [ ] Verify email notifications (if enabled)
- [ ] Monitor memory and CPU usage
- [ ] Set up automated backups

## Rollback Procedure

If deployment fails:

```bash
# Stop current deployment
docker-compose down

# Restore previous version
docker pull willy-backend:stable
docker pull willy-frontend:stable

# Restart with previous version
docker-compose up -d

# Restore database from backup if needed
```

## Production Environment Variables

Always use strong, random values:

```bash
# Generate strong JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Maintenance

### Regular Tasks

- Review logs weekly for errors
- Monitor database size
- Update dependencies monthly
- Test backup recovery process quarterly
- Review and update security policies

### Emergency Contacts

- Ops team: [contact info]
- On-call rotation: [rotation schedule]
- Escalation procedure: [escalation path]

## References

- [OWASP Security Best Practices](https://owasp.org)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
