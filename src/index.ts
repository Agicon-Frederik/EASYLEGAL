import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).send('We are alive');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
