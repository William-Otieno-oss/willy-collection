# Production Deployment Quick Reference

**Status**: Ready for Deployment  
**Last Updated**: 2026-02-28

---

## 🎯 Quick Start (Choose One Path)

### Path A: Render (All-in-One - PostgreSQL + Node.js)

```
Time: ~15 minutes
Cost: $20-40/month
Uptime: 99.9%
→ Follow: RENDER_DEPLOYMENT_GUIDE.md
```

### Path B: Railway (Simpler Interface)

```
Time: ~12 minutes
Cost: $5-20+/month
Uptime: 99.9%
→ Follow: RAILWAY_DEPLOYMENT_GUIDE.md
```

### Path C: Vercel (Frontend Only)

```
Time: ~5 minutes
Cost: Free-20/month
→ Follow: VERCEL_DEPLOYMENT_GUIDE.md
```

---

## 📋 Complete Deployment Checklist

- [ ] **Backend**
  - [ ] Database created (PostgreSQL on Render/Railway)
  - [ ] Backend service deployed
  - [ ] Environment variables configured
  - [ ] Database migrations applied
  - [ ] Health check responds: `curl /api/health`
  - [ ] Login works: `curl POST /api/auth/login`

- [ ] **Frontend**
  - [ ] Frontend deployed to Vercel
  - [ ] NEXT_PUBLIC_API_URL set to backend URL
  - [ ] Environment variables configured
  - [ ] Site loads: `https://your-domain.vercel.app`

- [ ] **Integration**
  - [ ] Frontend can reach backend API
  - [ ] No CORS errors in console
  - [ ] Sneakers load from backend
  - [ ] Login/logout works
  - [ ] Cart functionality works

- [ ] **Monitoring**
  - [ ] Error tracking setup (Sentry recommended)
  - [ ] Logs being collected
  - [ ] Health checks configured
  - [ ] Auto-deploy from GitHub working

---

## 🔐 Security Checklist

- [ ] JWT_SECRET is 32+ random characters
- [ ] ADMIN_PASSWORD is 12+ characters with mixed case
- [ ] DATABASE_URL never committed to git
- [ ] ALLOWED_ORIGINS only includes your frontend domain
- [ ] SSL/TLS enabled (automatic on Vercel/Render/Railway)
- [ ] HTTPS redirects in production (backend enforces)
- [ ] Rate limiting enabled (100 requests/15 mins)
- [ ] CORS properly configured

---

## 📊 Environment Variables

### Backend Required

```env
NODE_ENV=production
JWT_SECRET=<generate-base64-32-chars>
DATABASE_URL=<postgresql-connection-string>
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong-password>
ALLOWED_ORIGINS=https://yourdomain.com
```

### Frontend Required

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### Optional (Infrastructure)

```env
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
S3_REGION=us-east-1
S3_BUCKET=willy-collection
LOG_LEVEL=info
```

---

## 🚀 Deployment URLs

After deployment, you'll have:

```
Frontend:    https://your-domain.vercel.app
             (or your custom domain)

Backend:     https://backend-xxx.railway.app
             (or https://backend-xxx.onrender.com)

Database:    Managed by Render/Railway
             (no direct public URL)
```

**Update frontend to use backend URL:**

```
Vercel Dashboard → Settings → Environment Variables
NEXT_PUBLIC_API_URL = https://your-backend-url.com
```

---

## ✅ Post-Deployment Verification

### Test Backend Health

```bash
# Replace URL with your backend
BACKEND="https://your-backend-url.com"

# 1. Health check
curl $BACKEND/api/health
# Expected: {"ok":true,...}

# 2. Readiness check
curl $BACKEND/ready
# Expected: {"ready":true}

# 3. Login (use your admin password)
curl -X POST $BACKEND/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"YOUR_PASSWORD"}'
# Expected: {"success":true,"token":"...","admin":{...}}
```

### Test Frontend

1. Visit frontend URL in browser
2. Check sneakers load from API
3. Open DevTools → Console (no errors)
4. Check Network tab (API calls successful)
5. Try admin login
6. Add item to cart
7. Test checkout

### Check Logs

- **Vercel**: Dashboard → Deployments → View Logs
- **Render**: Dashboard → Logs
- **Railway**: Dashboard → Logs

---

## 🔄 Auto-Deploy Setup

### GitHub Push = Auto-Deploy

```bash
# 1. Make changes locally
git add .
git commit -m "Update feature"

# 2. Push to main
git push origin main

# 3. Vercel/Render/Railway automatically deployes
# Monitor at their dashboards
```

### Disable Auto-Deploy

- **Vercel**: Settings → Git → Toggle "Deploy on Push"
- **Render**: Service Settings → Auto-Deploy
- **Railway**: Service Settings → Deploy

---

## 🐛 Troubleshooting

### Frontend 404 / API not found

```
→ Check NEXT_PUBLIC_API_URL is correct
→ Restart Vercel deployment
→ Clear browser cache (Ctrl+Shift+Del)
→ Check Network tab for actual URL
```

### Backend database connection fails

```
→ Check DATABASE_URL is correct
→ Verify database service is running
→ Ensure database migrations completed
→ Check database user/password in URL
```

### CORS errors

```
→ Check backend ALLOWED_ORIGINS includes frontend URL
→ Verify frontend is using correct API URL
→ Ensure POST/OPTIONS requests allowed
→ Check browser console for exact error
```

### 502 Bad Gateway

```
→ Check application logs
→ Verify all env vars are set
→ Ensure health endpoint responds
→ Restart the service
```

### Slow API responses

```
→ Monitor database query times
→ Check rate limiting isn't being hit
→ Verify backend has sufficient resources
→ Consider adding caching layer (Redis)
```

---

## 📈 Scaling

### When Traffic Grows

1. **Render**: Upgrade plan in Service Settings
2. **Railway**: Increase CPU/Memory allocation
3. **Vercel**: Auto-scales (no action needed)

### Database Performance

- Add indexes for frequent queries
- Optimize N+1 queries in code
- Consider read replicas for high load
- Monitor slow query logs

### Static Asset Optimization

- Images auto-optimized by Vercel
- CSS/JS minified automatically
- Consider CDN for uploads (S3)

---

## 💰 Cost Estimate

| Service   | Component       | Cost             |
| --------- | --------------- | ---------------- |
| Render    | Web Service     | $7-28/month      |
| Render    | PostgreSQL      | $15-30/month     |
| Railway   | App + Database  | $5-20+/month     |
| Vercel    | Hobby (free)    | $0/month         |
| Vercel    | Pro (if needed) | $20/month        |
| **Total** | **Typical**     | **$20-60/month** |

Start with affordable options; upgrade as needed.

---

## 📚 Full Documentation

| Topic                         | File                        |
| ----------------------------- | --------------------------- |
| Complete deployment guide     | DEPLOYMENT_TO_PRODUCTION.md |
| Render-specific instructions  | RENDER_DEPLOYMENT_GUIDE.md  |
| Railway-specific instructions | RAILWAY_DEPLOYMENT_GUIDE.md |
| Vercel-specific instructions  | VERCEL_DEPLOYMENT_GUIDE.md  |

---

## 🆘 Getting Help

### For Vercel Issues

- Docs: https://vercel.com/docs
- Support: https://vercel.com/support

### For Render Issues

- Docs: https://render.com/docs
- Discord: https://discord.gg/6Kee5g2

### For Railway Issues

- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway

### For Your Application

- Check logs in deployment platform
- Review error tracking (Sentry)
- Monitor database health

---

## 🎬 Next Steps

1. **Choose hosting** (Render/Railway for backend, Vercel for frontend)
2. **Follow platform guide** (RENDER_DEPLOYMENT_GUIDE.md, etc.)
3. **Deploy and verify** (run health checks)
4. **Set up monitoring** (Sentry recommended)
5. **Configure domain** (optional, for custom brand)
6. **Launch to production** 🚀

---

**Questions?** Check the full guides or platform documentation above.  
**Ready?** Pick your platform and follow the step-by-step guide!
