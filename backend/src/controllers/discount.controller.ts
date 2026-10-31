import { Request, Response, NextFunction } from 'express';
import { discountService } from '../services/discount.service';

export class DiscountController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const discounts = await discountService.listDiscounts(req.query.all !== 'true');
      res.json({ success: true, data: discounts });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const discount = await discountService.getDiscountById(req.params.id);
      res.json({ success: true, data: discount });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const discount = await discountService.createDiscount(req.body);
      res.status(201).json({ success: true, data: discount, message: 'Discount rule created.' });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const discount = await discountService.updateDiscount(req.params.id, req.body);
      res.json({ success: true, data: discount, message: 'Discount rule updated.' });
    } catch (err) {
      next(err);
    }
  }
}
