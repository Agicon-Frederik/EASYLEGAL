#!/bin/bash
# EC2 Deployment Script for EASYLEGAL
# This script handles the complete deployment process on EC2 Ubuntu

set -e  # Exit on any error

echo "=========================================="
echo "EASYLEGAL EC2 Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

# Get to the root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$ROOT_DIR"

print_info "Working directory: $ROOT_DIR"
echo ""

# Step 1: Pull latest code
print_info "Step 1: Pulling latest code from git..."
if git pull; then
    print_success "Code updated successfully"
else
    print_error "Failed to pull code"
    exit 1
fi
echo ""

# Step 2: Install dependencies
print_info "Step 2: Installing dependencies..."
if npm install; then
    print_success "Dependencies installed"
    print_info "Note: postinstall script should have fixed permissions automatically"
else
    print_error "Failed to install dependencies"
    exit 1
fi
echo ""

# Step 3: Verify permissions (just in case)
print_info "Step 3: Verifying node_modules/.bin permissions..."
if [ -d "$ROOT_DIR/node_modules/.bin" ]; then
    chmod +x "$ROOT_DIR/node_modules/.bin/"* 2>/dev/null || true
    print_success "Permissions verified"
else
    print_error "node_modules/.bin not found!"
    exit 1
fi
echo ""

# Step 4: Build all packages
print_info "Step 4: Building all packages..."
if npm run build; then
    print_success "All packages built successfully"
else
    print_error "Build failed"
    exit 1
fi
echo ""

# Step 5: Check if Prisma Client was generated
print_info "Step 5: Verifying Prisma Client generation..."
if [ -d "$ROOT_DIR/node_modules/@prisma/client" ]; then
    print_success "Prisma Client found"
else
    print_error "Prisma Client not generated!"
    exit 1
fi
echo ""

# Step 6: Check environment variables
print_info "Step 6: Checking environment configuration..."
ENV_FILE="$ROOT_DIR/packages/backend/.env"
if [ -f "$ENV_FILE" ]; then
    print_success "Environment file found"

    # Check critical variables
    if grep -q "JWT_SECRET=" "$ENV_FILE" && \
       grep -q "DATABASE_URL=" "$ENV_FILE" && \
       grep -q "FRONTEND_URL=" "$ENV_FILE"; then
        print_success "Critical environment variables present"
    else
        print_error "Missing critical environment variables!"
        echo "Please ensure JWT_SECRET, DATABASE_URL, and FRONTEND_URL are set"
        exit 1
    fi
else
    print_error "Environment file not found at $ENV_FILE"
    exit 1
fi
echo ""

# Step 7: Remind about service restart
echo "=========================================="
print_success "Deployment completed successfully!"
echo "=========================================="
echo ""
print_info "Next steps:"
echo "  1. Restart your backend service:"
echo "     sudo systemctl restart easylegal-backend"
echo "  2. Check service status:"
echo "     sudo systemctl status easylegal-backend"
echo "  3. Check logs if needed:"
echo "     sudo journalctl -u easylegal-backend -f"
echo ""
