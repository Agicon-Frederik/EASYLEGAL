# Deployment Setup Guide

This guide explains how to set up automated deployment to AWS EC2 using GitHub Actions.

## Overview

The deployment workflow automatically:
1. Runs tests on every push to the `main` branch
2. Only deploys if all tests pass
3. Deploys to your EC2 instance via SSH
4. Restarts the application using PM2

## Prerequisites

### On Your EC2 Instance

1. **Install Node.js and npm**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install PM2 (Process Manager)**
   ```bash
   sudo npm install -g pm2
   ```

3. **Clone your repository**
   ```bash
   cd /home/ubuntu  # or your user directory
   git clone https://github.com/YOUR_USERNAME/easylegal.git
   cd easylegal
   npm ci
   npm run build
   ```

4. **Configure Git to allow the directory**
   ```bash
   cd /home/ubuntu/easylegal
   git config --global --add safe.directory /home/ubuntu/easylegal
   ```

5. **Start the application with PM2**
   ```bash
   pm2 start npm --name easylegal -- start
   pm2 save
   pm2 startup  # Follow the instructions to enable PM2 on system boot
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

The deployment assumes this structure on your EC2 instance:

```
/home/ubuntu/easylegal/     # Application root
├── src/                    # Source files
├── dist/                   # Built files
├── node_modules/           # Dependencies
├── package.json
└── .env                    # Environment variables (create manually)
```

## Testing the Deployment

1. Make a small change to your code
2. Commit and push to the `main` branch:
   ```bash
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```
3. Go to GitHub → Actions tab to watch the workflow
4. Check your EC2 instance to verify the deployment

## Troubleshooting

### Workflow fails at "Deploy to EC2" step
- Verify GitHub secrets are correctly set
- Check EC2 security group allows SSH from GitHub Actions
- Verify SSH key is correct and has proper permissions

### Application doesn't restart
- SSH into EC2 and check PM2 status: `pm2 status`
- Check PM2 logs: `pm2 logs easylegal`
- Manually restart: `pm2 restart easylegal`

### Tests fail on EC2
- Ensure all dependencies are installed: `npm ci`
- Check for environment-specific issues
- Review test logs in GitHub Actions

## Advanced Configuration

### Using a Reverse Proxy (Nginx)

Install and configure Nginx to proxy requests to your Node.js app:

```bash
sudo apt install nginx
```

Create Nginx configuration at `/etc/nginx/sites-available/easylegal`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/easylegal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

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
