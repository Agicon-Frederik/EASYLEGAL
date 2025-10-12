import express, { Request, Response } from 'express';
import i18next, { i18nextMiddleware } from './i18n';

const app = express();

app.use(express.json());

// Add i18n middleware
app.use(i18nextMiddleware);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).send('We are alive');
});

// Example i18n endpoint
app.get('/api/welcome', (req: Request, res: Response) => {
  const message = req.t('messages.welcome', { appName: req.t('app.name') });
  res.json({ message });
});

export default app;
