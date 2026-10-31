import { billingService } from '../services/billing.service';

export function startBillingCron(intervalMs: number = 60000) {
  console.log(`[BillingWorker] Starting automated recurring billing background worker (interval: ${intervalMs / 1000}s)...`);

  // Initial check on startup after short delay
  setTimeout(() => {
    billingService.runBillingCycle('CRON_SCHEDULER').catch((err) => {
      console.error('[BillingWorker] Initial cycle execution error:', err.message);
    });
  }, 5000);

  const timer = setInterval(() => {
    billingService.runBillingCycle('CRON_SCHEDULER').catch((err) => {
      console.error('[BillingWorker] Periodic cycle execution error:', err.message);
    });
  }, intervalMs);

  return () => clearInterval(timer);
}
