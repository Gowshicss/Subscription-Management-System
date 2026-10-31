import { Request, Response, NextFunction } from 'express';
import { planService } from '../services/plan.service';
import { BillingFrequency } from '@prisma/client';

export class PlanController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.activeOnly !== 'false';
      const frequency = req.query.frequency as BillingFrequency;
      const plans = await planService.listPlans({ activeOnly, frequency });
      res.json({ success: true, data: plans });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await planService.getPlanById(req.params.id);
      res.json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await planService.createPlan(req.body);
      res.status(201).json({ success: true, data: plan, message: 'Subscription plan created.' });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await planService.updatePlan(req.params.id, req.body);
      res.json({ success: true, data: plan, message: 'Subscription plan updated.' });
    } catch (err) {
      next(err);
    }
  }

  static async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await planService.toggleActive(req.params.id);
      res.json({ success: true, data: plan, message: 'Plan status updated.' });
    } catch (err) {
      next(err);
    }
  }
}

