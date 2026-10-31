import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';

export class PaymentController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const payments = await paymentService.listPayments(
        req.user!.role,
        req.user!.customerId
      );
      res.json({ success: true, data: payments });
    } catch (err) {
      next(err);
    }
  }

  static async record(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.recordPayment(req.body, req.user?.id);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Payment successfully recorded.',
      });
    } catch (err) {
      next(err);
    }
  }
}
