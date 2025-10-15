#!/bin/bash
# Fix permissions for node_modules/.bin/ executables on Linux/EC2
# This script ensures all executable files in node_modules/.bin have proper permissions

echo "Fixing permissions for node_modules/.bin/ executables..."

# Find the root node_modules directory (go up from scripts location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

if [ -d "$ROOT_DIR/node_modules/.bin" ]; then
    echo "Setting execute permissions on $ROOT_DIR/node_modules/.bin/*"
    chmod +x "$ROOT_DIR/node_modules/.bin/"*
    echo "✓ Permissions fixed"
else
    echo "⚠ Warning: $ROOT_DIR/node_modules/.bin not found"
    echo "Run 'npm install' first"
    exit 1
fi
