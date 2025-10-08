// Initialize cron jobs for the application
// This should be called from a server-side context

import { setupCronJobs } from './cronJobs';

let cronInitialized = false;

export function initCronJobs() {
  if (cronInitialized) {
    console.log('Cron jobs already initialized');
    return;
  }

  try {
    // Only run cron jobs in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
      setupCronJobs();
      cronInitialized = true;
      console.log('Cron jobs initialized successfully');
    } else {
      console.log('Cron jobs not initialized (not in production mode)');
    }
  } catch (error) {
    console.error('Failed to initialize cron jobs:', error);
  }
}