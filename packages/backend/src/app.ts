import express, { Request, Response } from 'express';
import cors from 'cors';
import i18next, { i18nextMiddleware } from './i18n';
import { database } from './database/db';
import { emailService } from '@easylegal/common';
import authRoutes from './routes/auth';

const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// Add i18n middleware
app.use(i18nextMiddleware);

// Initialize services
async function initializeServices() {
  try {
    // Initialize database
    await database.initialize();
    console.log('✓ Database initialized');

    // Initialize email service
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
    };

    if (emailConfig.auth.user && emailConfig.auth.pass) {
      emailService.initialize(emailConfig);
      console.log('✓ Email service initialized');
    } else {
      console.warn('⚠ Email service not configured. Set EMAIL_USER and EMAIL_PASS environment variables.');
    }
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }
}

initializeServices();

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).send('We are alive');
});

// Example i18n endpoint
app.get('/api/welcome', (req: Request, res: Response) => {
  const message = req.t('messages.welcome', { appName: req.t('app.name') });
  res.json({ message });
});

// Auth routes
app.use('/api/auth', authRoutes);

export default app;
