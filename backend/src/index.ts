import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { whatsappRouter } from './routes/whatsapp';
import { schedulesRouter } from './routes/schedules';
import { jobsRouter } from './routes/jobs';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/jobs', jobsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[Backend API] Server running at http://localhost:${PORT}`);
});
