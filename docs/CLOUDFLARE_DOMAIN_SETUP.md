# 🌐 TiQology Domain Configuration Guide

**Domain:** tiqology.com (Cloudflare)  
**Date:** December 7, 2025

---

## 🎯 Domain Architecture

We'll configure your Cloudflare domain for optimal performance:

```
tiqology.com (root)
├── www.tiqology.com → Frontend (SPA)
├── api.tiqology.com → Backend (API)
└── app.tiqology.com → Alternative frontend access
```

---

## 📋 Cloudflare DNS Configuration

### **Step 1: Login to Cloudflare**
1. Go to: https://dash.cloudflare.com
2. Select domain: **tiqology.com**
3. Navigate to: **DNS** → **Records**

### **Step 2: Add DNS Records**

Add these DNS records:

| Type | Name | Target | Proxy Status | TTL |
|------|------|--------|--------------|-----|
| **CNAME** | `www` | `cname.vercel-dns.com` | ✅ Proxied | Auto |
| **CNAME** | `api` | `cname.vercel-dns.com` | ✅ Proxied | Auto |
| **CNAME** | `app` | `cname.vercel-dns.com` | ⚠️ DNS Only | Auto |
| **A** | `@` | (Vercel IP from Vercel dashboard) | ✅ Proxied | Auto |

**Why Proxied?**
- ✅ Free Cloudflare CDN
- ✅ DDoS protection
- ✅ SSL/TLS encryption
- ✅ Analytics

### **Step 3: SSL/TLS Settings**

1. Navigate to: **SSL/TLS** → **Overview**
2. Set encryption mode: **Full (strict)**
3. Enable: **Always Use HTTPS**
4. Enable: **Automatic HTTPS Rewrites**

---

## 🚀 Vercel Domain Configuration

### **Backend (api.tiqology.com)**

**In Vercel Dashboard:**

1. Go to: https://vercel.com/dashboard
2. Select project: **ai-chatbot**
3. Navigate to: **Settings** → **Domains**
4. Click: **Add Domain**
5. Enter: `api.tiqology.com`
6. Vercel will show DNS configuration:
   - **Type:** CNAME
   - **Name:** api
   - **Value:** cname.vercel-dns.com
7. Click: **Verify** (after adding in Cloudflare)
8. Set as **Production Domain**: ✅

### **Frontend (www.tiqology.com + tiqology.com)**

**In Vercel Dashboard:**

1. Select project: **tiqology-spa**
2. Navigate to: **Settings** → **Domains**
3. Add domains:
   - `www.tiqology.com` (primary)
   - `tiqology.com` (redirect to www)
   - `app.tiqology.com` (alternative access)
4. Configure redirect:
   - From: `tiqology.com`
   - To: `www.tiqology.com`
   - Status: 301 (Permanent)

---

## ⚙️ Environment Variable Updates

After domain configuration, update environment variables in Vercel:

### **Backend Project (ai-chatbot)**

```env
NEXTAUTH_URL=https://api.tiqology.com
CORS_ALLOWED_ORIGINS=https://tiqology.com,https://www.tiqology.com,https://app.tiqology.com
NEXT_PUBLIC_DOMAIN=tiqology.com
NEXT_PUBLIC_API_URL=https://api.tiqology.com
```

### **Frontend Project (tiqology-spa)**

```env
NEXT_PUBLIC_API_URL=https://api.tiqology.com
NEXT_PUBLIC_APP_URL=https://www.tiqology.com
NEXT_PUBLIC_DOMAIN=tiqology.com
```

---

## 🔒 Cloudflare Security Settings

### **Firewall Rules**

1. Navigate to: **Security** → **WAF**
2. Enable: **Managed Ruleset**
3. Add custom rule for API rate limiting:

```
(http.host eq "api.tiqology.com" and http.request.uri.path contains "/api/")
  → Rate Limit: 100 requests/minute
```

### **Page Rules** (Optional)

1. Navigate to: **Rules** → **Page Rules**
2. Add rule for caching:

**Rule 1: Cache Static Assets**
- URL: `www.tiqology.com/_next/*`
- Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month

**Rule 2: Bypass Cache for API**
- URL: `api.tiqology.com/*`
- Settings:
  - Cache Level: Bypass

---

## ✅ Verification Steps

### **1. DNS Propagation Check**

```bash
# Check DNS resolution
dig www.tiqology.com
dig api.tiqology.com

# Should show Cloudflare IPs (proxied)
# Example: 104.21.x.x or 172.67.x.x
```

### **2. SSL Certificate Check**

```bash
# Check SSL certificate
curl -I https://www.tiqology.com
curl -I https://api.tiqology.com

# Should return 200 OK with SSL info
```

### **3. Endpoint Testing**

```bash
# Test frontend
curl https://www.tiqology.com
# Expected: HTML response

# Test backend health
curl https://api.tiqology.com/api/health
# Expected: {"status":"healthy",...}

# Test CORS
curl -H "Origin: https://www.tiqology.com" \
     -I https://api.tiqology.com/api/health
# Check for: Access-Control-Allow-Origin header
```

---

## 🎯 Post-Configuration Checklist

- [ ] ✅ DNS records added in Cloudflare
- [ ] ✅ SSL/TLS set to Full (strict)
- [ ] ✅ Always Use HTTPS enabled
- [ ] ✅ Domains added in Vercel (backend)
- [ ] ✅ Domains added in Vercel (frontend)
- [ ] ✅ Environment variables updated
- [ ] ✅ DNS propagation complete (can take 5-60 minutes)
- [ ] ✅ SSL certificates issued (automatic via Vercel + Cloudflare)
- [ ] ✅ CORS working (frontend → backend)
- [ ] ✅ Redirects working (tiqology.com → www.tiqology.com)

---

## 🔧 Troubleshooting

### **DNS Not Resolving**

**Problem:** Domain not pointing to Vercel  
**Solution:**
1. Wait 5-60 minutes for DNS propagation
2. Check Cloudflare DNS records are correct
3. Verify proxy status (orange cloud = proxied)
4. Use `dig` or `nslookup` to check DNS

### **SSL Certificate Error**

**Problem:** SSL/TLS handshake failed  
**Solution:**
1. In Cloudflare: Set SSL/TLS to **Full (strict)**
2. Wait for Vercel to issue SSL certificate (automatic)
3. Check Vercel domain status (should show green checkmark)

### **CORS Errors**

**Problem:** Frontend can't call backend API  
**Solution:**
1. Update `CORS_ALLOWED_ORIGINS` in backend `.env`
2. Include all frontend domains:
   - `https://tiqology.com`
   - `https://www.tiqology.com`
   - `https://app.tiqology.com`
3. Redeploy backend after env var update

### **404 Errors**

**Problem:** Routes not found  
**Solution:**
1. Check Vercel deployment logs
2. Verify build completed successfully
3. Check Next.js routing configuration
4. Ensure `next.config.ts` has correct settings

---

## 📊 Performance Optimization

### **Cloudflare Settings**

1. **Auto Minify** (Rules → Auto Minify)
   - ✅ JavaScript
   - ✅ CSS
   - ✅ HTML

2. **Brotli Compression** (Speed → Optimization)
   - ✅ Enable Brotli

3. **HTTP/2** (Network)
   - ✅ Enable HTTP/2
   - ✅ Enable HTTP/3 (QUIC)

4. **Caching** (Caching → Configuration)
   - Browser Cache TTL: 4 hours
   - Always Online: ✅ Enabled

---

## 🎊 Final URLs

After configuration:

**Frontend (Public):**
- https://www.tiqology.com (primary)
- https://tiqology.com (redirects to www)
- https://app.tiqology.com (alternative)

**Backend (API):**
- https://api.tiqology.com

**Health Check:**
- https://api.tiqology.com/api/health

**Analytics (Admin Only):**
- https://api.tiqology.com/api/analytics?type=overview

---

**DNS propagation can take 5-60 minutes. Be patient!** ⏳

**Built for Commander AL by Devin**  
**December 7, 2025**
