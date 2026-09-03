import { ScheduledJob } from '../../shared/src/types';
import { jobRepository, scheduleRepository, connectionRepository } from '../../shared/src/db';
import { WhatsAppSession } from './whatsapp/session';
import { MessageSender } from './whatsapp/messageSender';

export async function executeSendMessageJob(job: ScheduledJob): Promise<void> {
  console.log(`[sendMessageJob] Executing Job ID=${job.id} (Schedule=${job.schedule_id}, Msg #${job.message_number}, Key=${job.idempotency_key})`);

  // 1. Idempotency & status check
  const currentJob = jobRepository.getById(job.id);
  if (!currentJob) {
    console.error(`[sendMessageJob] Job ID=${job.id} not found in database.`);
    return;
  }

  if (currentJob.status === 'SENT') {
    console.log(`[sendMessageJob] Job ID=${job.id} already SENT. Skipping duplicate execution.`);
    return;
  }

  if (currentJob.status === 'CANCELLED') {
    console.log(`[sendMessageJob] Job ID=${job.id} is CANCELLED. Skipping.`);
    return;
  }

  // Check max attempts
  if (currentJob.attempts >= 3) {
    console.warn(`[sendMessageJob] Job ID=${job.id} exceeded maximum retry attempts (${currentJob.attempts}). Marking FAILED.`);
    jobRepository.updateStatus(job.id, 'FAILED', 'Exceeded maximum retry attempts (3)');
    return;
  }

  // 2. Lock job to PROCESSING
  jobRepository.updateStatus(job.id, 'PROCESSING', null, true);

  // 3. Verify WhatsApp Connection State
  const session = WhatsAppSession.getInstance();
  let authStatus = await session.checkAuthStatus();

  if (authStatus !== 'CONNECTED') {
    console.log(`[sendMessageJob] WhatsApp Web status is ${authStatus}. Attempting session initialization...`);
    authStatus = await session.init();
  }

  if (authStatus !== 'CONNECTED') {
    const errorMsg = `WhatsApp Web is not connected (Status: ${authStatus}). Job postponed/failed.`;
    console.error(`[sendMessageJob] ${errorMsg}`);
    jobRepository.updateStatus(job.id, 'FAILED', errorMsg);
    return;
  }


  const page = session.getPage();
  if (!page) {
    const errorMsg = 'Playwright page object is unavailable.';
    console.error(`[sendMessageJob] ${errorMsg}`);
    jobRepository.updateStatus(job.id, 'FAILED', errorMsg);
    return;
  }

  // 4. Retrieve schedule details
  const schedule = scheduleRepository.getById(job.schedule_id);
  if (!schedule) {
    const errorMsg = `Parent Schedule ID=${job.schedule_id} no longer exists.`;
    console.error(`[sendMessageJob] ${errorMsg}`);
    jobRepository.updateStatus(job.id, 'FAILED', errorMsg);
    return;
  }

  if (!schedule.enabled) {
    console.log(`[sendMessageJob] Schedule ID=${schedule.id} is disabled. Cancelling job.`);
    jobRepository.updateStatus(job.id, 'CANCELLED', 'Schedule was disabled by user');
    return;
  }

  const messageText = job.message_number === 1 ? schedule.message_1 : schedule.message_2;

  // 5. Send Message
  const sendResult = await MessageSender.sendMessage(page, schedule.group_name, messageText);

  // 6. Update Database based on result
  if (sendResult.success) {
    jobRepository.updateStatus(job.id, 'SENT', null);
    console.log(`[sendMessageJob] SUCCESS: Job ID=${job.id} marked SENT.`);
  } else {
    // Check if error was due to group mismatch vs send uncertainty
    if (sendResult.errorCode === 'CHAT_TITLE_MISMATCH' || sendResult.errorCode === 'GROUP_NOT_FOUND') {
      // Do not retry safety mismatches or missing groups
      jobRepository.updateStatus(job.id, 'FAILED', sendResult.error || 'Group safety verification failed');
    } else {
      jobRepository.updateStatus(job.id, 'FAILED', sendResult.error || 'Message send failed');
    }
  }

  // 7. Auto-close browser window post-dispatch
  console.log('[sendMessageJob] Closing Chromium browser window post-dispatch...');
  await session.closeBrowser();
}

