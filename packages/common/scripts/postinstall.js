#!/usr/bin/env node
/**
 * Post-install script that runs after npm install
 * Fixes permissions for node_modules/.bin/ executables on Linux/Mac
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Only run on Linux/Mac (not Windows)
if (process.platform === 'win32') {
  console.log('✓ Windows detected - skipping permission fixes');
  process.exit(0);
}

const rootDir = path.resolve(__dirname, '../../..');
const binDir = path.join(rootDir, 'node_modules', '.bin');

if (!fs.existsSync(binDir)) {
  console.log('⚠ node_modules/.bin not found - skipping permission fixes');
  process.exit(0);
}

try {
  console.log('Fixing permissions for node_modules/.bin/ executables...');
  execSync(`chmod +x "${binDir}"/*`, { stdio: 'inherit' });
  console.log('✓ Permissions fixed successfully');
} catch (error) {
  console.error('⚠ Warning: Could not fix permissions:', error.message);
  console.error('You may need to run: npm run fix-permissions');
}
