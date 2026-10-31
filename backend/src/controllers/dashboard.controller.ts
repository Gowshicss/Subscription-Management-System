import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { Role } from '@prisma/client';

export class DashboardController {
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user!.role === Role.CUSTOMER) {
        if (!req.user!.customerId) {
          res.json({ success: true, data: { metrics: {}, activeSubscriptions: [] } });
          return;
        }
        const data = await dashboardService.getCustomerPortalSummary(req.user!.customerId);
        res.json({ success: true, data });
      } else {
        const data = await dashboardService.getAdminFinanceSummary();
        res.json({ success: true, data });
      }
    } catch (err) {
      next(err);
    }
  }
}

