# EC2 Setup Script for EASYLEGAL
# This script sets up your EC2 instance for the first time

set -e  # Exit on any error

echo "================================================"
echo "EASYLEGAL EC2 Setup Script"
echo "================================================"
echo ""

# Check if running on Ubuntu/Debian or Amazon Linux
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "Cannot detect OS. This script supports Ubuntu/Debian and Amazon Linux."
    exit 1
fi

# Update system packages
echo "Step 1: Updating system packages..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sudo apt-get update
    sudo apt-get upgrade -y
elif [ "$OS" = "amzn" ]; then
    sudo yum update -y
fi

# Install Node.js 20.x
echo "Step 2: Installing Node.js 20.x..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
elif [ "$OS" = "amzn" ]; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo yum install -y nodejs
fi

# Verify Node.js installation
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Install Git if not already installed
echo "Step 3: Installing Git..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sudo apt-get install -y git
elif [ "$OS" = "amzn" ]; then
    sudo yum install -y git
fi

# Install PM2 globally
echo "Step 4: Installing PM2 process manager..."
sudo npm install -g pm2

# Set up application directory
echo "Step 5: Setting up application directory..."
APP_DIR="/home/$USER/easylegal"

if [ -d "$APP_DIR" ]; then
    echo "Application directory already exists at $APP_DIR"
    read -p "Do you want to remove it and start fresh? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$APP_DIR"
    else
        echo "Keeping existing directory. Skipping git clone."
        cd "$APP_DIR"
    fi
fi

# Clone repository (if directory doesn't exist)
if [ ! -d "$APP_DIR" ]; then
    echo "Enter your GitHub repository URL (e.g., https://github.com/Agicon-Frederik/easylegal.git):"
    read REPO_URL

    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# Configure git safe directory
echo "Step 6: Configuring Git..."
git config --global --add safe.directory "$APP_DIR"

# Install dependencies
echo "Step 7: Installing application dependencies..."
npm ci

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Step 8: Creating .env file..."
    cat > .env << EOF
PORT=3000
NODE_ENV=production
# Add your environment variables here
EOF
    echo "Created .env file. Please edit it to add your configuration."
else
    echo "Step 8: .env file already exists, skipping..."
fi

# Build application
echo "Step 9: Building application..."
npm run build

# Set up PM2
echo "Step 10: Setting up PM2..."
pm2 delete easylegal 2>/dev/null || true  # Delete if exists, ignore error if not
pm2 start npm --name easylegal -- start
pm2 save

# Set up PM2 to start on system boot
echo "Step 11: Configuring PM2 to start on boot..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

echo ""
echo "================================================"
echo "Setup Complete!"
echo "================================================"
echo ""
echo "Application is running on port 3000"
echo ""
echo "Useful commands:"
echo "  pm2 status           - Check application status"
echo "  pm2 logs easylegal   - View application logs"
echo "  pm2 restart easylegal - Restart application"
echo "  pm2 stop easylegal   - Stop application"
echo "  pm2 monit            - Monitor application"
echo ""
echo "Next steps:"
echo "1. Edit the .env file with your configuration: nano $APP_DIR/.env"
echo "2. Configure your GitHub repository secrets (see DEPLOYMENT.md)"
echo "3. Set up your EC2 security group to allow traffic"
echo "4. (Optional) Set up Nginx as a reverse proxy"
echo ""
