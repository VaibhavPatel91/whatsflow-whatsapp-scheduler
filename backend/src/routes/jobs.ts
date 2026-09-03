import { Router, Request, Response } from 'express';
import { jobRepository } from '../../../shared/src/db';

export const jobsRouter = Router();

// GET /api/jobs
jobsRouter.get('/', (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const jobs = jobRepository.getAll(limit);
  res.json(jobs);
});

// GET /api/jobs/:id
jobsRouter.get('/:id', (req: Request, res: Response) => {
  const job = jobRepository.getById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});
