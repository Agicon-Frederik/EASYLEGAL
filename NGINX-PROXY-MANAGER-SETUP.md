# Nginx Proxy Manager Setup for EASYLEGAL

This guide walks you through setting up EASYLEGAL using Nginx Proxy Manager's web UI instead of manual Nginx configuration.

## Prerequisites

- EASYLEGAL deployed on EC2 with backend running on port 3000
- Nginx Proxy Manager installed and accessible at https://nginx.agicon.be/nginx/proxy
- Domain name pointed to your EC2 instance (e.g., easylegal.agicon.be)
- Backend running with PM2: `pm2 list` should show `easylegal-backend`

---

## Part 1: Prepare Your EC2 Instance

### Step 1.1: Verify Backend is Running

SSH into your EC2 instance:

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

Check PM2 status:

```bash
pm2 list
# Should show: easylegal-backend (online)

# Test backend locally
curl http://localhost:3000/api/health
# Should return: "We are alive"
```

### Step 1.2: Note Your EC2 Internal IP

You'll need this for Nginx Proxy Manager:

```bash
# Get internal IP
hostname -I | awk '{print $1}'

# Or check with:
ip addr show | grep 'inet ' | grep -v '127.0.0.1'
```

**Example:** `172.31.42.141` (this is your EC2 private IP)

### Step 1.3: Ensure Frontend is Built

The frontend must be built and available in the `dist/` folder:

```bash
cd /home/ubuntu/easylegal

# Build frontend if not already done
npm run build:frontend

# Verify dist folder exists
ls -la packages/frontend/dist/
# Should show index.html and assets/
```

---

## Part 2: Configure Nginx Proxy Manager

### Step 2.1: Login to Nginx Proxy Manager

1. Go to https://nginx.agicon.be/nginx/proxy
2. Login with your credentials
3. You should see the Nginx Proxy Manager dashboard

### Step 2.2: Add Proxy Host for Backend API

**Purpose:** This forwards API requests to your backend.

1. Click **"Proxy Hosts"** in the left sidebar
2. Click **"Add Proxy Host"** button

**Details Tab:**

| Field | Value | Notes |
|-------|-------|-------|
| **Domain Names** | `api.easylegal.online` | Or your API subdomain |
| **Scheme** | `http` | Backend uses HTTP internally |
| **Forward Hostname / IP** | `172.31.42.141` | Your EC2 private IP |
| **Forward Port** | `3000` | Backend port |
| **Cache Assets** | ☐ Unchecked | Don't cache API responses |
| **Block Common Exploits** | ☑ Checked | Enable security |
| **Websockets Support** | ☑ Checked | Enable for real-time features |
| **Access List** | `Publicly Accessible` | Or restrict if needed |

**Custom Locations Tab:**

Click **"Add location"**:

| Field | Value |
|-------|-------|
| **Define Location** | `/` |
| **Scheme** | `http` |
| **Forward Hostname / IP** | `172.31.42.141` |
| **Forward Port** | `3000` |

**Advanced Tab:**

Add this custom Nginx configuration:

```nginx
# Increase timeouts for API requests
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;

# Headers
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

# Disable buffering for streaming responses
proxy_buffering off;
proxy_cache_bypass $http_upgrade;
```

**SSL Tab:**

1. ☑ Check **"Force SSL"**
2. ☑ Check **"HTTP/2 Support"**
3. ☑ Check **"HSTS Enabled"**
4. Select **"Request a new SSL Certificate"**
5. ☑ Check **"Force SSL"**
6. Enter your email address
7. ☑ Check **"I Agree to the Let's Encrypt Terms of Service"**

Click **"Save"**

### Step 2.3: Add Proxy Host for Frontend

**Purpose:** This serves your React frontend as a static website.

1. Click **"Proxy Hosts"** in the left sidebar
2. Click **"Add Proxy Host"** button

**Details Tab:**

| Field | Value | Notes |
|-------|-------|-------|
| **Domain Names** | `easylegal.online` | Your main domain |
| **Scheme** | `http` | We'll use custom config below |
| **Forward Hostname / IP** | `172.31.42.141` | Your EC2 private IP |
| **Forward Port** | `80` | Placeholder (we'll override) |
| **Cache Assets** | ☑ Checked | Cache static assets |
| **Block Common Exploits** | ☑ Checked | Enable security |
| **Websockets Support** | ☐ Unchecked | Not needed for static files |
| **Access List** | `Publicly Accessible` | Or use your auth system |

**Advanced Tab:**

**IMPORTANT:** Add this custom configuration to serve the React app:

```nginx
# Serve static frontend files
location / {
    root /home/ubuntu/easylegal/packages/frontend/dist;
    try_files $uri $uri/ /index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Proxy API requests to backend
location /api {
    proxy_pass http://172.31.42.141:3000;
    proxy_http_version 1.1;

    # Headers
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Buffering
    proxy_cache_bypass $http_upgrade;
    proxy_buffering off;
}

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
```

**Important Notes:**
- Replace `172.31.42.141` with your actual EC2 private IP
- The `root` path must point to where your built frontend is located
- The `/api` location proxies all API calls to your backend

**SSL Tab:**

1. ☑ Check **"Force SSL"**
2. ☑ Check **"HTTP/2 Support"**
3. ☑ Check **"HSTS Enabled"**
4. Select **"Request a new SSL Certificate"**
5. ☑ Check **"Force SSL"**
6. Enter your email address
7. ☑ Check **"I Agree to the Let's Encrypt Terms of Service"**

Click **"Save"**

---

## Part 3: Configure EC2 Security Group

### Step 3.1: Update Security Group Rules

Since Nginx Proxy Manager will handle incoming traffic, you need to ensure your EC2 security group allows:

**Inbound Rules:**

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | Your IP | SSH access |
| Custom TCP | TCP | 3000 | Nginx Proxy Manager IP | Backend API |
| Custom TCP | TCP | 80 | Nginx Proxy Manager IP | For NPM to serve frontend |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Public HTTPS (optional if NPM handles) |

**Important:**
- If Nginx Proxy Manager is on the same VPC, use the security group ID instead of IP
- You may NOT need to open port 80/443 on EC2 if NPM is handling all external traffic
- Port 3000 should only be accessible from Nginx Proxy Manager, not publicly

---

## Part 4: Update Frontend Environment Variables

### Step 4.1: Update Frontend API URL

Your frontend needs to know where the API is:

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Edit frontend .env
nano /home/ubuntu/easylegal/packages/frontend/.env
```

Update to:

```env
VITE_API_URL=https://api.easylegal.online
```

Or if you're using the same domain with `/api` path:

```env
VITE_API_URL=https://easylegal.online
```

Save and rebuild:

```bash
cd /home/ubuntu/easylegal
npm run build:frontend
```

### Step 4.2: Update Backend Environment Variables

Update CORS settings in backend:

```bash
nano /home/ubuntu/easylegal/packages/backend/.env
```

Update:

```env
FRONTEND_URL=https://easylegal.online
```

Restart backend:

```bash
pm2 restart easylegal-backend
```

---

## Part 5: Testing Your Setup

### Step 5.1: Test Backend API

```bash
# From your local machine
curl https://api.easylegal.online/api/health

# Should return: "We are alive"
```

### Step 5.2: Test Frontend

1. Open browser to: https://easylegal.online
2. You should see the login page
3. Check browser console (F12) for any errors
4. Verify it redirects HTTP to HTTPS

### Step 5.3: Test Authentication Flow

1. Go to https://easylegal.online/login
2. Enter an authorized email (frederik@agicon.be or pascale@easylegal.be)
3. Check email for magic link
4. Click magic link to verify login works
5. Should redirect to home page with your name displayed

---

## Part 6: Troubleshooting

### Issue: 502 Bad Gateway on API

**Solution:**

1. Verify backend is running:
   ```bash
   pm2 status
   pm2 logs easylegal-backend
   ```

2. Check backend is accessible from NPM server:
   ```bash
   curl http://YOUR_EC2_PRIVATE_IP:3000/api/health
   ```

3. Verify the Forward IP in Nginx Proxy Manager is correct (use private IP, not public)

### Issue: Frontend shows 404 or blank page

**Solution:**

1. Verify frontend is built:
   ```bash
   ls -la /home/ubuntu/easylegal/packages/frontend/dist/
   ```

2. Check the `root` path in NPM Advanced config is correct

3. Verify the `try_files` directive includes `/index.html` for React Router

4. Check NPM error logs in the UI

### Issue: CORS errors in browser console

**Solution:**

1. Verify `FRONTEND_URL` in backend `.env` matches your domain

2. Restart backend after changing environment variables:
   ```bash
   pm2 restart easylegal-backend
   ```

3. Check browser Network tab to see actual request headers

### Issue: SSL certificate not working

**Solution:**

1. Verify domain DNS points to Nginx Proxy Manager IP (not EC2 directly)
2. Check Let's Encrypt rate limits (5 certs per domain per week)
3. Try using "Use a DNS Challenge" if HTTP challenge fails
4. Verify ports 80 and 443 are open on NPM server

### Issue: API requests timing out

**Solution:**

1. Increase timeouts in NPM Advanced config (already included above)
2. Check backend logs for slow queries
3. Verify security group allows NPM → EC2 traffic

---

## Part 7: File Permissions for Nginx Proxy Manager

If Nginx Proxy Manager is running in Docker or as a different user, it needs read access to the frontend files.

### Option 1: Make Files World-Readable

```bash
cd /home/ubuntu/easylegal
chmod -R 755 packages/frontend/dist/
```

### Option 2: Run NPM with Proper User

Configure Nginx Proxy Manager to run as the `ubuntu` user (advanced, depends on your NPM setup).

---

## Summary Configuration

### Your Setup Should Look Like:

```
User Browser
    ↓
Nginx Proxy Manager (https://nginx.agicon.be)
    ↓
    ├── easylegal.online → Serves static files from EC2:/home/ubuntu/easylegal/packages/frontend/dist/
    ├── easylegal.online/api → Proxies to EC2:3000 (backend)
    └── api.easylegal.online → Proxies to EC2:3000 (backend)

EC2 Instance
    ├── PM2: easylegal-backend (port 3000)
    └── Static Files: /home/ubuntu/easylegal/packages/frontend/dist/
```

### Key URLs:

| URL | Purpose | Points To |
|-----|---------|-----------|
| https://easylegal.online | Frontend | Static files on EC2 |
| https://easylegal.online/api/* | API requests | Backend on EC2:3000 |
| https://api.easylegal.online | API (alternative) | Backend on EC2:3000 |

---

## Deployment Workflow

When you push changes to GitHub:

1. GitHub Actions deploys to EC2
2. Builds are automatically created
3. PM2 restarts backend
4. Nginx Proxy Manager automatically serves new frontend files
5. No need to restart NPM - it reads files on each request

---

## Additional Configuration

### Rate Limiting in NPM

To prevent abuse of your API, you can add rate limiting in the Advanced tab:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req zone=api_limit burst=20 nodelay;
```

### Custom Error Pages

Add custom error pages in NPM Advanced tab:

```nginx
error_page 502 503 504 /50x.html;
location = /50x.html {
    root /home/ubuntu/easylegal/packages/frontend/dist;
}
```

---

## Security Checklist

- ☑ SSL certificates installed and forced
- ☑ HSTS enabled
- ☑ Security headers configured
- ☑ Backend port 3000 not publicly accessible
- ☑ CORS properly configured
- ☑ Rate limiting enabled (optional)
- ☑ Access lists configured (optional)
- ☑ Block common exploits enabled

---

## Updating After Changes

When you make code changes:

**Backend Changes:**
```bash
# SSH into EC2
cd /home/ubuntu/easylegal
git pull
npm install
npm run build:backend
pm2 restart easylegal-backend
```

**Frontend Changes:**
```bash
# SSH into EC2
cd /home/ubuntu/easylegal
git pull
npm install
npm run build:frontend
# Nginx Proxy Manager will serve the new files automatically
```

**No need to touch Nginx Proxy Manager** - it automatically serves the updated files!

---

## Support

If you encounter issues:

1. Check PM2 logs: `pm2 logs easylegal-backend`
2. Check Nginx Proxy Manager logs in the UI
3. Verify security group rules in AWS console
4. Test backend locally: `curl http://localhost:3000/api/health`
5. Check DNS: `nslookup easylegal.online`

---

## Advantages of Using Nginx Proxy Manager

✅ Easy web UI configuration
✅ Automatic SSL certificate management
✅ Built-in access control
✅ Real-time logs viewer
✅ No need to edit config files manually
✅ Visual proxy host management
✅ Centralized proxy management for multiple apps

---

This completes your Nginx Proxy Manager setup for EASYLEGAL!
