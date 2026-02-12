# Base Super App - Deployment Guide

Complete guide for deploying the Base Super App to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Options](#deployment-options)
   - [Option 1: Vercel (Frontend) + VPS (Backend)](#option-1-vercel--vps)
   - [Option 2: Docker Compose (Full Stack)](#option-2-docker-compose)
   - [Option 3: Kubernetes](#option-3-kubernetes)
4. [Database Migration](#database-migration)
5. [SSL/TLS Configuration](#ssltls-configuration)
6. [Monitoring & Logging](#monitoring--logging)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (for containerized deployment)
- Domain name with DNS access
- SSL certificate (Let's Encrypt recommended)

## Environment Setup

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/base-super-app.git
cd base-super-app
npm install
cd backend && npm install
```

### 2. Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=base_production
DB_USER=base_user
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT Secrets (generate strong random strings)
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# Push Notifications (VAPID keys)
# Generate with: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@yourdomain.com

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email (SMTP)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# OAuth (Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# QuickBooks
QB_CLIENT_ID=your-qb-client-id
QB_CLIENT_SECRET=your-qb-client-secret
QB_SANDBOX=false

# Application
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com
```

## Deployment Options

### Option 1: Vercel (Frontend) + VPS (Backend)

Best for: Teams wanting serverless frontend with dedicated backend

#### Frontend (Vercel)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login and deploy:**
   ```bash
   vercel login
   vercel --prod
   ```

3. **Configure environment variables in Vercel Dashboard:**
   - Go to Project Settings > Environment Variables
   - Add all `VITE_` prefixed variables

#### Backend (VPS/Dedicated Server)

1. **Setup server (Ubuntu 22.04):**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib -y
   sudo systemctl start postgresql
   sudo systemctl enable postgresql

   # Install Redis
   sudo apt install redis-server -y
   sudo systemctl enable redis-server

   # Install PM2
   sudo npm install -g pm2
   ```

2. **Setup database:**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE base_production;
   CREATE USER base_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE base_production TO base_user;
   \q
   ```

3. **Deploy application:**
   ```bash
   # Clone repo
   git clone https://github.com/yourusername/base-super-app.git /opt/base-super-app
   cd /opt/base-super-app/backend

   # Install dependencies
   npm install --production

   # Run migrations
   npx knex migrate:latest

   # Seed initial data (optional)
   npx knex seed:run

   # Start with PM2
   pm2 start src/server.js --name base-backend
   pm2 startup
   pm2 save
   ```

4. **Setup Nginx reverse proxy:**
   ```bash
   sudo apt install nginx -y
   sudo nano /etc/nginx/sites-available/base-backend
   ```

   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/base-backend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. **Setup SSL with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d api.yourdomain.com
   ```

---

### Option 2: Docker Compose (Full Stack)

Best for: Teams wanting simple, reproducible deployments

1. **Install Docker and Docker Compose:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

2. **Create environment file:**
   ```bash
   nano .env.production
   # Add all production environment variables
   ```

3. **Deploy with Docker Compose:**
   ```bash
   # Pull and build images
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml build

   # Start services
   docker-compose -f docker-compose.prod.yml up -d

   # Run database migrations
   docker-compose -f docker-compose.prod.yml exec backend npx knex migrate:latest

   # View logs
   docker-compose -f docker-compose.prod.yml logs -f
   ```

4. **Setup SSL:**
   ```bash
   # Place SSL certificates in docker/ssl/
   mkdir -p docker/ssl
   # Copy your certificate and key:
   # - docker/ssl/cert.pem
   # - docker/ssl/key.pem
   ```

5. **Update DNS:**
   Point your domain to the server's IP address.

---

### Option 3: Kubernetes

Best for: Teams needing high availability and auto-scaling

See `k8s/` directory for Kubernetes manifests (advanced users).

## Database Migration

### Running Migrations

```bash
# Local development
npx knex migrate:latest

# Production (Docker)
docker-compose -f docker-compose.prod.yml exec backend npx knex migrate:latest

# Production (PM2)
cd /opt/base-super-app/backend && npx knex migrate:latest
```

### Creating New Migrations

```bash
npx knex migrate:make migration_name
```

### Rolling Back

```bash
# Rollback last batch
npx knex migrate:rollback

# Rollback all
npx knex migrate:rollback --all
```

## SSL/TLS Configuration

### Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

### Custom Certificate

Place your certificate files:
- `/etc/nginx/ssl/cert.pem`
- `/etc/nginx/ssl/key.pem`

Update Nginx config to use them:
```nginx
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

## Monitoring & Logging

### PM2 Monitoring

```bash
# View logs
pm2 logs base-backend

# Monitor resources
pm2 monit

# View status
pm2 status
```

### Docker Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Setup Sentry (Error Tracking)

1. Create account at sentry.io
2. Add DSN to environment variables
3. Install Sentry SDK:
   ```bash
   npm install @sentry/node
   ```

### Setup DataDog (APM)

1. Install DataDog agent
2. Configure APM in environment variables

## Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U base_user -d base_production

# Check logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

#### Redis Connection Errors

```bash
# Check Redis status
sudo systemctl status redis

# Test connection
redis-cli ping
```

#### Port Already in Use

```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>
```

#### Permission Denied

```bash
# Fix file permissions
sudo chown -R $USER:$USER /opt/base-super-app
chmod -R 755 /opt/base-super-app
```

### Health Check

```bash
# Test API health
curl https://api.yourdomain.com/health

# Expected response:
# {"success":true,"status":"healthy","timestamp":"...","version":"1.0.0"}
```

### Backup & Restore

```bash
# Backup database
pg_dump -h localhost -U base_user base_production > backup_$(date +%Y%m%d).sql

# Restore database
psql -h localhost -U base_user base_production < backup_20240101.sql

# Automated daily backup (cron)
0 2 * * * pg_dump -h localhost -U base_user base_production | gzip > /backups/base_$(date +\%Y\%m\%d).sql.gz
```

---

## Support

For deployment support:
- GitHub Issues: https://github.com/yourusername/base-super-app/issues
- Documentation: https://docs.yourdomain.com
- Email: support@yourdomain.com
