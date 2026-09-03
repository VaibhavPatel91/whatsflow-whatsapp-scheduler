import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { WhatsAppSession } from './whatsapp/session';
import { startScheduler } from './scheduler';

async function main() {
  console.log('====================================================');
  console.log(' Starting WhatsApp Personal Group Scheduler Worker');
  console.log('====================================================');

  // Initialize Playwright WhatsApp Session
  const session = WhatsAppSession.getInstance();
  const initialStatus = await session.init();

  console.log(`[Worker Main] Initial WhatsApp Connection Status: ${initialStatus}`);

  // Start background scheduler poll engine
  startScheduler(15000);

  // Graceful shutdown handling
  const shutdown = async () => {
    console.log('\n[Worker Main] Shutting down worker process...');
    await session.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Trigger reload with empirical DOM auth status detection
main().catch((err) => {
  console.error('[Worker Main] Fatal error launching worker:', err);
  process.exit(1);
});





















