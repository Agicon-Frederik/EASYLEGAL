import express, { Request, Response } from 'express';

const app = express();

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).send('We are alive');
});

export default app;
