import express from 'express';
import cors from 'cors';
import messagesRouter from './routes/messages.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/messages', messagesRouter);

export default app;

