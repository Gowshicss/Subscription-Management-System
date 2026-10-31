import { billingService } from '../services/billing.service';

/**
 * Format errors safely for production logs without exposing database connection strings,
 * credentials, or breaking log lines with raw newlines.
 */
function formatSafeBillingError(err: any): string {
  if (!err) return 'Unknown error occurred';
  const prismaCode = err.code ? `[Prisma ${err.code}] ` : '';
  const rawMsg = err.message || (typeof err === 'string' ? err : JSON.stringify(err));
  const sanitized = rawMsg
    .replace(/(postgres|postgresql):\/\/[^\s]+/gi, '[DATABASE_URL_REDACTED]')
    .replace(/\r?\n+/g, ' ')
    .trim();
  return `${prismaCode}${sanitized}`;
}

export function startBillingCron(intervalMs: number = 60000) {
  console.log(`[BillingWorker] Starting automated recurring billing background worker (interval: ${intervalMs / 1000}s)...`);

  // Initial check on startup after short delay
  setTimeout(() => {
    billingService.runBillingCycle('CRON_SCHEDULER').catch((err) => {
      console.error(`[BillingWorker] Initial cycle execution error: ${formatSafeBillingError(err)}`);
    });
  }, 5000);

  const timer = setInterval(() => {
    billingService.runBillingCycle('CRON_SCHEDULER').catch((err) => {
      console.error(`[BillingWorker] Periodic cycle execution error: ${formatSafeBillingError(err)}`);
    });
  }, intervalMs);

  return () => clearInterval(timer);
}

