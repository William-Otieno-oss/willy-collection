# Quick Start Guide - Production Deployment

**TL;DR for experienced DevOps teams**

---

## 30-Second Deploy

### Prerequisites

- Docker & Docker Compose installed
- Environment variables configured
- Database provisioned (PostgreSQL 14+)
- Domain & SSL certificate ready

### Deploy

```bash
# 1. Clone and setup
git clone <repo>
cd "Willy Collection website"
cp .env.example .env
# Edit .env with your values

# 2. Build and deploy
docker-compose build
docker-compose up -d

# 3. Verify
curl http://localhost:4000/api/health
curl http://localhost:3000
```

---

## Critical Configuration

```bash
# .env requirements (minimum)
JWT_SECRET=your-secret-key-min-32-chars
DATABASE_URL=postgresql://user:pass@host:5432/dbname
ALLOWED_ORIGINS=https://yourdomain.com
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

---

## Platform-Specific Commands

### AWS ECS

```bash
# 1. Create ECR repositories
aws ecr create-repository --repository-name willy-backend
aws ecr create-repository --repository-name willy-frontend

# 2. Build and push
docker build -t willy-backend ./backend
docker tag willy-backend:latest <ACCOUNT>.dkr.ecr.<REGION>.amazonaws.com/willy-backend:latest
docker push <ACCOUNT>.dkr.ecr.<REGION>.amazonaws.com/willy-backend:latest

# 3. Create ECS cluster
aws ecs create-cluster --cluster-name willy-prod

# 4. Create task definitions and services
# (See DEPLOYMENT_GUIDE_PRODUCTION.md for full commands)
```

### DigitalOcean App Platform

```bash
# 1. Login
doctl auth init

# 2. Create app.yaml
cat > app.yaml <<EOF
name: willy-collection
services:
- name: backend
  github:
    branch: main
    repo: your-org/repo
  envs:
  - key: DATABASE_URL
    value: postgresql://...
- name: frontend
  github:
    branch: main
    repo: your-org/repo
  envs:
  - key: NEXT_PUBLIC_API_URL
    value: https://api.yourdomain.com
EOF

# 3. Deploy
doctl apps create --spec app.yaml
```

### Google Cloud Run

```bash
# 1. Authenticate
gcloud auth login
gcloud config set project your-project-id

# 2. Build and push backend
gcloud builds submit --tag gcr.io/project-id/willy-backend ./backend
gcloud run deploy willy-backend \
  --image gcr.io/project-id/willy-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=postgresql://...

# 3. Build and push frontend
gcloud builds submit --tag gcr.io/project-id/willy-frontend ./frontend
gcloud run deploy willy-frontend \
  --image gcr.io/project-id/willy-frontend \
  --platform managed \
  --region us-central1 \
  --set-env-vars NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## Database Setup

### PostgreSQL (Recommended)

```bash
# Local development
docker run --name willy-db -e POSTGRES_PASSWORD=password -d postgres:14

# Production
# Use managed service (AWS RDS, DigitalOcean Database, GCP Cloud SQL)
# Connection string: postgresql://user:pass@host:5432/willy_prod

# Initialize database
DATABASE_URL="postgresql://..." npm run migrate:prod
```

### MySQL/MariaDB

```bash
# Update DATABASE_URL
DATABASE_URL="mysql://user:pass@host:3306/willy_prod"

# Initialize
DATABASE_URL="postgresql://..." npm run migrate:prod
```

---

## SSL/TLS Setup

### Let's Encrypt (Free)

```bash
# Using Certbot
certbot certonly --standalone \
  -d yourdomain.com \
  -d api.yourdomain.com \
  --email your-email@example.com

# Copy certificates
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/

# Auto-renewal cron
0 3 * * * certbot renew --quiet
```

### AWS Certificate Manager

```bash
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names api.yourdomain.com \
  --validation-method DNS
```

---

## Health Checks

```bash
# Backend
curl -X GET http://localhost:4000/api/health
# Expected: 200 OK

# Frontend
curl -X GET http://localhost:3000
# Expected: 200 OK

# Database
docker-compose exec backend node -e "const db = require('./src/db'); console.log('DB OK')"

# All containers
docker-compose ps
```

---

## Monitoring Setup

### Logs

```bash
# Docker Compose
docker-compose logs -f

# AWS CloudWatch
aws logs tail /ecs/willy-backend --follow

# DigitalOcean
doctl apps logs <app-id>

# Google Cloud
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

### Metrics

```bash
# CPU & Memory (Docker)
docker stats

# AWS CloudWatch Metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ClusterName,Value=willy-prod

# Prometheus endpoint (if configured)
curl http://localhost:9090/metrics
```

---

## Common Commands

```bash
# Restart services
docker-compose restart

# View logs
docker-compose logs backend
docker-compose logs frontend

# Scale containers
docker-compose up -d --scale backend=3

# Execute migrations
docker-compose exec backend npm run migrate:prod

# Backup database
docker-compose exec postgres pg_dump -U postgres willy_prod > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U postgres willy_prod

# Stop services
docker-compose down

# Full cleanup
docker-compose down -v
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process
lsof -i :4000
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Database Connection Failed

```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql "$DATABASE_URL"

# Check Docker network
docker-compose exec backend curl http://postgres:5432
```

### High Memory Usage

```bash
# Check memory allocation
docker stats

# Increase Docker memory limit
# Edit docker-compose.yml:
#   mem_limit: 1024m
```

### No Logs Appearing

```bash
# Check log driver
docker inspect <container> | grep -i log

# View driver logs
docker-compose logs --driver stdout backend
```

---

## Performance Tuning

### Database Connection Pool

```bash
# In .env
DATABASE_CONNECTION_LIMIT=10
DATABASE_IDLE_TIMEOUT=30000
```

### Rate Limiting

```bash
# In .env
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100
```

### Cache Settings

```bash
# In .env (if using Redis)
REDIS_URL=redis://redis:6379
CACHE_TTL=3600
```

---

## Rollback Procedure

```bash
# 1. Tag current images
docker tag willy-backend:latest willy-backend:v1.0.0
docker tag willy-frontend:latest willy-frontend:v1.0.0

# 2. Backup database
docker-compose exec postgres pg_dump -U postgres willy_prod > backup-$(date +%s).sql

# 3. If needed, restore from backup
cat backup-1708346000.sql | docker-compose exec -T postgres psql -U postgres willy_prod

# 4. Rollback images
docker-compose pull  # pulls specific version tags
docker-compose up -d
```

---

## Security Checklist

- [ ] All environment variables configured
- [ ] No hardcoded secrets in code
- [ ] SSL/TLS enabled
- [ ] Database credentials strong
- [ ] JWT_SECRET > 32 characters
- [ ] CORS configured with specific origins
- [ ] Rate limiting active
- [ ] Firewall rules configured
- [ ] Admin credentials reset
- [ ] Backups enabled
- [ ] Monitoring configured
- [ ] On-call rotation established

---

## Incident Response

**If everything is down:**

```bash
# Check status
docker-compose ps

# Restart
docker-compose restart

# If restart fails
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs | grep ERROR
```

**If database is corrupted:**

```bash
# Restore from backup
cat latest-backup.sql | docker-compose exec -T postgres psql -U postgres willy_prod

# Verify
docker-compose exec backend npm run migrate:prod
```

**If under attack (rate limiting):**

```bash
# Increase rate limits temporarily
# Edit .env: RATE_LIMIT_MAX=1000

# Or whitelist IP
# Add to firewall: iptables -A INPUT -s TRUSTED_IP -j ACCEPT
```

---

## Performance Baseline

After deployment, record these metrics:

| Metric               | Baseline | Alert Threshold |
| -------------------- | -------- | --------------- |
| API Response Time    | < 200ms  | > 1000ms        |
| Page Load Time       | < 2s     | > 5s            |
| Error Rate           | < 0.01%  | > 0.1%          |
| CPU Usage            | < 30%    | > 80%           |
| Memory Usage         | < 50%    | > 85%           |
| Disk Usage           | < 50%    | > 90%           |
| Database Connections | < 5      | > 20            |

---

## Useful Links

- [Full Deployment Guide](DEPLOYMENT_GUIDE_PRODUCTION.md)
- [Security Checklist](SECURITY_HARDENING_CHECKLIST.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
- [Production Audit](PRODUCTION_AUDIT_REPORT.md)
- [Production README](PRODUCTION_README.md)

---

## Support

**Documentation:** See DEPLOYMENT_GUIDE_PRODUCTION.md section 8
**Issues:** Check application logs with `docker-compose logs`
**Escalation:** Contact infrastructure team

**Last Updated:** February 19, 2026
**Status:** ✅ Production Ready
