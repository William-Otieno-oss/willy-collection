# Production Deployment Guide
**Willy Collection Website - Complete Deployment Instructions**

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Database Setup](#database-setup)
6. [SSL/HTTPS Configuration](#ssltls-configuration)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Recovery](#backup--recovery)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **OS:** Linux (Ubuntu 20.04+), macOS, or Windows with WSL2
- **Docker:** 20.10+
- **Docker Compose:** 1.29+
- **Node.js:** 20 LTS (for local development)
- **Git:** For version control
- **RAM:** 4GB minimum, 8GB recommended
- **Storage:** 20GB minimum

### Required Credentials
- AWS S3 access keys (optional, for image storage)
- Database credentials (if using managed database)
- Domain name and SSL certificate
- Email service credentials (future use)

---

## Local Development Setup

### 1. Clone the Repository
```bash
git clone <repository-url> willy-collection
cd willy-collection
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install

# Create development environment
cp .env.example .env.local
```

### 3. Configure Backend Environment
Edit `backend/.env.local`:
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=file:./dev.db
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
LOG_LEVEL=debug
```

### 4. Run Database Migrations
```bash
npm run prisma migrate dev --name init

# Create initial admin user (optional)
npm run prisma db seed
```

### 5. Start Backend Server
```bash
npm run dev
# Server runs at http://localhost:4000
```

### 6. Install Frontend Dependencies
```bash
cd ../frontend
npm install

# Create development environment
cp .env.example .env.local
```

### 7. Configure Frontend Environment
Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 8. Start Frontend Development Server
```bash
npm run dev
# Frontend runs at http://localhost:3000
```

### 9. Verify Setup
- Backend health: `curl http://localhost:4000/api/health`
- Frontend: Open `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin/login`

---

## Docker Deployment

### Quick Start (Development)

```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# View service status
docker-compose ps
```

### Building Custom Images

```bash
# Build without running
docker-compose build

# Build with no cache (clean build)
docker-compose build --no-cache

# Build specific service
docker-compose build backend
docker-compose build frontend
```

### Environment Configuration for Docker

Create `.env` file in project root:
```bash
cp .env.production.example .env

# Edit for your environment
nano .env
```

### Accessing Services

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **API Health:** http://localhost:4000/api/health
- **Admin Panel:** http://localhost:3000/admin/login

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Data Persistence

```bash
# Database stored in: ./data/
# Uploads stored in: ./uploads/
# Quarantine (scanned files): ./quarantine/

# Backup data directory
tar -czf backup-$(date +%Y%m%d).tar.gz data/ uploads/

# Restore data
tar -xzf backup-20260219.tar.gz
```

---

## Production Deployment

### Option 1: AWS ECS + RDS + S3

#### 1. Create IAM Role for ECS Task
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::willy-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken"
      ],
      "Resource": "*"
    }
  ]
}
```

#### 2. Push Images to ECR
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Build and tag images
docker build -t willy-backend backend/
docker tag willy-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/willy-backend:latest

docker build -t willy-frontend frontend/
docker tag willy-frontend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/willy-frontend:latest

# Push to ECR
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/willy-backend:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/willy-frontend:latest
```

#### 3. Create RDS Database
```bash
aws rds create-db-instance \
  --db-instance-identifier willy-prod-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password '<strong-password>' \
  --allocated-storage 20 \
  --storage-type gp3
```

#### 4. Update DATABASE_URL
```env
DATABASE_URL=postgresql://admin:<password>@willy-prod-db.xxxx.us-east-1.rds.amazonaws.com:5432/willydb
```

#### 5. Create ECS Task Definition
```json
{
  "family": "willy-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/willy-backend:latest",
      "portMappings": [
        {
          "containerPort": 4000
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "4000"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:willy/db-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:willy/jwt-secret"
        }
      ]
    }
  ]
}
```

### Option 2: DigitalOcean App Platform

1. Connect repository to DigitalOcean
2. Create app.yaml:
```yaml
name: willy-collection
services:
- name: backend
  github:
    repo: yourusername/willy-collection
    branch: main
  build_command: cd backend && npm ci
  run_command: cd backend && npm start
  envs:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: "4000"
  http_port: 4000
  health_check:
    http_path: /api/health

- name: frontend
  github:
    repo: yourusername/willy-collection
    branch: main
  build_command: cd frontend && npm ci && npm run build
  run_command: cd frontend && npm start
  envs:
  - key: NODE_ENV
    value: production
  - key: NEXT_PUBLIC_API_URL
    value: https://api.yourdomain.com
  http_port: 3000

databases:
- name: willy-db
  engine: PG
  version: "14"
```

3. Deploy via DigitalOcean CLI:
```bash
doctl apps create --spec app.yaml
```

### Option 3: Google Cloud Run + Cloud SQL

```bash
# Create Cloud SQL instance
gcloud sql instances create willy-prod \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1

# Deploy backend
gcloud run deploy willy-backend \
  --image=gcr.io/project-id/willy-backend \
  --region=us-central1 \
  --platform=managed \
  --set-env-vars="NODE_ENV=production,DATABASE_URL=..." \
  --set-secrets="JWT_SECRET=willy-jwt-secret:latest"
```

---

## Database Setup

### PostgreSQL (Recommended for Production)

```bash
# Create database
createdb willydb

# Create user
createuser willyadmin

# Connect and set password
psql -c "ALTER USER willyadmin WITH PASSWORD 'strong_password';"

# Grant permissions
psql -d willydb -c "GRANT ALL PRIVILEGES ON DATABASE willydb TO willyadmin;"

# Generate DATABASE_URL
DATABASE_URL="postgresql://willyadmin:strong_password@localhost:5432/willydb"
```

### MySQL Alternative

```bash
# Create database and user
mysql -e "CREATE DATABASE willydb;"
mysql -e "CREATE USER 'willyadmin'@'localhost' IDENTIFIED BY 'strong_password';"
mysql -e "GRANT ALL PRIVILEGES ON willydb.* TO 'willyadmin'@'localhost';"

# Generate DATABASE_URL
DATABASE_URL="mysql://willyadmin:strong_password@localhost:3306/willydb"
```

### Run Migrations

```bash
# Update DATABASE_URL in .env

# Run migrations
npm run prisma migrate deploy

# Seed initial data (optional)
npm run prisma db seed
```

---

## SSL/TLS Configuration

### Using Nginx as Reverse Proxy

```nginx
# /etc/nginx/sites-available/willy-collection

upstream backend {
    server 127.0.0.1:4000;
}

upstream frontend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Let's Encrypt SSL Certificate

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## Monitoring & Logging

### Docker Logs

```bash
# Follow logs
docker-compose logs -f

# Check service status
docker-compose ps

# Export logs
docker-compose logs > app_logs.txt
```

### ELK Stack (Elasticsearch, Logstash, Kibana)

```yaml
# docker-compose-monitoring.yml
version: '3.9'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

### Datadog Integration

```bash
# Install Datadog agent
DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=<your-api-key> bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"

# Configure Node.js
export DD_TRACE_ENABLED=true
```

---

## Backup & Recovery

### Automated Backups

```bash
#!/bin/bash
# backup.sh - Run via cron job

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup database
pg_dump -U willyadmin willydb | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" ./uploads/

# Upload to S3
aws s3 cp "$BACKUP_DIR/" s3://willy-backups/ --recursive --include="*.gz"

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete
```

### Recovery Procedure

```bash
# Restore database
gunzip -c backup-db.sql.gz | psql -U willyadmin willydb

# Restore uploads
tar -xzf backup-uploads.tar.gz
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port 4000
lsof -i :4000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=4001
```

#### 2. Database Connection Error
```bash
# Test connection
psql -h localhost -U willyadmin -d willydb

# Check DATABASE_URL format
echo $DATABASE_URL

# Ensure database service is running
docker-compose ps
```

#### 3. JWT Authentication Failed
```bash
# Regenerate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env and restart
docker-compose restart backend
```

#### 4. File Upload Fails
```bash
# Check upload directory permissions
ls -la uploads/

# Ensure proper permissions
chmod -R 755 uploads/

# Check disk space
df -h
```

#### 5. CORS Errors
```bash
# Verify ALLOWED_ORIGINS
echo $ALLOWED_ORIGINS

# Update for your domain
ALLOWED_ORIGINS=https://yourdomain.com

# Restart backend
docker-compose restart backend
```

### Debug Mode

Enable debug logging:
```bash
# Update .env
LOG_LEVEL=debug

# Restart services
docker-compose restart
```

### Performance Debugging

```bash
# Monitor resource usage
docker stats

# Check database query performance
# Enable query logs in PostgreSQL:
log_statement = 'all'
log_duration = on
```

---

## Security Checklist

- [ ] JWT_SECRET generated and not committed
- [ ] DATABASE credentials stored in secrets manager
- [ ] HTTPS/SSL enabled
- [ ] CORS properly configured
- [ ] Rate limiting tested
- [ ] File upload validation working
- [ ] Admin access tested
- [ ] Error messages don't expose sensitive data
- [ ] Logs don't contain sensitive information
- [ ] Backups encrypted and stored securely
- [ ] Monitoring and alerting configured
- [ ] Firewall rules restrict access appropriately

---

## Performance Tuning

### Database
```sql
-- Add indexes for slow queries
EXPLAIN ANALYZE SELECT * FROM "Sneaker" WHERE featured = true;

-- Vacuum statistics
VACUUM ANALYZE;
```

### Node.js
```bash
# Enable clustering in production
NODE_OPTIONS="--max_old_space_size=2048" npm start
```

### Frontend
```bash
# Enable gzip compression
export COMPRESS=true
npm start
```

---

## Support & Documentation

- Review PRODUCTION_AUDIT_REPORT.md for security details
- Check .env.example for configuration options
- See docker-compose.yml for service definitions
- Review backend/.env.example for backend config

For additional support, consult the README.md file.
