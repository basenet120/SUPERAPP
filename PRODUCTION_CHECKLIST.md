# Production Checklist

Complete checklist for deploying Base Super App to production.

## Pre-Deployment

### Security

- [ ] Change all default passwords (database, Redis, admin accounts)
- [ ] Generate strong JWT secrets (min 32 characters)
- [ ] Generate VAPID keys for push notifications
- [ ] Enable HTTPS/SSL (Let's Encrypt or custom certificate)
- [ ] Configure firewall rules (only open necessary ports)
- [ ] Disable server information headers
- [ ] Set up rate limiting
- [ ] Enable CORS with proper origin restrictions
- [ ] Review and update all npm packages for vulnerabilities
- [ ] Run security audit: `npm audit --audit-level=moderate`
- [ ] Set up Content Security Policy headers
- [ ] Enable HSTS (HTTP Strict Transport Security)

### Environment Variables

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database credentials
- [ ] Set up Redis with authentication
- [ ] Add all API keys (Stripe, Google, QuickBooks)
- [ ] Configure email SMTP settings
- [ ] Set frontend URL for CORS
- [ ] Configure backup storage credentials (S3, etc.)

### Database

- [ ] Run all pending migrations: `knex migrate:latest`
- [ ] Seed necessary production data
- [ ] Set up database backups (daily automated)
- [ ] Configure database connection pooling
- [ ] Enable database query logging (optional)
- [ ] Set up read replicas if needed

### Monitoring & Logging

- [ ] Set up error tracking (Sentry recommended)
- [ ] Configure application logs rotation
- [ ] Set up infrastructure monitoring (DataDog, New Relic)
- [ ] Configure uptime monitoring (Pingdom, UptimeRobot)
- [ ] Set up log aggregation (CloudWatch, Logstash)
- [ ] Configure alerting thresholds

### Performance

- [ ] Enable gzip compression
- [ ] Configure CDN for static assets
- [ ] Optimize images (WebP format)
- [ ] Set up Redis caching
- [ ] Configure database indexes
- [ ] Enable HTTP/2
- [ ] Set proper cache headers
- [ ] Minify CSS/JS assets
- [ ] Enable service worker for PWA

## Deployment

### Build Process

- [ ] Run full test suite (all tests passing)
- [ ] Build production frontend bundle
- [ ] Verify build output size
- [ ] Test PWA manifest and icons
- [ ] Verify service worker registration
- [ ] Check for console errors in production build

### Infrastructure

- [ ] Provision production servers
- [ ] Configure load balancer (if needed)
- [ ] Set up auto-scaling rules
- [ ] Configure DNS records
- [ ] Set up SSL certificates
- [ ] Configure backup storage

### Deployment Execution

- [ ] Deploy backend API
- [ ] Deploy frontend application
- [ ] Run database migrations
- [ ] Verify health check endpoints
- [ ] Test critical user flows
- [ ] Verify email delivery
- [ ] Test payment processing
- [ ] Verify push notifications
- [ ] Test file uploads

## Post-Deployment

### Verification

- [ ] Smoke test all major features
- [ ] Verify SSL certificate validity
- [ ] Check security headers
- [ ] Test 404/500 error pages
- [ ] Verify PWA installation
- [ ] Test offline functionality
- [ ] Check mobile responsiveness
- [ ] Verify email templates render correctly

### Monitoring

- [ ] Verify error tracking is receiving data
- [ ] Check application logs for errors
- [ ] Monitor resource usage (CPU, memory, disk)
- [ ] Verify database connections
- [ ] Check Redis connectivity
- [ ] Monitor response times
- [ ] Verify backup jobs are running

### Documentation

- [ ] Update API documentation
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Update environment variable documentation
- [ ] Document backup/restore procedures

## Security Checklist

### Authentication & Authorization
- [ ] JWT tokens have appropriate expiration
- [ ] Refresh token rotation is enabled
- [ ] Password policies are enforced
- [ ] Multi-factor authentication available
- [ ] Role-based access control working
- [ ] API endpoints protected properly

### Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] Database backups encrypted
- [ ] API keys stored securely
- [ ] No secrets in code repositories
- [ ] Environment variables properly managed

### Network Security
- [ ] HTTPS enforced on all endpoints
- [ ] HSTS header configured
- [ ] CSRF protection enabled
- [ ] XSS prevention headers
- [ ] Clickjacking protection (X-Frame-Options)
- [ ] Content Security Policy configured

## Performance Checklist

### Frontend
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.8s
- [ ] Lighthouse score > 90
- [ ] No render-blocking resources
- [ ] Images optimized and lazy-loaded
- [ ] JavaScript bundles code-split

### Backend
- [ ] API response time < 200ms (p50)
- [ ] Database query time < 100ms
- [ ] Static assets served from CDN
- [ ] Compression enabled (gzip/brotli)
- [ ] Connection pooling configured
- [ ] Redis caching working

## Disaster Recovery

- [ ] Database backup strategy documented
- [ ] Automated backups configured
- [ ] Backup restoration tested monthly
- [ ] Disaster recovery runbook created
- [ ] Recovery Time Objective (RTO) defined
- [ ] Recovery Point Objective (RPO) defined
- [ ] Offsite backup storage configured

## Compliance

- [ ] GDPR compliance (if applicable)
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Data retention policy defined
- [ ] Cookie consent implemented
- [ ] Accessibility standards met (WCAG 2.1)

## Team Communication

- [ ] Deployment announced to team
- [ ] Rollback plan communicated
- [ ] On-call schedule established
- [ ] Escalation procedures defined
- [ ] Status page set up
- [ ] Customer communication prepared (if major changes)

## Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Tech Lead | | | |
| DevOps | | | |
| Security | | | |
| Product Owner | | | |

## Post-Launch Review (1 Week)

- [ ] Review error rates
- [ ] Analyze performance metrics
- [ ] Gather user feedback
- [ ] Check system stability
- [ ] Review cost vs. budget
- [ ] Document lessons learned

---

## Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Tech Lead | | | |
| DevOps Lead | | | |
| Infrastructure | | | |
| Security | | | |

## Quick Commands

```bash
# Check service status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all

# Database backup
pg_dump -h localhost -U base_user base_production > backup_$(date +%Y%m%d).sql

# Check disk space
df -h

# Check memory
free -h

# Check running processes
ps aux | grep node
```
