import { DateTime } from 'luxon';
import { scheduleRepository, jobRepository, connectionRepository } from '../../shared/src/db';
import { ensureJobsForDate } from '../../shared/src/schedulerLogic';
import { executeSendMessageJob } from './sendMessageJob';
import { WhatsAppSession } from './whatsapp/session';


let isRunning = false;
let intervalTimer: NodeJS.Timeout | null = null;
let isProcessingQueue = false;

/**
 * Ensures that all active enabled schedules have pending jobs generated for today and tomorrow.
 */
export function syncPendingJobsForActiveSchedules(): void {
  try {
    const schedules = scheduleRepository.getAll().filter((s) => s.enabled);
    const appTimezone = process.env.APP_TIMEZONE || 'Asia/Kolkata';

    const now = DateTime.now().setZone(appTimezone);
    const todayStr = now.toFormat('yyyy-MM-dd');
    const tomorrowStr = now.plus({ days: 1 }).toFormat('yyyy-MM-dd');

    for (const schedule of schedules) {
      ensureJobsForDate(schedule, todayStr);
      ensureJobsForDate(schedule, tomorrowStr);
    }
  } catch (err) {
    console.error('[Scheduler] Error syncing pending jobs:', err);
  }
}

/**
 * Polls database for pending jobs due now and executes them sequentially.
 */
export async function pollAndExecutePendingJobs(): Promise<void> {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  try {
    // 0. Verify live WhatsApp auth status if session is active
    const session = WhatsAppSession.getInstance();
    if (session.getPage() && !session.getPage()?.isClosed()) {
      await session.checkAuthStatus().catch(() => {});
    }

    // 1. Sync upcoming jobs for enabled schedules
    syncPendingJobsForActiveSchedules();

    // 2. Query pending jobs due at or before current time
    const nowIso = new Date().toISOString();
    const dueJobs = jobRepository.getPendingJobsDue(nowIso);

    if (dueJobs.length > 0) {
      // Auto-recover session ONLY when there are actual jobs due now
      const session = WhatsAppSession.getInstance();
      if (!session.getPage() || session.getPage()?.isClosed()) {
        console.log('[Scheduler] Pending job due and session page inactive. Initializing session...');
        await session.init().catch(() => {});
      }

      console.log(`[Scheduler] Found ${dueJobs.length} pending job(s) due for execution.`);

      for (const job of dueJobs) {
        // Enforce 1 send operation at a time
        await executeSendMessageJob(job);
        // Small delay between sequential sends to prevent UI thrashing
        await new Promise((res) => setTimeout(res, 2000));
      }
    }
  } catch (err) {

    console.error('[Scheduler] Error during job poll cycle:', err);
  } finally {
    isProcessingQueue = false;
  }

}

export function startScheduler(pollIntervalMs = 15000): void {
  if (isRunning) return;
  isRunning = true;

  console.log(`[Scheduler] Starting scheduler engine (Poll interval: ${pollIntervalMs / 1000}s)...`);

  // Run immediate first check
  pollAndExecutePendingJobs();

  // Set recurring interval
  intervalTimer = setInterval(() => {
    pollAndExecutePendingJobs();
  }, pollIntervalMs);
}

export function stopScheduler(): void {
  if (!isRunning) return;
  isRunning = false;
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
  console.log('[Scheduler] Stopped scheduler engine.');
}
