# AWS EC2 Setup Walkthrough for EASYLEGAL Monorepo

This comprehensive guide walks you through setting up and deploying the EASYLEGAL monorepo on an AWS EC2 instance.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Part 1: AWS EC2 Instance Setup](#part-1-aws-ec2-instance-setup)
3. [Part 2: Server Configuration](#part-2-server-configuration)
4. [Part 3: Application Deployment](#part-3-application-deployment)
5. [Part 4: GitHub Actions CI/CD](#part-4-github-actions-cicd)
6. [Part 5: Domain and SSL Configuration](#part-5-domain-and-ssl-configuration)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- An AWS account
- Your SSH key pair (.pem file)
- A GitHub account with your repository
- Basic command line knowledge

---

## Part 1: AWS EC2 Instance Setup

### Step 1.1: Launch EC2 Instance

1. Log in to AWS Console and navigate to EC2
2. Click "Launch Instance"
3. Configure the instance:
   - **Name**: easylegal-server
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t2.small or t2.medium (recommended)
   - **Key Pair**: Create new or select existing key pair (download .pem file)

### Step 1.2: Configure Security Group

Create a security group with these inbound rules:

| Type  | Protocol | Port Range | Source    | Description        |
|-------|----------|------------|-----------|-------------------|
| SSH   | TCP      | 22         | Your IP   | SSH access        |
| HTTP  | TCP      | 80         | 0.0.0.0/0 | Web traffic       |
| HTTPS | TCP      | 443        | 0.0.0.0/0 | Secure web        |
| Custom| TCP      | 3000       | 0.0.0.0/0 | Backend API (temp)|

**Note**: After setting up Nginx, you can remove port 3000 access.

### Step 1.3: Configure Storage

- Set root volume to at least **20 GB** (recommend 30 GB for monorepo)
- Type: gp3 (General Purpose SSD)

### Step 1.4: Launch and Connect

1. Click "Launch Instance"
2. Wait for instance to be in "running" state
3. Note your **Public IPv4 address** or **Public IPv4 DNS**

### Step 1.5: Connect via SSH

```bash
# Set proper permissions for your key
chmod 400 /path/to/your-key.pem

# Connect to your instance
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

---

## Part 2: Server Configuration

### Step 2.1: Automated Setup (Recommended)

Once connected to your EC2 instance, run our automated setup script:

```bash
# Download the setup script
wget https://raw.githubusercontent.com/YOUR_USERNAME/easylegal/main/packages/common/scripts/setup-ec2.sh

# Make it executable
chmod +x setup-ec2.sh

# Run the setup script
./setup-ec2.sh
```

The script will:
- Install Node.js 20
- Install PM2 process manager
- Install Nginx (optional)
- Clone your repository
- Install dependencies
- Build all packages
- Start the application
- Configure firewall

### Step 2.2: Manual Setup (Alternative)

If you prefer manual setup:

#### 2.2.1: Update System

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

#### 2.2.2: Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x or higher
```

#### 2.2.3: Install PM2

```bash
sudo npm install -g pm2

# Verify installation
pm2 --version
```

#### 2.2.4: Clone Repository

```bash
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/easylegal.git
cd easylegal

# Configure Git
git config --global --add safe.directory /home/ubuntu/easylegal
```

#### 2.2.5: Install Dependencies

```bash
# Install all workspace dependencies
npm install
```

---

## Part 3: Application Deployment

### Step 3.1: Build All Packages

```bash
cd /home/ubuntu/easylegal

# Build common package first (required by others)
npm run build:common

# Build backend
npm run build:backend

# Build frontend
npm run build:frontend
```

### Step 3.2: Configure Environment Variables

Create a `.env` file in the project root:

```bash
nano /home/ubuntu/easylegal/.env
```

Add your configuration:

```env
# Application
PORT=3000
NODE_ENV=production

# Add your environment variables
# DATABASE_URL=postgresql://user:password@localhost:5432/easylegal
# JWT_SECRET=your-secret-key
# API_KEY=your-api-key
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

### Step 3.3: Start Backend with PM2

```bash
cd /home/ubuntu/easylegal

# Start the backend
pm2 start packages/backend/dist/index.js --name easylegal-backend

# Save PM2 configuration
pm2 save

# Configure PM2 to start on boot
pm2 startup
# Copy and run the command it provides
```

### Step 3.4: Verify Backend is Running

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs easylegal-backend

# Test the API
curl http://localhost:3000/api/health
# Should return: "We are alive"
```

### Step 3.5: Test from External Access

```bash
# From your local machine
curl http://YOUR_EC2_PUBLIC_IP:3000/api/health
```

---

## Part 4: GitHub Actions CI/CD

### Step 4.1: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these secrets:

#### EC2_HOST
```
YOUR_EC2_PUBLIC_IP
# or YOUR_EC2_DNS (e.g., ec2-xx-xxx-xxx-xx.compute-1.amazonaws.com)
```

#### EC2_USERNAME
```
ubuntu
```

#### EC2_SSH_KEY
```
# Paste the entire content of your .pem file
# Including -----BEGIN RSA PRIVATE KEY----- and -----END RSA PRIVATE KEY-----
```

To get your key content:
```bash
# On your local machine
cat /path/to/your-key.pem
```

Copy the entire output and paste it as the secret value.

### Step 4.2: Test GitHub Actions

1. Make a small change to your code:
```bash
# On your local machine
cd /path/to/easylegal
echo "# Test deployment" >> README.md
git add README.md
git commit -m "test: trigger deployment"
git push origin main
```

2. Watch the deployment:
   - Go to your GitHub repository
   - Click the **Actions** tab
   - Click on the latest workflow run
   - Monitor the "Test and Build Monorepo" and "Deploy to EC2" jobs

### Step 4.3: Verify Deployment

```bash
# SSH into your EC2 instance
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP

# Check PM2 status
pm2 status

# View recent logs
pm2 logs easylegal-backend --lines 50
```

---

## Part 5: Domain and SSL Configuration

### Step 5.1: Point Domain to EC2

1. In your domain registrar (e.g., Namecheap, GoDaddy):
   - Create an **A record** pointing to your EC2 Public IP
   - Example: `easylegal.online` → `YOUR_EC2_PUBLIC_IP`

2. Wait for DNS propagation (can take 5-60 minutes)

3. Verify with:
```bash
ping easylegal.online
```

### Step 5.2: Install Nginx

```bash
sudo apt-get install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 5.3: Configure Nginx

Use our provided configuration:

```bash
# Copy the nginx config
sudo cp /home/ubuntu/easylegal/packages/common/scripts/nginx-config.conf /etc/nginx/sites-available/easylegal

# Edit to update your domain
sudo nano /etc/nginx/sites-available/easylegal
# Change "your-domain.com" to your actual domain

# Create symlink
sudo ln -s /etc/nginx/sites-available/easylegal /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 5.4: Install SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d easylegal.online -d www.easylegal.online

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 5.5: Update Security Group

Now that Nginx is handling traffic:
1. Go to AWS Console → EC2 → Security Groups
2. Find your security group
3. **Remove** the rule allowing port 3000 from 0.0.0.0/0
4. Keep ports 22 (SSH), 80 (HTTP), and 443 (HTTPS)

### Step 5.6: Test Your Deployment

```bash
# Test HTTP (should redirect to HTTPS)
curl -I http://easylegal.online

# Test HTTPS
curl https://easylegal.online/api/health

# Test frontend
curl -I https://easylegal.online
```

---

## Troubleshooting

### Issue: Cannot SSH into EC2

**Solution**:
```bash
# Check key permissions
chmod 400 /path/to/your-key.pem

# Verify security group allows SSH from your IP
# AWS Console → EC2 → Security Groups → Inbound rules
```

### Issue: Backend not responding

**Solution**:
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs easylegal-backend

# Restart backend
pm2 restart easylegal-backend

# Check if port is listening
sudo netstat -tlnp | grep 3000
```

### Issue: GitHub Actions deployment fails

**Solution**:
1. Verify GitHub secrets are correct
2. Check EC2 security group allows SSH from GitHub Actions IPs
3. Verify SSH key format (should include BEGIN/END lines)
4. Check workflow logs in GitHub Actions tab

### Issue: "Permission denied" during deployment

**Solution**:
```bash
# On EC2, ensure proper ownership
sudo chown -R ubuntu:ubuntu /home/ubuntu/easylegal

# Verify git directory is safe
git config --global --add safe.directory /home/ubuntu/easylegal
```

### Issue: Frontend shows blank page

**Solution**:
```bash
# Rebuild frontend
cd /home/ubuntu/easylegal
npm run build:frontend

# Check Nginx configuration
sudo nginx -t
sudo systemctl reload nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/easylegal-error.log
```

### Issue: SSL certificate error

**Solution**:
```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Test certificate
curl -vI https://easylegal.online
```

---

## Useful Commands

### PM2 Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs easylegal-backend

# Monitor in real-time
pm2 monit

# Restart application
pm2 restart easylegal-backend

# Stop application
pm2 stop easylegal-backend

# Delete from PM2
pm2 delete easylegal-backend

# Save current PM2 list
pm2 save
```

### Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

### System Commands

```bash
# Check disk space
df -h

# Check memory usage
free -m

# Check running processes
top

# Check Node.js version
node --version

# Check open ports
sudo netstat -tlnp
```

---

## Manual Deployment Script

For quick manual deployments, use the provided script:

```bash
cd /home/ubuntu/easylegal
bash packages/common/scripts/deploy.sh
```

This will:
1. Pull latest code
2. Install dependencies
3. Build all packages
4. Run tests
5. Restart application

---

## Next Steps

1. Set up monitoring (CloudWatch, DataDog, etc.)
2. Configure backup strategy
3. Set up database (if needed)
4. Configure email service
5. Add custom domain email
6. Set up staging environment
7. Configure CDN (CloudFront)

---

## Support

For issues or questions:
- Check GitHub Issues
- Review application logs: `pm2 logs`
- Review Nginx logs: `/var/log/nginx/`
- Check system logs: `sudo journalctl -u nginx`
