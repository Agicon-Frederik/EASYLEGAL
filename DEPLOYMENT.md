# Deployment Setup Guide

This guide explains how to set up automated deployment to AWS EC2 using GitHub Actions for the EASYLEGAL monorepo.

## Quick Links

- **[Complete AWS EC2 Setup Walkthrough](./AWS-EC2-SETUP.md)** - Comprehensive step-by-step guide
- **Automated Setup Script**: `packages/common/scripts/setup-ec2.sh`
- **Manual Deployment Script**: `packages/common/scripts/deploy.sh`
- **Nginx Configuration**: `packages/common/scripts/nginx-config.conf`

## Monorepo Structure

The project is organized as a monorepo with npm workspaces:
- `packages/backend` - Express.js API server
- `packages/frontend` - React application with Vite
- `packages/common` - Shared utilities, types, and deployment scripts

## Overview

The deployment workflow automatically:
1. Builds and tests all packages (common, backend, frontend)
2. Only deploys if all tests pass
3. Deploys to your EC2 instance via SSH
4. Builds all packages on the server
5. Restarts the backend application using PM2

## Quick Start

### Option 1: Automated Setup (Recommended)

For a fresh EC2 instance, use the automated setup script:

```bash
# On your EC2 instance
wget https://raw.githubusercontent.com/YOUR_USERNAME/easylegal/main/packages/common/scripts/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh
```

This will set up everything automatically including Node.js, PM2, dependencies, and start the application.

### Option 2: Manual Setup

See the detailed [AWS EC2 Setup Walkthrough](./AWS-EC2-SETUP.md) for step-by-step instructions.

## Prerequisites

### On Your EC2 Instance

1. **System Requirements**
   - Ubuntu 22.04 LTS (recommended)
   - t2.small or larger instance type
   - 20 GB+ storage

2. **Software Requirements**
   - Node.js 20.x
   - npm 10.x+
   - PM2 (process manager)
   - Git

3. **Installation Commands**
   ```bash
   # Install Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2
   sudo npm install -g pm2

   # Clone repository
   cd /home/ubuntu
   git clone https://github.com/YOUR_USERNAME/easylegal.git
   cd easylegal
   git config --global --add safe.directory /home/ubuntu/easylegal

   # Install dependencies
   npm install

   # Build all packages
   npm run build:common
   npm run build:backend
   npm run build:frontend

   # Start backend with PM2
   pm2 start packages/backend/dist/index.js --name easylegal-backend
   pm2 save
   pm2 startup  # Follow instructions
   ```

## GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

### Required Secrets

1. **EC2_HOST**
   - Your EC2 instance public IP or domain
   - Example: `ec2-xx-xxx-xxx-xx.compute-1.amazonaws.com` or `1.2.3.4`

2. **EC2_USERNAME**
   - The SSH username for your EC2 instance
   - For Amazon Linux: `ec2-user`
   - For Ubuntu: `ubuntu`

3. **EC2_SSH_KEY**
   - Your private SSH key (the .pem file content)
   - To get the key content:
     ```bash
     cat path/to/your-key.pem
     ```
   - Copy the entire output including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`

### Optional Secrets

4. **EC2_SSH_PORT** (optional, defaults to 22)
   - Only needed if you use a custom SSH port

## Security Best Practices

1. **EC2 Security Group Settings**
   - Allow SSH (port 22) only from GitHub Actions IP ranges or your IP
   - Allow HTTP (port 80) and/or HTTPS (port 443) for your application
   - Allow your application port (default 3000) if not using a reverse proxy

2. **SSH Key Security**
   - Never commit your .pem file to the repository
   - Keep your private key secure and backed up
   - Consider using a dedicated deploy key

3. **Environment Variables**
   - Store sensitive configuration in a `.env` file on EC2
   - Never commit `.env` files to the repository

## EC2 Directory Structure

The deployment assumes this monorepo structure on your EC2 instance:

```
/home/ubuntu/easylegal/                 # Application root
├── packages/
│   ├── backend/
│   │   ├── src/                        # Backend source
│   │   ├── dist/                       # Built backend
│   │   └── package.json
│   ├── frontend/
│   │   ├── src/                        # Frontend source
│   │   ├── dist/                       # Built frontend
│   │   └── package.json
│   └── common/
│       ├── src/                        # Common source
│       ├── dist/                       # Built common
│       ├── scripts/                    # Deployment scripts
│       └── package.json
├── node_modules/                       # Hoisted dependencies
├── package.json                        # Root workspace config
└── .env                                # Environment variables (create manually)
```

## Testing the Deployment

1. Make a small change to your code
2. Commit and push to the `main` branch:
   ```bash
   git add .
   git commit -m "test: trigger deployment"
   git push origin main
   ```
3. Go to GitHub → Actions tab to watch the workflow
4. Check your EC2 instance to verify the deployment:
   ```bash
   ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
   pm2 status
   pm2 logs easylegal-backend
   ```

## Manual Deployment

For quick manual deployments without GitHub Actions:

```bash
# On EC2 instance
cd /home/ubuntu/easylegal
bash packages/common/scripts/deploy.sh
```

## Troubleshooting

### Workflow fails at "Deploy to EC2" step
- Verify GitHub secrets are correctly set (EC2_HOST, EC2_USERNAME, EC2_SSH_KEY)
- Check EC2 security group allows SSH (port 22) from GitHub Actions
- Verify SSH key format includes BEGIN/END lines
- See detailed troubleshooting in [AWS-EC2-SETUP.md](./AWS-EC2-SETUP.md#troubleshooting)

### Application doesn't restart
- SSH into EC2 and check PM2 status: `pm2 status`
- Check PM2 logs: `pm2 logs easylegal-backend`
- Manually restart: `pm2 restart easylegal-backend`
- View detailed logs: `pm2 logs easylegal-backend --lines 100`

### Build fails on EC2
- Ensure all dependencies are installed: `npm install`
- Build packages in order: `npm run build:common`, then backend, then frontend
- Check for build errors in GitHub Actions logs
- Verify Node.js version: `node --version` (should be v20.x.x)

## Advanced Configuration

### Using a Reverse Proxy (Nginx)

For production deployments, use Nginx as a reverse proxy:

```bash
# Install Nginx
sudo apt-get install -y nginx

# Use the provided configuration
sudo cp /home/ubuntu/easylegal/packages/common/scripts/nginx-config.conf /etc/nginx/sites-available/easylegal

# Edit to update your domain
sudo nano /etc/nginx/sites-available/easylegal
# Change "your-domain.com" to your actual domain

# Enable the site
sudo ln -s /etc/nginx/sites-available/easylegal /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

The provided Nginx configuration:
- Serves frontend static files from `packages/frontend/dist/`
- Proxies `/api` requests to backend on port 3000
- Includes security headers
- Enables gzip compression
- Caches static assets

See [AWS-EC2-SETUP.md](./AWS-EC2-SETUP.md#part-5-domain-and-ssl-configuration) for complete Nginx and SSL setup.

### Environment Variables on EC2

Create a `.env` file in `/home/ubuntu/easylegal/.env`:

```env
PORT=3000
NODE_ENV=production
# Add other environment variables as needed
```

## Monitoring

Check application status:
```bash
pm2 status
pm2 logs easylegal
pm2 monit
```

View recent deployments:
- Go to GitHub → Actions tab
- Click on any workflow run to see detailed logs
