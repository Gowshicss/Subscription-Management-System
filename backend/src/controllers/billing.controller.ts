import { Request, Response, NextFunction } from 'express';
import { billingService } from '../services/billing.service';

export class BillingController {
  static async triggerManualCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await billingService.runBillingCycle('ADMIN_MANUAL');
      res.json({
        success: true,
        data: result,
        message: `Billing cycle executed. Generated: ${result.invoicesGenerated}, Skipped: ${result.invoicesSkipped}, Total: $${result.totalBilledAmount.toFixed(2)}.`,
      });
    } catch (err) {
      next(err);
    }
  }
}
