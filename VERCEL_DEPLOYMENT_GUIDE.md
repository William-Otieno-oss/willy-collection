# Vercel Deployment Guide for Frontend

Vercel is the company behind Next.js and provides optimal hosting for Next.js applications. This guide covers deploying your Willy Collection frontend to Vercel.

## Prerequisites

- GitHub account with repository pushed
- Vercel account (free tier sufficient, or use GitHub signup)
- Backend deployed on Render/Railway with accessible URL

## Step-by-Step Deployment

### Step 1: Sign Up to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Sign Up"** → Choose **"GitHub"**
3. Authorize Vercel to access your GitHub repositories
4. Complete account setup

### Step 2: Import Your Project

1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. Find your repository and click **"Import"**
4. Vercel auto-detects Next.js framework

### Step 3: Configure Project Settings

1. **Project Name**: `willy-collection` (or your name)
2. **Framework Preset**: Next.js (auto-detected)
3. **Root Directory**: `frontend` ← **IMPORTANT**
4. **Build Command**: `npm run build` (auto-detected)
5. **Install Command**: `npm install` (auto-detected)
6. **Start Command**: `npm start` (auto-detected)
7. **Output Directory**: `.next` (auto-detected)

### Step 4: Add Environment Variables

Before clicking "Deploy", scroll down to **"Environment Variables"** and add:

```env
Key: NEXT_PUBLIC_API_URL
Value: https://your-backend-url.railway.app
```

(Replace with your actual Render or Railway backend URL)

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (usually 2-3 minutes)
3. You'll see a "Congratulations" screen with your Vercel URL
4. Your app is now live at: `https://your-project.vercel.app`

### Step 6: Test Deployment

```bash
# Visit your Vercel URL in browser
https://your-project.vercel.app

# Test API connection
Open DevTools (F12) → Console
Paste: fetch('https://your-project.vercel.app/api/sneakers')
       .then(r => r.json())
       .then(c => console.log(c))
```

## Custom Domain Setup

### Add Domain to Vercel

1. Go to project **Settings** → **Domains**
2. Enter your domain (e.g., `willystore.com`)
3. Click **"Add"**
4. Vercel shows DNS records to add

### Update DNS Records

Go to your domain registrar (Namecheap, GoDaddy, etc.):

1. Find DNS settings
2. Add these records:

**Option A: Using Vercel Nameservers (Recommended)**

1. Note Vercel's nameservers from step 1
2. Update registrar to use those nameservers
3. Wait 24-48 hours for propagation

**Option B: Using A Records**

1. Create A record pointing to Vercel's IP
2. Follow Vercel's specific instructions
3. Wait 24 hours

### Verify Domain

1. Return to Vercel → Domains
2. Click your domain
3. Once "Active", your site is at your custom domain

## Environment Variables Explained

| Variable              | Purpose              | Example                      |
| --------------------- | -------------------- | ---------------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://api.yourdomain.com` |

**Note**: Only variables starting with `NEXT_PUBLIC_` are exposed to the browser. Keep secrets (API keys, tokens) server-side.

## Auto-Deploy from GitHub

Vercel automatically deploys when you push to main branch:

1. Make changes locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update frontend"
   git push origin main
   ```
3. Vercel automatically detects changes and deploys
4. Monitor progress at vercel.com dashboard

### Disable Auto-Deploy

1. Project Settings → Git
2. Toggle **"Deploy on Push"** OFF

## Managing Deployments

### View Deployment History

1. Dashboard → click your project
2. **Deployments** tab shows all builds
3. Click any deployment to see logs

### Rollback to Previous Version

1. Find previous successful deployment
2. Click **"..."** → **"Promote to Production"**
3. Previous version is now live (instant)

### Redeployment

1. Find deployment in list
2. Click **"..."** → **"Redeploy"**
3. New deployment starts immediately

## Performance Optimization

### Vercel Analytics

1. Project Settings → **Analytics**
2. View Web Vitals (Core Web Vitals)
3. Identify slow pages
4. Optimize based on data

### Image Optimization

Next.js on Vercel automatically:

- Optimizes images
- Converts to modern formats (WebP, AVIF)
- Lazy-loads images
- Serves from Vercel's global network

### Edge Caching

Vercel automatically caches:

- Static assets (images, CSS, JS)
- HTML pages (if configured)
- API responses (if you add caching headers)

To configure caching in `next.config.js` (already done):

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=3600' }
      ]
    }
  ]
}
```

## Troubleshooting

### Build fails: "Framework not detected"

- Ensure Root Directory is set to `frontend`
- Verify `package.json` exists in frontend folder

### Build fails: "Module not found"

- Check all dependencies are in `frontend/package.json`
- Verify imports use correct paths
- Check `.env` variables match production names

### Frontend displays but API calls fail (404 errors)

- Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend is running and accessible
- Check backend ALLOWED_ORIGINS includes Vercel domain
- Open DevTools to see actual API URL being called

### Images not loading

- Verify image domains in `next.config.js`
- Check image URLs are absolute (not relative)
- Confirm external image hosting is accessible

### Slow page load

- Check Vercel Analytics for bottlenecks
- Optimize images using Next.js Image component
- Enable compression in next.config.js (already done)
- Check database query performance

### Deployment stuck

- Check logs:
  1. Dashboard → Deployments → Latest
  2. Click "View Build Logs"
  3. Look for error messages
- Manually redeployment:
  1. Click deployment
  2. Click **"..."** → **"Redeploy"**

## Production Checklist

- [ ] Root Directory is set to `frontend`
- [ ] NEXT_PUBLIC_API_URL points to production backend
- [ ] Backend API is accessible and working
- [ ] Health check endpoint responds
- [ ] Can load sneakers data
- [ ] Can log in with admin account
- [ ] Can add items to cart
- [ ] Images load properly
- [ ] No CORS errors in browser console
- [ ] Custom domain is set up (optional)
- [ ] SSL/TLS enabled (automatic on Vercel)
- [ ] Analytics dashboard shows data

## Configuration Files

### `frontend/next.config.js`

Already configured with:

- Image optimization
- Security headers
- Compression
- CORS for API rewrites

### `frontend/vercel.json`

Deploy-time settings:

- Headers
- Redirects
- Cache policy

## Cost on Vercel

- **Hobby (Free)**:
  - 100 GB bandwidth/month
  - Unlimited deployments
  - Good for personal/small projects
- **Pro ($20/month)**:
  - 1 TB bandwidth/month
  - Unlimited team members
  - Advanced analytics

- **Enterprise**: Custom pricing

Start with free tier; upgrade only if needed.

## Monitoring & Analytics

### Enable Vercel Analytics

1. Project Settings → **Analytics**
2. Click **"Enable Web Analytics"**
3. Dashboard shows:
   - Core Web Vitals
   - Page load times
   - User interactions
   - Custom metrics

### Set Up Error Tracking

Vercel works with:

- Sentry (recommended)
- LogRocket
- DataDog

Connect via Settings → Integrations

## Next Steps

1. ✅ Frontend deployed on Vercel
2. → Verify backend communication works
3. → Test full user flow:
   - Browse sneakers
   - Log in
   - Add to cart
   - Place order
4. → Set up monitoring (Sentry/LogRocket)
5. → Configure email notifications
6. → Plan database backups
7. → Monitor costs and scale as needed

## Support

- Documentation: [https://vercel.com/docs](https://vercel.com/docs)
- Support: [https://vercel.com/support](https://vercel.com/support)
- Status: [https://www.vercelstatus.com](https://www.vercelstatus.com)
