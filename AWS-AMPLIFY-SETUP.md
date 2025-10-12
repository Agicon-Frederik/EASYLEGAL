# AWS Amplify Deployment Guide for EASYLEGAL

This guide shows you how to deploy the EASYLEGAL frontend to AWS Amplify while keeping the backend on EC2.

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│  AWS Amplify (Frontend)                     │
│  - React app hosted on Amplify CDN         │
│  - Auto-builds on git push                  │
│  - SSL certificate included                 │
│  - Global CDN distribution                  │
└─────────────────┬───────────────────────────┘
                  │
                  │ API calls to
                  ↓
┌─────────────────────────────────────────────┐
│  AWS EC2 (Backend)                          │
│  - Express.js API on port 3000             │
│  - PM2 process manager                      │
│  - SQLite database                          │
│  - Email service                            │
└─────────────────────────────────────────────┘
```

## Prerequisites

- ✅ Backend deployed and running on EC2 (follow AWS-EC2-SETUP.md)
- ✅ GitHub repository with your code
- ✅ AWS account with Amplify access
- ✅ Domain name (optional, but recommended)

---

## Part 1: Prepare Backend for Amplify Frontend

### Step 1.1: Update Backend CORS Settings

Your backend needs to allow requests from the Amplify domain.

SSH into your EC2 instance:

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

Edit backend `.env`:

```bash
cd /home/ubuntu/easylegal
nano packages/backend/.env
```

Update `FRONTEND_URL` to include your Amplify domain (we'll get this in Part 2):

```env
# For now, keep it flexible (you'll update after getting Amplify URL)
FRONTEND_URL=https://main.d1234567890.amplifyapp.com
```

Or allow multiple origins by modifying `packages/backend/src/app.ts`:

```typescript
// Update CORS configuration to allow Amplify
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://main.d1234567890.amplifyapp.com', // Your Amplify URL
  'https://easylegal.online', // Your custom domain (if using)
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

Rebuild and restart:

```bash
npm run build:backend
pm2 restart easylegal-backend
```

### Step 1.2: Ensure Backend is Accessible

Your backend API must be publicly accessible (or through Nginx Proxy Manager):

```bash
# Test from outside
curl https://api.easylegal.online/api/health

# Should return: "We are alive"
```

---

## Part 2: Set Up AWS Amplify

### Step 2.1: Access AWS Amplify Console

1. Go to AWS Console: https://console.aws.amazon.com/
2. Search for **"Amplify"** in the services search
3. Click **"AWS Amplify"**

### Step 2.2: Create New Amplify App

1. Click **"New app"** → **"Host web app"**
2. Choose **"GitHub"** as your Git provider
3. Click **"Continue"**
4. Authorize AWS Amplify to access your GitHub account (if first time)

### Step 2.3: Select Repository

1. **Select your repository:** `your-username/easylegal`
2. **Select branch:** `main`
3. Click **"Next"**

### Step 2.4: Configure Build Settings

Amplify should auto-detect the monorepo. Verify these settings:

**App name:**
```
easylegal-frontend
```

**Environment:** `main` (or your branch name)

**Build settings:**

Amplify should auto-detect the `amplify.yml` file. If not, paste this:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - npm run build:common
    build:
      commands:
        - npm run build:frontend
  artifacts:
    baseDirectory: packages/frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - packages/*/node_modules/**/*
```

**Advanced settings (click "Advanced settings"):**

Add environment variables:

| Key | Value | Description |
|-----|-------|-------------|
| `VITE_API_URL` | `https://api.easylegal.online` | Your backend API URL |
| `NODE_VERSION` | `20` | Node.js version |

Click **"Next"**

### Step 2.5: Review and Deploy

1. Review all settings
2. Click **"Save and deploy"**
3. Wait for initial deployment (usually 3-5 minutes)

You'll see these stages:
- ✅ Provision
- ✅ Build
- ✅ Deploy
- ✅ Verify

### Step 2.6: Get Your Amplify URL

Once deployed, you'll see your app URL:

```
https://main.d1234567890abc.amplifyapp.com
```

**Important:** Copy this URL - you'll need it for the backend CORS configuration!

---

## Part 3: Update Backend CORS with Amplify URL

### Step 3.1: Add Amplify URL to Backend

SSH back into your EC2:

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
cd /home/ubuntu/easylegal
```

Update backend CORS (choose one method):

**Method A: Update .env (simple)**

```bash
nano packages/backend/.env
```

Add your Amplify URL:

```env
FRONTEND_URL=https://main.d1234567890abc.amplifyapp.com
```

**Method B: Update app.ts for multiple origins (better)**

```bash
nano packages/backend/src/app.ts
```

Update CORS configuration:

```typescript
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'https://main.d1234567890abc.amplifyapp.com', // Amplify URL
  'https://easylegal.online', // Custom domain (if you set one up)
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

Rebuild and restart:

```bash
npm run build:backend
pm2 restart easylegal-backend
```

---

## Part 4: Test Your Deployment

### Step 4.1: Test Amplify Frontend

1. Visit your Amplify URL: `https://main.d1234567890abc.amplifyapp.com`
2. You should see the login page
3. Check browser console (F12) for any errors

### Step 4.2: Test Authentication Flow

1. Enter an authorized email (frederik@agicon.be or pascale@easylegal.be)
2. Check email for magic link
3. Click magic link
4. Should redirect and log you in successfully

### Step 4.3: Check API Connectivity

In browser console:

```javascript
// Check if API is accessible
fetch('https://api.easylegal.online/api/health')
  .then(r => r.text())
  .then(console.log)

// Should log: "We are alive"
```

---

## Part 5: Add Custom Domain (Optional)

### Step 5.1: Add Domain in Amplify

1. In Amplify Console, go to your app
2. Click **"Domain management"** in left sidebar
3. Click **"Add domain"**
4. Enter your domain: `easylegal.online`
5. Click **"Configure domain"**

### Step 5.2: Configure Subdomains

Amplify will suggest:

- ✅ `https://easylegal.online` → Your app
- ✅ `https://www.easylegal.online` → Your app

Click **"Save"**

### Step 5.3: Update DNS Records

Amplify will provide DNS records. Add these to your domain registrar:

**Example records:**

| Type | Name | Value |
|------|------|-------|
| CNAME | easylegal.online | d1234567890abc.cloudfront.net |
| CNAME | www | d1234567890abc.cloudfront.net |

### Step 5.4: Wait for DNS Propagation

- Certificate issuance: 5-10 minutes
- DNS propagation: 5-60 minutes
- Check status in Amplify Console

### Step 5.5: Update Backend CORS (Again)

Add your custom domain to allowed origins:

```bash
nano packages/backend/src/app.ts
```

Add to `allowedOrigins` array:

```typescript
const allowedOrigins = [
  'http://localhost:5173',
  'https://main.d1234567890abc.amplifyapp.com',
  'https://easylegal.online',
  'https://www.easylegal.online',
];
```

Rebuild and restart:

```bash
npm run build:backend
pm2 restart easylegal-backend
```

---

## Part 6: Configure Automatic Deployments

Amplify automatically deploys when you push to GitHub!

### Step 6.1: Verify Auto-Deploy is Enabled

1. In Amplify Console → Your app
2. Click **"Build settings"**
3. Ensure **"Automatic builds"** is enabled for your branch

### Step 6.2: Test Auto-Deploy

Make a small change locally:

```bash
# On your local machine
cd /path/to/easylegal

# Make a change
echo "# Testing Amplify deploy" >> README.md

# Commit and push
git add README.md
git commit -m "test: trigger Amplify deployment"
git push origin main
```

### Step 6.3: Monitor Deployment

1. Go to Amplify Console
2. You'll see a new build triggered
3. Watch the build stages
4. Once complete, changes are live!

---

## Part 7: Environment-Specific Builds (Optional)

### Step 7.1: Create Staging Branch

```bash
# Create staging branch
git checkout -b staging
git push origin staging
```

### Step 7.2: Add Staging Branch to Amplify

1. Amplify Console → Your app
2. Click **"Connect branch"**
3. Select **"staging"** branch
4. Configure with different environment variables:
   - `VITE_API_URL` = `https://api-staging.easylegal.online`

Now you have:
- `main` branch → Production (easylegal.online)
- `staging` branch → Staging (staging.easylegal.online)

---

## Part 8: Update GitHub Actions

Since Amplify handles frontend deployment, update your GitHub Actions to only deploy backend:

Edit `.github/workflows/deploy.yml`:

```yaml
name: Deploy Backend to EC2

on:
  push:
    branches:
      - main
    paths:
      - 'packages/backend/**'
      - 'packages/common/**'
      - '.github/workflows/**'

jobs:
  deploy-backend:
    name: Deploy Backend to EC2
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy Backend to EC2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USERNAME }}
          key: ${{ secrets.EC2_SSH_KEY }}
          port: ${{ secrets.EC2_SSH_PORT || 22 }}
          script: |
            cd /home/${{ secrets.EC2_USERNAME }}/easylegal

            git pull origin main
            npm install
            npm run build:common
            npm run build:backend
            npm run test:backend

            pm2 restart easylegal-backend
            pm2 save
```

Now:
- ✅ **Amplify** handles frontend deployment automatically
- ✅ **GitHub Actions** handles backend deployment to EC2

---

## Troubleshooting

### Issue: Build fails with "tsc: command not found"

**Solution:**

Update `amplify.yml` to ensure TypeScript is installed:

```yaml
preBuild:
  commands:
    - npm ci
    - npm install -g typescript
    - npm run build:common
```

### Issue: Frontend can't reach backend API

**Solution:**

1. Check `VITE_API_URL` in Amplify environment variables
2. Verify backend CORS allows Amplify domain
3. Check backend is publicly accessible:
   ```bash
   curl https://api.easylegal.online/api/health
   ```

### Issue: "Mixed Content" warning (HTTP/HTTPS)

**Solution:**

Ensure `VITE_API_URL` uses `https://` not `http://`

### Issue: Build succeeds but app shows blank page

**Solution:**

1. Check browser console for errors (F12)
2. Verify `baseDirectory` in `amplify.yml` is correct
3. Check if `index.html` exists in build output:
   - In Amplify Console → Build logs
   - Look for artifacts section

### Issue: Environment variables not working

**Solution:**

1. Vite environment variables MUST start with `VITE_`
2. Set in Amplify Console → App Settings → Environment variables
3. Rebuild app after adding variables

---

## Cost Considerations

### AWS Amplify Pricing (as of 2024)

**Hosting:**
- Build minutes: $0.01 per minute
- Hosting: $0.15 per GB served
- Free tier: 1000 build minutes/month, 15 GB served/month

**Typical EASYLEGAL costs:**
- ~3 builds/day = 90 builds/month
- ~2 minutes per build = 180 build minutes/month
- ~5 GB data transfer/month

**Estimated cost: $0-5/month** (likely free tier)

### EC2 Costs (Backend)

- t2.small: ~$17/month
- t2.micro (free tier eligible): $0-9/month

**Total estimated cost: $0-22/month**

---

## Comparison: Amplify vs Nginx Proxy Manager

| Feature | Amplify | NPM |
|---------|---------|-----|
| Setup complexity | Easy | Medium |
| Auto-deployment | ✅ Yes | ❌ No |
| CDN | ✅ Yes | ❌ No |
| SSL management | ✅ Automatic | Manual/Let's Encrypt |
| Cost | ~$0-5/month | Included with server |
| Performance | ⚡ Global CDN | Single server |
| Custom domain | ✅ Easy | ✅ Easy |

**Recommendation:** Use Amplify for frontend, keep EC2+NPM for backend API

---

## Summary

✅ **What you get with Amplify:**
- Automatic deployments on git push
- Global CDN for fast loading
- Free SSL certificates
- Built-in CI/CD
- Preview deployments for PRs
- Rollback capability

✅ **What stays on EC2:**
- Backend API (Express.js)
- Database (SQLite)
- Email service
- Authentication logic

🎉 **Result:** Best of both worlds - managed frontend hosting with full backend control!

---

## Next Steps

1. ✅ Deploy backend to EC2 (if not done)
2. ✅ Create Amplify app and connect to GitHub
3. ✅ Update backend CORS with Amplify URL
4. ✅ Test authentication flow
5. ✅ (Optional) Add custom domain
6. ✅ Update GitHub Actions for backend-only deployment

Need help with any step? Check the logs in:
- **Amplify:** Console → Build history → View logs
- **Backend:** `ssh` to EC2 → `pm2 logs easylegal-backend`
