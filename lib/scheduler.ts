import cron from 'node-cron';
import { runBackup } from './backup';

let isSchedulerInitialized = false;

export function initializeScheduler() {
  if (isSchedulerInitialized) {
    console.log('Scheduler already initialized.');
    return;
  }

  console.log('Initializing scheduler...');

  // Schedule backup to run daily at 2:00 AM server time
  // Format: second minute hour day-of-month month day-of-week
  // '0 2 * * *' means at minute 0 of hour 2 (2:00 AM) every day
  const backupJob = cron.schedule('0 2 * * *', async () => {
    console.log(`[${new Date().toISOString()}] Running scheduled daily backup task...`);
    try {
      await runBackup();
      console.log(`[${new Date().toISOString()}] Scheduled backup task completed successfully.`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Scheduled backup task failed:`, err);
    }
  }, {
    scheduled: true,
    // Consider adding timezone support later if needed, based on user settings
    // timezone: "Your/Timezone"
  });

  console.log('Scheduler initialized. Daily backup scheduled for 2:00 AM server time.');
  isSchedulerInitialized = true;

  // Graceful shutdown handling (optional but recommended)
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Stopping scheduler...');
    backupJob.stop();
    // Add cleanup for other jobs if needed
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received. Stopping scheduler...');
    backupJob.stop();
    // Add cleanup for other jobs if needed
    process.exit(0);
  });

  // --- Add other scheduled tasks here in the future ---
  // Example:
  // cron.schedule('* * * * *', () => {
  //   console.log('Running every minute');
  // });
}
