import { DateTime } from 'luxon';
import { v4 as uuidv4 } from 'uuid';
import { Schedule, ScheduledJob } from './types';
import { jobRepository } from './db';

/**
 * Calculates the ISO timestamp for message 1 and message 2 on a given date (YYYY-MM-DD)
 * in the schedule's specified timezone.
 */
export function calculateJobTimes(
  firstSendTimeStr: string, // format "HH:mm" e.g. "10:00" or "23:30"
  gapMinutes: number,
  targetDateStr: string, // format "YYYY-MM-DD"
  timezone: string = 'Asia/Kolkata'
): { message1Time: DateTime; message2Time: DateTime } {
  const [hours, minutes] = firstSendTimeStr.split(':').map(Number);
  
  // Construct DateTime for Message 1 on targetDateStr
  const message1Time = DateTime.fromISO(`${targetDateStr}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`, { zone: timezone });
  
  // Message 2 time is Message 1 + gapMinutes (automatically rolls over midnight if applicable)
  const message2Time = message1Time.plus({ minutes: gapMinutes });

  return { message1Time, message2Time };
}

/**
 * Generates structured idempotency key for a job.
 * Format: {scheduleId}_{YYYY-MM-DD}_{messageNumber}
 */
export function generateIdempotencyKey(scheduleId: string, runDateStr: string, messageNumber: number): string {
  return `${scheduleId}_${runDateStr}_${messageNumber}`;
}

/**
 * Synchronizes/creates jobs for a given schedule for a specified target date (YYYY-MM-DD).
 * Ensures no duplicate jobs are created if an idempotency key already exists.
 */
export function ensureJobsForDate(schedule: Schedule, targetDateStr: string): ScheduledJob[] {
  if (!schedule.enabled) return [];

  const [hours, minutes] = schedule.first_send_time.split(':').map(Number);
  const message1Time = DateTime.fromISO(`${targetDateStr}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`, { zone: schedule.timezone });
  const nowInZone = DateTime.now().setZone(schedule.timezone);

  // If the target date & time has already passed (over 1 min ago), do NOT create a pending job for it
  if (message1Time < nowInZone.minus({ minutes: 1 })) {
    return [];
  }

  const createdJobs: ScheduledJob[] = [];


  // Single Job per day (Message 1)
  const key1 = generateIdempotencyKey(schedule.id, targetDateStr, 1);
  let existing1 = jobRepository.getByIdempotencyKey(key1);

  if (existing1 && (existing1.status === 'CANCELLED' || existing1.status === 'FAILED')) {
    jobRepository.delete(existing1.id);
    existing1 = null;
  }

  if (!existing1) {
    const job1: ScheduledJob = {
      id: uuidv4(),
      schedule_id: schedule.id,
      run_date: targetDateStr,
      message_number: 1,
      scheduled_at: message1Time.toUTC().toISO() || new Date().toISOString(),
      status: 'PENDING',
      idempotency_key: key1,
      attempts: 0,
      sent_at: null,
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    createdJobs.push(jobRepository.create(job1));
  } else {
    const targetIso1 = message1Time.toUTC().toISO();
    if (existing1.status === 'PENDING' && targetIso1 && existing1.scheduled_at !== targetIso1) {
      const db = require('./db').getDb();
      db.prepare("UPDATE scheduled_jobs SET scheduled_at = ?, updated_at = datetime('now') WHERE id = ?").run(targetIso1, existing1.id);
      existing1 = jobRepository.getById(existing1.id)!;
    }
    createdJobs.push(existing1);
  }

  return createdJobs;
}


