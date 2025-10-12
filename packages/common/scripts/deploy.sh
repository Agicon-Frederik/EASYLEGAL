#!/bin/bash

# EASYLEGAL Manual Deployment Script
# Use this script to manually deploy updates to your EC2 instance

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

APP_DIR="/home/$(whoami)/easylegal"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}EASYLEGAL Deployment Script${NC}"
echo -e "${BLUE}=========================================${NC}"

# Check if we're in the right directory
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Error: Application directory not found at $APP_DIR${NC}"
    echo "Please run setup-ec2.sh first or specify the correct path."
    exit 1
fi

cd $APP_DIR

echo -e "${BLUE}Step 1: Pulling latest code...${NC}"
git pull origin main
echo -e "${GREEN}Code updated!${NC}"

echo -e "${BLUE}Step 2: Installing dependencies...${NC}"
npm install
echo -e "${GREEN}Dependencies installed!${NC}"

echo -e "${BLUE}Step 3: Building common package...${NC}"
npm run build:common
echo -e "${GREEN}Common package built!${NC}"

echo -e "${BLUE}Step 4: Building backend...${NC}"
npm run build:backend
echo -e "${GREEN}Backend built!${NC}"

echo -e "${BLUE}Step 5: Building frontend...${NC}"
npm run build:frontend
echo -e "${GREEN}Frontend built!${NC}"

echo -e "${BLUE}Step 6: Running tests...${NC}"
npm run test:backend
echo -e "${GREEN}Tests passed!${NC}"

echo -e "${BLUE}Step 7: Restarting application...${NC}"
pm2 restart easylegal-backend || pm2 start packages/backend/dist/index.js --name easylegal-backend
pm2 save
echo -e "${GREEN}Application restarted!${NC}"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Application Status:"
pm2 status
echo ""
echo "View logs with: pm2 logs easylegal-backend"
echo "Monitor with: pm2 monit"
echo ""
