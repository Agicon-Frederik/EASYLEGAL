// IMPORTANT: Load environment variables BEFORE any other imports
// This ensures all modules can access env vars when they're initialized
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the backend package root
// In development: packages/backend/.env
// In production: /path/to/backend/.env (relative to dist/index.js)
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Log environment loading status (helps debug on EC2)
console.log(`Loading environment from: ${envPath}`);
console.log(`Environment variables loaded:`, {
  PORT: process.env.PORT ? 'SET' : 'NOT SET',
  FRONTEND_URL: process.env.FRONTEND_URL ? 'SET' : 'NOT SET',
  JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
  EMAIL_HOST: process.env.EMAIL_HOST ? 'SET' : 'NOT SET',
  EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
  EMAIL_PASS: process.env.EMAIL_PASS ? 'SET (hidden)' : 'NOT SET',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
});

import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
