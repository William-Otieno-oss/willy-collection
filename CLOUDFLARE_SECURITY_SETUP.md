# Cloudflare Security & CDN Setup Guide

## Overview

Cloudflare provides enterprise-grade security and CDN services:

- **DDoS Protection**: Automatic mitigation of attacks
- **Web Application Firewall (WAF)**: Blocks malicious requests
- **SSL/TLS**: Free certificates with auto-renewal
- **DNS Management**: Global DNS with DDoS protection
- **Rate Limiting**: Protect against brute force attacks
- **Caching**: Global edge network for fast response times
- **Security Headers**: Automatic addition of security headers

---

## Part 1: Cloudflare Account Setup

### Step 1: Create Cloudflare Account

1. **Go to Cloudflare**: https://www.cloudflare.com
2. **Sign up** with email or GitHub
3. **Verify email**
4. **Select plan**: Free plan is sufficient for startups

### Step 2: Add Your Domain

1. In Cloudflare dashboard, click **Add Site**
2. **Enter your domain**: `yourdomain.com`
3. **Select Free plan** (if not automatically selected)
4. Click **Continue**

### Step 3: Update Nameservers

Cloudflare will provide 2 nameservers:

```
ns1.cloudflare.com
ns2.cloudflare.com
```

**At your domain registrar** (GoDaddy, Namecheap, Route53, etc.):

1. Login to registrar account
2. Go to **DNS Settings** or **Nameservers**
3. Replace current nameservers with Cloudflare ones
4. **Save** (may take 24-48 hours to fully propagate)

**Check propagation**:

```bash
# Run in terminal
nslookup yourdomain.com
# Should show Cloudflare nameservers
```

---

## Part 2: DNS Configuration

Once nameservers are updated, configure DNS records in Cloudflare:

### DNS Records to Create

In Cloudflare Dashboard → **DNS**:

#### 1. Root Domain (yourdomain.com)

| Type  | Name           | Value                         | TTL  | Proxy      |
| ----- | -------------- | ----------------------------- | ---- | ---------- |
| A     | yourdomain.com | Your frontend IP or Vercel IP | Auto | ✅ Proxied |
| CNAME | www            | yourdomain.com                | Auto | ✅ Proxied |

**For Vercel Frontend**:

- Name: `@` (root)
- Type: `CNAME`
- Value: `cname.vercel-dns.com`
- TTL: Auto
- Proxy: Proxied (orange cloud)

#### 2. API Subdomain (api.yourdomain.com)

| Type  | Name | Value                                    | TTL  | Proxy      |
| ----- | ---- | ---------------------------------------- | ---- | ---------- |
| CNAME | api  | your-backend-url.render.com (or Railway) | Auto | ✅ Proxied |

**Example for Render**:

```
Type: CNAME
Name: api
Value: willy-collection-api.render.com
TTL: Auto
Proxy: Proxied (orange cloud)
```

#### 3. Email Subdomain (if needed)

```
Type: MX
Name: @
Value: [your-email-provider-mx]
Priority: 10
Proxy: DNS only (gray cloud)
```

### Verify DNS Changes

Wait for propagation (usually 5-15 minutes):

```bash
# Check API domain
nslookup api.yourdomain.com

# Check frontend
nslookup yourdomain.com

# Both should resolve to Cloudflare IPs
```

---

## Part 3: SSL/TLS Configuration

### Enable SSL Certificate

1. In Cloudflare Dashboard → **SSL/TLS** → **Overview**
2. **SSL/TLS encryption mode**: Select **Full (strict)**
   - Option 1: Full (default) - Requires valid cert on origin
   - Option 2: Full (strict) - Requires valid cert on origin (recommended)
   - Option 3: Flexible - Self-signed certs (not secure)

3. **Always use HTTPS**: Toggle ON
4. **Automatic HTTPS Rewrites**: Toggle ON

### Create Origin CA Certificate (for Backend)

If your backend uses different domain:

1. **SSL/TLS** → **Origin Server**
2. **Create Certificate**
   - Common Name: `api.yourdomain.com`
   - Validity: 15 years
   - Key format: RSA 2048
   - Download certificate and private key

**Store securely**:

- Certificate: `server.crt`
- Private Key: `server.key`

Update backend `.env`:

```env
SSL_CERT_PATH=/path/to/server.crt
SSL_KEY_PATH=/path/to/server.key
```

---

## Part 4: DDoS Protection

### Automatic DDoS Protection

Cloudflare FREE plan includes:

- ✅ Automatic DDoS detection
- ✅ Blocks Layer 3/4 attacks
- ✅ Rate limiting (basic)
- ✅ Bot management (basic)

### Enable Enhanced Protection

1. **Security** → **DDoS Protection**
2. **DDoS Sensitivity Level**: Set to **Medium** (or **High** for stricter)
3. **Under Attack Mode**: Toggle to OFF (only enable if under active attack)

### Rate Limiting

1. **Security** → **Rate Limiting**
2. **Add Rate Limiting Rule**

**Example: Block excessive login attempts**:

```
Condition: Path contains /api/auth/login
Rate: 10 requests per 60 seconds
Action: Challenge (CAPTCHA)
```

**Example: Protect API endpoints**:

```
Condition: Path contains /api/
Rate: 100 requests per 60 seconds
Action: Block
```

**Example: Protect file uploads**:

```
Condition: Path contains /api/upload
Rate: 5 requests per 60 seconds
Action: Challenge
```

---

## Part 5: Web Application Firewall (WAF)

### Enable WAF

1. **Security** → **WAF** (or **Firewall Policies** on newer UI)
2. **Firewall Rules** → **Create a Firewall Rule**

### Rule 1: Block Common Attacks

```
Name: Block SQL Injection & XSS
Condition: (cf.threat_score >= 50)
Action: Block
```

### Rule 2: Block Bad Bots

```
Name: Block Malicious Bots
Condition: (cf.bot_management.score <= 30)
Action: Block
```

### Rule 3: Geo-blocking (Optional)

Block requests from specific countries:

```
Name: Block High-Risk Regions
Condition: (ip.geoip.country in {"KP" "IR" "SY"})
Action: Block
```

### Rule 4: Require HTTPS

```
Name: Force HTTPS
Condition: (http.request.uri.scheme == "http")
Action: Redirect to https
Redirect URL: concat("https://", http.host, http.request.uri)
```

### Managed Rule Sets

1. **Security** → **WAF** → **Managed Rules**
2. **Enable**:
   - ✅ Cloudflare Managed Ruleset (ML-based detection)
   - ✅ OWASP ModSecurity Core Rule Set
   - ✅ Cloudflare Specials (protects against new threats)

---

## Part 6: Security Headers

### Automatic Security Headers

Cloudflare adds these automatically in **Full (strict)** mode:

- ✅ Content-Security-Policy (CSP)
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Referrer-Policy

### Add Custom Headers

Update `backend/src/server.js`:

```javascript
// Security headers (in addition to Cloudflare)
app.use((req, res, next) => {
  // Cloudflare will add CSP, but we can set backup
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  next();
});

// Existing security headers...
```

---

## Part 7: Caching Configuration

### Cache Rules

1. **Caching** → **Cache Rules**
2. **Create Cache Rule**:

**Rule 1: Cache API responses**:

```
Condition: Path contains /api/public/
Browser Cache TTL: 1 hour
Edge Cache TTL: 24 hours
```

**Rule 2: Don't cache auth endpoints**:

```
Condition: Path contains /api/auth/
Cache Level: Bypass
```

**Rule 3: Don't cache user-specific data**:

```
Condition: Path contains /api/users/ OR /api/orders/
Cache Level: Bypass
```

### Browser Cache TTL

1. **Caching** → **Browser Cache TTL**
2. Set to **30 minutes** (default: cache based on headers)

---

## Part 8: Frontend Environment Variables

Update `frontend/.env.production`:

```env
# Cloudflare-protected API
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Site URL
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Analytics (optional)
NEXT_PUBLIC_CLOUDFLARE_ANALYTICS=true
```

Update `frontend/next.config.js`:

```javascript
const nextConfig = {
  // ... existing config ...

  // Rewrite to Cloudflare-protected backend
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/:path*`,
        },
      ],
    };
  },

  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "X-DNS-Prefetch-Control",
          value: "on",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
      ],
    },
  ],
};

module.exports = nextConfig;
```

---

## Part 9: Backend Configuration for Cloudflare

Update `backend/.env.production`:

```env
# Supabase Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres?sslmode=require

# Cloudflare domain
BACKEND_URL=https://api.yourdomain.com

# Frontend (Cloudflare protected)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Security
NODE_ENV=production
JWT_SECRET=[your-jwt-secret]
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=[secure-password]

# Trust Cloudflare proxy
TRUST_PROXY=true

# Rate limiting (Cloudflare handles most, this is backup)
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=900000
```

---

## Part 10: Testing & Verification

### Test SSL

```bash
# Check SSL certificate
curl -I https://api.yourdomain.com

# Should show:
# HTTP/2 200
# Server: cloudflare
```

### Test Security Headers

```bash
# Check headers
curl -I https://yourdomain.com

# Should include:
# Strict-Transport-Security
# X-Frame-Options
# X-Content-Type-Options
```

### Test DDoS Protection

```bash
# Cloudflare console tool in browser
# Opens automatic challenge/CAPTCHA if suspicious
```

### Test Rate Limiting

```bash
# Rapid requests to API
for i in {1..20}; do
  curl https://api.yourdomain.com/api/health
done

# Should get blocked/challenged after your limit
```

---

## Part 11: Monitoring & Analytics

### Access Cloudflare Analytics

1. **Analytics & Logs** → **Requests**
2. **View**:
   - Requests per second
   - Blocked requests
   - Cache hit ratio
   - Slowest endpoints

### Set Up Alerts

1. **Notifications** → **Notifications**
2. **Create Alert**:
   - Origin server down
   - High error rate (>5%)
   - DDoS attack detected
   - SSL certificate expiring

### Monitor Backend Health

In Cloudflare → **Health Checks**:

```
Endpoint: https://api.yourdomain.com/health
Type: HTTPS
Interval: 60 seconds
Timeout: 5 seconds
Regions: Global
```

---

## Part 12: Production Deployment Checklist

### Pre-Deployment

- [ ] Domain registered and pointed to Cloudflare nameservers
- [ ] DNS records created (A/CNAME for www and api subdomains)
- [ ] SSL/TLS configured to "Full (strict)"
- [ ] Always HTTPS enabled
- [ ] Automatic HTTPS rewrites enabled
- [ ] HSTS header configured (min-age: 31536000)
- [ ] DDoS protection enabled
- [ ] WAF rules configured
- [ ] Rate limiting rules set up
- [ ] Caching rules optimized
- [ ] Security headers configured
- [ ] Environment variables set correctly
- [ ] Backend deployed on hosting platform
- [ ] Database backups enabled (Supabase)
- [ ] Monitoring alerts configured

### Post-Deployment

- [ ] Test https://api.yourdomain.com/health (200 OK)
- [ ] Verify frontend connects to API correctly
- [ ] Test login functionality
- [ ] Monitor error rates in Cloudflare dashboard
- [ ] Check performance on Lighthouse
- [ ] Test from different geographic locations
- [ ] Verify caching is working (check X-Cache header)
- [ ] Simulate DDoS attempt (rate limit test)
- [ ] Check SSL grade on https://www.ssllabs.com

---

## Part 13: Security Best Practices

### 1. API Security

```javascript
// In backend/src/server.js
app.use((req, res, next) => {
  // Trust Cloudflare proxy
  app.set("trust proxy", 1);

  // Check Cloudflare headers
  const cfRay = req.headers["cf-ray"];
  if (!cfRay && process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not from Cloudflare" });
  }

  next();
});
```

### 2. CORS with Cloudflare

```javascript
// frontend/.env.production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

```javascript
// backend/src/server.js
const allowedOrigins =
  process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) || [];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
  maxAge: 86400,
};

app.use(cors(corsOptions));
```

### 3. Environment Variable Security

**NEVER commit to Git**:

- Database credentials
- JWT secret
- API keys
- Admin passwords

Store in `.env.local` (already in `.gitignore`):

```bash
# Verify file is ignored
cat .gitignore | grep .env
```

### 4. Regular Updates

```bash
# Weekly: Check for dependency updates
npm outdated

# Monthly: Update packages
npm update

# Security audits
npm audit
npm audit fix
```

---

## Part 14: Cost Analysis

| Component           | Cost           |
| ------------------- | -------------- |
| **Cloudflare**      | Free           |
| **Domain**          | ~$10/year      |
| **Supabase (Pro)**  | $25/month      |
| **Backend hosting** | $7-25/month    |
| **Total**           | ~$220-320/year |

**Free alternatives**:

- Let's Encrypt for SSL (instead of Cloudflare)
- AWS Route 53 for DNS
- Heroku/Railway for backend

---

## Part 15: Troubleshooting

### Domain not resolving

```bash
# Check DNS propagation
dig yourdomain.com

# Force check Cloudflare
dig yourdomain.com @1.1.1.1

# May take 24-48 hours after nameserver change
```

### API getting blocked

**Check Cloudflare logs**:

1. **Analytics & Logs** → **Logs**
2. Look for 403/challenge responses
3. Review **Firewall Rules** and **Rate Limiting**
4. Temporarily reduce sensitivity if too aggressive

### Caching causing issues

```javascript
// Disable cache for specific request
app.get("/api/auth/user", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  // ...
});
```

---

## Next Steps

1. ✅ **Complete Part 1-4**: Domain & SSL setup
2. ✅ **Configure security rules** (Part 5-6)
3. ✅ **Update environment variables** (Part 8-9)
4. ✅ **Deploy and test** (Part 10)
5. ✅ **Monitor production** (Part 11)

---

## Support & Resources

- **Cloudflare Docs**: https://developers.cloudflare.com
- **SSL/TLS Status**: https://www.cloudflare.com/ssl/
- **Rate Limiting Guide**: https://developers.cloudflare.com/firewall/rate-limiting-rules/
- **WAF Documentation**: https://developers.cloudflare.com/waf/
- **DNS Helper**: https://www.cloudflare.com/dns/

---

## Your Domain Configuration Summary

```
Domain: yourdomain.com
API: api.yourdomain.com → Supabase + Express Backend
Frontend: yourdomain.com → Vercel
CDN: Cloudflare (free)
Security: DDoS + WAF + Rate Limiting
SSL/TLS: Free (Cloudflare managed)
Database: Supabase PostgreSQL
```

**YOU ARE NOW PRODUCTION-READY WITH ENTERPRISE SECURITY! 🎉**
