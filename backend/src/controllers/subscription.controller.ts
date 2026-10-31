import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/subscription.service';
import { SubscriptionStatus } from '@prisma/client';

export class SubscriptionController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const statusFilter = req.query.status as SubscriptionStatus;
      const subscriptions = await subscriptionService.listSubscriptions(
        req.user!.role,
        req.user!.customerId,
        statusFilter
      );
      res.json({ success: true, data: subscriptions });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await subscriptionService.getSubscriptionById(
        req.params.id,
        req.user!.role,
        req.user!.customerId
      );
      res.json({ success: true, data: subscription });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await subscriptionService.createSubscription(req.body);
      res.status(201).json({ success: true, data: subscription, message: 'Subscription created.' });
    } catch (err) {
      next(err);
    }
  }

  static async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await subscriptionService.confirmSubscription(req.params.id, req.user?.id);
      res.json({ success: true, data: sub, message: 'Subscription confirmed.' });
    } catch (err) {
      next(err);
    }
  }

  static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await subscriptionService.activateSubscription(req.params.id, req.user?.id);
      res.json({ success: true, data: sub, message: 'Subscription activated.' });
    } catch (err) {
      next(err);
    }
  }

  static async pause(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await subscriptionService.pauseSubscription(
        req.params.id,
        req.user!.role,
        req.user!.customerId,
        req.user?.id
      );
      res.json({ success: true, data: sub, message: 'Subscription paused.' });
    } catch (err) {
      next(err);
    }
  }

  static async resume(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await subscriptionService.resumeSubscription(
        req.params.id,
        req.user!.role,
        req.user!.customerId,
        req.user?.id
      );
      res.json({ success: true, data: sub, message: 'Subscription resumed.' });
    } catch (err) {
      next(err);
    }
  }

  static async close(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await subscriptionService.closeSubscription(
        req.params.id,
        req.user!.role,
        req.user!.customerId,
        req.user?.id
      );
      res.json({ success: true, data: sub, message: 'Subscription closed.' });
    } catch (err) {
      next(err);
    }
  }

  static async renew(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await subscriptionService.renewSubscription(
        req.params.id,
        req.user!.role,
        req.user!.customerId,
        req.user?.id
      );
      res.json({ success: true, data: sub, message: 'Subscription renewed.' });
    } catch (err) {
      next(err);
    }
  }
}

