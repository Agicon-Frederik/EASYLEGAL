const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Set NODE_ENV to 'test' for all Jest tests
process.env.NODE_ENV = 'test';

// Set test database URL if not already set
// Use a dedicated test database file
if (!process.env.DATABASE_URL) {
  const testDbPath = path.join(__dirname, 'prisma', 'test.db');
  process.env.DATABASE_URL = `file:${testDbPath}`;

  // Remove existing test database if it exists
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
    } catch (error) {
      // Ignore if file is locked
    }
  }

  // Remove journal file if it exists
  const journalPath = testDbPath + '-journal';
  if (fs.existsSync(journalPath)) {
    try {
      fs.unlinkSync(journalPath);
    } catch (error) {
      // Ignore if file is locked
    }
  }

  // Push schema to create the test database
  console.log('Setting up test database...');
  try {
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      env: { ...process.env },
      stdio: 'pipe', // Use pipe instead of inherit to avoid output noise
      cwd: __dirname,
    });
    console.log('Test database setup complete');
  } catch (error) {
    console.error('Failed to setup test database:', error.message);
    // Don't throw - might be race condition, let tests handle it
  }
}
