import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { DateTime } from 'luxon';
import { scheduleRepository, jobRepository } from '../../../shared/src/db';
import { ensureJobsForDate } from '../../../shared/src/schedulerLogic';

export const schedulesRouter = Router();

const createScheduleSchema = z.object({
  groupId: z.string().min(1, 'Group is required'),
  groupName: z.string().min(1, 'Group Name is required'),
  message1: z.string().min(1, 'Message is required'),
  message2: z.string().optional().default(''),
  firstSendTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Send time must be in HH:mm format'),
  gapMinutes: z.number().optional().default(0),
  timezone: z.string().default('Asia/Kolkata'),
  targetDate: z.string().optional().default(''),
  enabled: z.boolean().default(true)
});


// GET /api/schedules
schedulesRouter.get('/', (req: Request, res: Response) => {
  const schedules = scheduleRepository.getAll();
  res.json(schedules);
});

// POST /api/schedules
schedulesRouter.post('/', (req: Request, res: Response) => {
  try {
    const data = createScheduleSchema.parse(req.body);

    const scheduleId = uuidv4();
    const newSchedule = scheduleRepository.create({
      id: scheduleId,
      group_id: data.groupId,
      group_name: data.groupName,
      message_1: data.message1,
      message_2: data.message2,
      first_send_time: data.firstSendTime,
      gap_minutes: data.gapMinutes,
      timezone: data.timezone,
      target_date: data.targetDate || undefined,
      enabled: data.enabled
    });

    // Create jobs for target date if enabled
    if (newSchedule.enabled) {
      const now = DateTime.now().setZone(newSchedule.timezone);
      const todayStr = now.toFormat('yyyy-MM-dd');
      const runDate = newSchedule.target_date || todayStr;

      ensureJobsForDate(newSchedule, runDate);
      if (!newSchedule.target_date) {
        ensureJobsForDate(newSchedule, now.plus({ days: 1 }).toFormat('yyyy-MM-dd'));
      }
    }

    res.status(201).json(newSchedule);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    res.status(500).json({ error: err.message || String(err) });
  }
});

// GET /api/schedules/:id
schedulesRouter.get('/:id', (req: Request, res: Response) => {
  const schedule = scheduleRepository.getById(req.params.id);
  if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
  res.json(schedule);
});

// PATCH /api/schedules/:id
schedulesRouter.patch('/:id', (req: Request, res: Response) => {
  try {
    const existing = scheduleRepository.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Schedule not found' });

    const updated = scheduleRepository.update(req.params.id, {
      group_id: req.body.groupId,
      group_name: req.body.groupName,
      message_1: req.body.message1,
      message_2: req.body.message2,
      first_send_time: req.body.firstSendTime,
      gap_minutes: req.body.gapMinutes,
      timezone: req.body.timezone,
      target_date: req.body.targetDate,
      enabled: req.body.enabled
    });

    if (updated) {
      const now = DateTime.now().setZone(updated.timezone);
      const todayStr = now.toFormat('yyyy-MM-dd');
      const runDate = updated.target_date || todayStr;

      // Clear pending jobs for this schedule so updated time/date takes effect
      const db = require('../../../shared/src/db').getDb();
      db.prepare("DELETE FROM scheduled_jobs WHERE schedule_id = ? AND status = 'PENDING'").run(updated.id);

      if (updated.enabled) {
        ensureJobsForDate(updated, runDate);
        if (!updated.target_date) {
          ensureJobsForDate(updated, now.plus({ days: 1 }).toFormat('yyyy-MM-dd'));
        }
      }
    }



    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// DELETE /api/schedules/:id
schedulesRouter.delete('/:id', (req: Request, res: Response) => {
  const deleted = scheduleRepository.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Schedule not found' });
  res.json({ message: 'Schedule deleted successfully' });
});

// POST /api/schedules/:id/enable
schedulesRouter.post('/:id/enable', (req: Request, res: Response) => {
  const updated = scheduleRepository.update(req.params.id, { enabled: true });
  if (!updated) return res.status(404).json({ error: 'Schedule not found' });

  const now = DateTime.now().setZone(updated.timezone);
  ensureJobsForDate(updated, now.toFormat('yyyy-MM-dd'));
  ensureJobsForDate(updated, now.plus({ days: 1 }).toFormat('yyyy-MM-dd'));

  res.json(updated);
});

// POST /api/schedules/:id/disable
schedulesRouter.post('/:id/disable', (req: Request, res: Response) => {
  const updated = scheduleRepository.update(req.params.id, { enabled: false });
  if (!updated) return res.status(404).json({ error: 'Schedule not found' });

  jobRepository.cancelPendingForSchedule(updated.id);
  res.json(updated);
});
